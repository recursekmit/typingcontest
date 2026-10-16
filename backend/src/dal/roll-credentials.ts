import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import * as db from "../init/db";

/**
 * Passwords of roll number accounts. Kept in their own collection so a hash can
 * never end up in a user document that is sent to the frontend.
 */

type DBRollCredential = {
  _id: string; // uid
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
};

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

function getCollection(): ReturnType<typeof db.collection<DBRollCredential>> {
  return db.collection<DBRollCredential>("rollCredentials");
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function hasPassword(uid: string): Promise<boolean> {
  return (await getCollection().countDocuments({ _id: uid })) > 0;
}

export async function setPassword(
  uid: string,
  password: string,
): Promise<void> {
  const now = Date.now();
  await getCollection().updateOne(
    { _id: uid },
    {
      $set: { passwordHash: await hashPassword(password), updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

/** false when the uid has no password or the password does not match */
export async function verifyPassword(
  uid: string,
  password: string,
): Promise<boolean> {
  const credential = await getCollection().findOne({ _id: uid });
  if (credential === null) return false;

  const [, saltHex, hashHex] = credential.passwordHash.split("$");
  if (saltHex === undefined || hashHex === undefined) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length,
  );
  return timingSafeEqual(expected, actual);
}
