import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { asyncHandler, queryString } from "../lib/http";
import { ANALYTICS_RANGES } from "../../src/shared/constants";
import type { AnalyticsDTO, CountItem } from "../../src/shared/types";

export const analyticsRouter = Router();

function resolveRange(value: number): number {
  return (ANALYTICS_RANGES as readonly number[]).includes(value) ? value : 30;
}

function resolveTimeZone(value: string | undefined): string {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

function localDays(range: number, timeZone: string): string[] {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const days: string[] = [];
  for (let offset = range - 1; offset >= 0; offset--) {
    days.push(formatter.format(new Date(Date.now() - offset * 86_400_000)));
  }
  return days;
}

type Grouped = { name: string | null; _count: { _all: number } }[];

function toCounts(rows: Grouped, fallback: string): CountItem[] {
  return rows.map((row) => ({ name: row.name ?? fallback, count: row._count._all }));
}

export async function buildAnalytics(
  userId: string,
  options: { linkId?: string; range?: number; tz?: string },
): Promise<AnalyticsDTO> {
  const range = resolveRange(options.range ?? 30);
  const timeZone = resolveTimeZone(options.tz);
  const now = new Date();
  const since = new Date(now.getTime() - (range + 1) * 86_400_000);
  const where: Prisma.ClickWhereInput = {
    timestamp: { gte: since },
    link: { userId },
    ...(options.linkId ? { linkId: options.linkId } : {}),
  };
  const linkFilter = options.linkId ? Prisma.sql`AND c."linkId" = ${options.linkId}` : Prisma.empty;

  const group = (by: "device" | "browser" | "os" | "country" | "referrer") =>
    prisma.click.groupBy({
      by: [by],
      where,
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    });

  const [
    seriesRows,
    visitorRows,
    clicks,
    qrScans,
    totalLinks,
    activeLinks,
    devices,
    browsers,
    systems,
    countries,
    referrers,
    top,
    recent,
  ] = await Promise.all([
    prisma.$queryRaw<{ day: string; clicks: number; visitors: number }[]>`
      SELECT to_char((c."timestamp" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS day,
             count(*)::int AS clicks,
             count(DISTINCT c."visitorHash")::int AS visitors
      FROM "Click" c JOIN "Link" l ON l."id" = c."linkId"
      WHERE l."userId" = ${userId} AND c."timestamp" >= ${since} ${linkFilter}
      GROUP BY 1`,
    prisma.$queryRaw<{ visitors: number }[]>`
      SELECT count(DISTINCT c."visitorHash")::int AS visitors
      FROM "Click" c JOIN "Link" l ON l."id" = c."linkId"
      WHERE l."userId" = ${userId} AND c."timestamp" >= ${since} ${linkFilter}`,
    prisma.click.count({ where }),
    prisma.click.count({ where: { ...where, isQrScan: true } }),
    prisma.link.count({ where: { userId } }),
    prisma.link.count({
      where: {
        userId,
        isEnabled: true,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        ],
      },
    }),
    group("device").then((rows) => toCounts(rows.map((r) => ({ name: r.device, _count: r._count })), "Unknown")),
    group("browser").then((rows) => toCounts(rows.map((r) => ({ name: r.browser, _count: r._count })), "Unknown")),
    group("os").then((rows) => toCounts(rows.map((r) => ({ name: r.os, _count: r._count })), "Unknown")),
    group("country").then((rows) => toCounts(rows.map((r) => ({ name: r.country, _count: r._count })), "Unknown")),
    group("referrer").then((rows) => toCounts(rows.map((r) => ({ name: r.referrer, _count: r._count })), "Direct")),
    options.linkId
      ? Promise.resolve([])
      : prisma.click.groupBy({
          by: ["linkId"],
          where,
          _count: { _all: true },
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),
    prisma.click.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 12,
      include: { link: { select: { id: true, title: true, slug: true } } },
    }),
  ]);

  const byDay = new Map(seriesRows.map((row) => [row.day, row]));
  const series = localDays(range, timeZone).map((date) => ({
    date,
    clicks: byDay.get(date)?.clicks ?? 0,
    visitors: byDay.get(date)?.visitors ?? 0,
  }));

  const topLinkRows = top.length
    ? await prisma.link.findMany({ where: { id: { in: top.map((row) => row.linkId) } }, select: { id: true, title: true, slug: true } })
    : [];
  const topLinks = top.flatMap((row) => {
    const link = topLinkRows.find((candidate) => candidate.id === row.linkId);
    return link ? [{ id: link.id, title: link.title, slug: link.slug, clicks: row._count._all }] : [];
  });

  return {
    range,
    totals: { clicks, visitors: visitorRows[0]?.visitors ?? 0, qrScans, links: totalLinks, activeLinks },
    series,
    devices,
    browsers,
    systems,
    countries,
    referrers,
    topLinks,
    recent: recent.map((click) => ({
      id: click.id,
      timestamp: click.timestamp.toISOString(),
      linkId: click.link.id,
      linkTitle: click.link.title,
      slug: click.link.slug,
      country: click.country,
      city: click.city,
      device: click.device,
      os: click.os,
      browser: click.browser,
      referrer: click.referrer,
      isQrScan: click.isQrScan,
    })),
  };
}

export function buildLinkAnalytics(userId: string, linkId: string, range: number, tz?: string) {
  return buildAnalytics(userId, { linkId, range, tz });
}

analyticsRouter.get(
  "/overview",
  asyncHandler(async (req, res) => {
    res.json(
      await buildAnalytics(req.user!.id, {
        range: Number(queryString(req.query.range)),
        tz: queryString(req.query.tz),
      }),
    );
  }),
);
