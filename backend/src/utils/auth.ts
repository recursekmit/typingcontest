import FirebaseAdmin from "./../init/firebase-admin";
import { verifyToken } from "./roll-auth";
import { type DecodedIdToken, UserRecord } from "firebase-admin/auth";
import { getFrontendUrl } from "./misc";
import emailQueue from "../queues/email-queue";
import * as UserDAL from "../dal/user";
import { isFirebaseError } from "./error";

/**
 * verifies a roll number session token (see roll-auth.ts).
 * firebase id tokens are no longer accepted.
 */
export async function verifyIdToken(
  idToken: string,
  _noCache = false,
): Promise<DecodedIdToken> {
  const payload = verifyToken(idToken);
  return {
    uid: payload.uid,
    sub: payload.uid,
    email: payload.email,
    email_verified: true,
    name: payload.name,
    iat: payload.iat,
    exp: payload.exp,
    auth_time: payload.iat,
  } as unknown as DecodedIdToken;
}

export async function updateUserEmail(
  uid: string,
  email: string,
): Promise<UserRecord> {
  await revokeTokensByUid(uid);
  return await FirebaseAdmin().auth().updateUser(uid, {
    email,
    emailVerified: false,
  });
}

export async function updateUserPassword(
  uid: string,
  password: string,
): Promise<UserRecord> {
  await revokeTokensByUid(uid);
  return await FirebaseAdmin().auth().updateUser(uid, {
    password,
  });
}

// roll number users only exist in the database, there is no auth user to delete
export async function deleteUser(_uid: string): Promise<void> {
  //
}

// roll number session tokens are stateless and expire on their own
export async function revokeTokensByUid(_uid: string): Promise<void> {
  //
}

export async function sendForgotPasswordEmail(email: string): Promise<void> {
  try {
    const uid = (await FirebaseAdmin().auth().getUserByEmail(email)).uid;
    const { name } = await UserDAL.getPartialUser(
      uid,
      "request forgot password email",
      ["name"],
    );

    const link = await FirebaseAdmin()
      .auth()
      .generatePasswordResetLink(email, { url: getFrontendUrl() });

    await emailQueue.sendForgotPasswordEmail(email, name, link);
  } catch (err) {
    if (isFirebaseError(err) && err.errorInfo.code !== "auth/user-not-found") {
      // oxlint-disable-next-line only-throw-error
      throw err;
    }
  }
}
