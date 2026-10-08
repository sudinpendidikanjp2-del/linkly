import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler, HttpError, parse } from "../lib/http";
import { hashPassword, verifyPassword } from "../lib/crypto";
import { endSession } from "../lib/session";
import { toUserDTO } from "../lib/dto";
import { passwordChangeSchema, profileSchema } from "../../src/shared/schemas";
import { z } from "zod";

export const accountRouter = Router();

accountRouter.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const input = parse(profileSchema, req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: input.name, avatarUrl: input.avatarUrl },
    });
    res.json({ user: toUserDTO(user) });
  }),
);

accountRouter.post(
  "/password",
  asyncHandler(async (req, res) => {
    const input = parse(passwordChangeSchema, req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (user.passwordHash) {
      const valid = input.currentPassword ? await verifyPassword(input.currentPassword, user.passwordHash) : false;
      if (!valid) throw new HttpError(400, "wrong_password", "Current password is incorrect.", { currentPassword: "wrong_password" });
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.newPassword) } });
    res.json({ ok: true });
  }),
);

accountRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    const input = parse(z.object({ password: z.string().max(72).optional() }), req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (user.passwordHash) {
      const valid = input.password ? await verifyPassword(input.password, user.passwordHash) : false;
      if (!valid) throw new HttpError(400, "wrong_password", "Password is incorrect.", { password: "wrong_password" });
    }
    await prisma.user.delete({ where: { id: user.id } });
    endSession(res);
    res.json({ ok: true });
  }),
);
