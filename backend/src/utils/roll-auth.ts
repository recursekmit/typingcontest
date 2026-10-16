import crypto from "crypto";
import MonkeyError from "./error";
import { isDevEnvironment } from "./misc";

/**
 * Session tokens for roll number login (replaces firebase id tokens).
 * Format: HS256 JWT signed with ROLL_AUTH_SECRET.
 */

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 30; // 30 days
const DEV_SECRET = "recurse-dev-secret-do-not-use-in-production";

export type RollTokenPayload = {
  uid: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const secret = process.env["ROLL_AUTH_SECRET"];
  if (secret !== undefined && secret.length >= 32) return secret;
  if (isDevEnvironment()) return DEV_SECRET;
  throw new MonkeyError(
    500,
    "ROLL_AUTH_SECRET is not set (min 32 chars)",
    "roll-auth getSecret",
  );
}

/**
 * throws if the secret is missing in production, call on startup
 */
export function assertSecretConfigured(): void {
  getSecret();
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");
}

export function createToken(user: {
  uid: string;
  email: string;
  name: string;
}): { token: string; expiresAt: number } {
  const iat = Math.floor(Date.now() / 1000);
  const payload: RollTokenPayload = {
    uid: user.uid,
    email: user.email,
    name: user.name,
    iat,
    exp: iat + TOKEN_LIFETIME_SECONDS,
  };
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`);
  return { token: `${header}.${body}.${signature}`, expiresAt: payload.exp };
}

export function verifyToken(token: string): RollTokenPayload {
  const [header, body, signature] = token.split(".");
  if (header === undefined || body === undefined || signature === undefined) {
    throw new MonkeyError(400, "Incorrect Bearer token format");
  }

  const expected = Buffer.from(sign(`${header}.${body}`));
  const actual = Buffer.from(signature);
  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    throw new MonkeyError(401, "Invalid token - please login again");
  }

  let payload: RollTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as RollTokenPayload;
  } catch {
    throw new MonkeyError(400, "Incorrect Bearer token format");
  }

  if (typeof payload.uid !== "string" || payload.uid === "") {
    throw new MonkeyError(401, "Invalid token - please login again");
  }
  if (payload.exp * 1000 < Date.now()) {
    throw new MonkeyError(401, "Token expired - please login again");
  }

  return payload;
}
