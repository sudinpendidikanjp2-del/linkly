import type { Express } from "express";
import { createApp } from "../server/app";

let cached: Promise<Express> | null = null;

export default async function handler(req: unknown, res: unknown) {
  cached ??= createApp();
  const app = await cached;
  return (app as unknown as (req: unknown, res: unknown) => void)(req, res);
}
