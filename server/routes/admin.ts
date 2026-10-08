import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, parse } from "../lib/http";

export const adminRouter = Router();

adminRouter.patch(
  "/settings",
  asyncHandler(async (req, res) => {
    const { registrationEnabled } = parse(z.object({ registrationEnabled: z.boolean() }), req.body);
    const settings = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", registrationEnabled },
      update: { registrationEnabled },
    });
    res.json({ registrationEnabled: settings.registrationEnabled });
  }),
);
