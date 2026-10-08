import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { env } from "../env";

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt);
  return `s1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [version, saltPart, keyPart] = stored.split("$");
  if (version !== "s1" || !saltPart || !keyPart) return false;
  const key = await scrypt(password, Buffer.from(saltPart, "base64url"));
  return safeEqual(key.toString("base64url"), keyPart);
}

export function hmac(value: string): string {
  return createHmac("sha256", env.sessionSecret).update(value).digest("base64url");
}

/** Produces `payload.signature`. The payload is opaque to the signer. */
export function signToken(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

export function readToken<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(hmac(body), signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomId(): string {
  return randomBytes(16).toString("base64url");
}
