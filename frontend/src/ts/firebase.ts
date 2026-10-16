/**
 * Authentication for Recurse Type.
 *
 * Firebase auth was replaced with roll number login: the backend issues a
 * session token (see backend/src/utils/roll-auth.ts) which is stored in
 * localStorage and sent as the Bearer token. The exported functions keep the
 * old firebase-shaped api so the rest of the app does not need to change.
 */
import type { User, UserCredential, AuthProvider } from "firebase/auth";
import type { Analytics as AnalyticsType } from "firebase/analytics";
import { promiseWithResolvers } from "./utils/misc";
import { setUserId, setUserVerified } from "./states/core";

const SESSION_KEY = "recurseSession";

export type RollSession = {
  token: string;
  uid: string;
  email: string;
  name: string;
  /** unix seconds */
  expiresAt: number;
};

type ReadyCallback = (success: boolean, user: User | null) => Promise<void>;
let readyCallback: ReadyCallback | undefined;
let session: RollSession | null = null;
let initialized = false;

const { promise: authPromise, resolve: resolveAuthPromise } =
  promiseWithResolvers();

function isExpired(s: RollSession): boolean {
  return s.expiresAt * 1000 < Date.now();
}

function loadSession(): RollSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as RollSession;
    if (
      typeof parsed.token !== "string" ||
      typeof parsed.uid !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      isExpired(parsed)
    ) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(s: RollSession | null): void {
  try {
    if (s === null) {
      window.localStorage.removeItem(SESSION_KEY);
    } else {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    }
  } catch (e) {
    console.error("Failed to store session", e);
  }
}

function toUser(s: RollSession): User {
  return {
    uid: s.uid,
    email: s.email,
    displayName: s.name,
    emailVerified: true,
    isAnonymous: false,
    providerData: [],
  } as unknown as User;
}

export async function init(callback: ReadyCallback): Promise<void> {
  try {
    readyCallback = callback;
    initialized = true;
    session = loadSession();
    const user = session === null ? null : toUser(session);
    setUserState(user);
    await callback(true, user);
  } finally {
    resolveAuthPromise();
  }
}

/**
 *
 * @returns the current user if authenticated, else `null`
 */
export function getAuthenticatedUser(): User | null {
  if (session === null) return null;
  if (isExpired(session)) {
    void signOut();
    return null;
  }
  return toUser(session);
}

export function getRollSession(): RollSession | null {
  return session;
}

export function getAnalytics(): AnalyticsType {
  throw new Error("Analytics unavailable");
}

export function isAuthAvailable(): boolean {
  return initialized;
}

/**
 * stores a session returned by the roll login endpoint and signs the user in
 */
export async function startRollSession(newSession: RollSession): Promise<void> {
  session = newSession;
  saveSession(newSession);
  const user = toUser(newSession);
  setUserState(user);
  await readyCallback?.(true, user);
}

export async function signOut(): Promise<void> {
  console.log("auth signout");
  session = null;
  saveSession(null);
  setUserState(null);
  await readyCallback?.(true, null);
}

export async function signInWithEmailAndPassword(
  _email: string,
  _password: string,
  _rememberMe: boolean,
): Promise<UserCredential> {
  throw new Error("Please sign in with your roll number");
}

export function setUserState(
  options: {
    uid: string;
    emailVerified: boolean;
  } | null,
): void {
  if (options === null) {
    setUserId(null);
    setUserVerified(false);
  } else {
    setUserId(options.uid);
    setUserVerified(options.emailVerified);
  }
}

export async function signInWithPopup(
  _provider: AuthProvider,
  _rememberMe: boolean,
): Promise<void> {
  throw new Error("Please sign in with your roll number");
}

export async function createUserWithEmailAndPassword(
  _email: string,
  _password: string,
): Promise<UserCredential> {
  throw new Error("Please sign in with your roll number");
}

export async function getIdToken(): Promise<string | null> {
  if (getAuthenticatedUser() === null) return null;
  return session?.token ?? null;
}

export function resetIgnoreAuthCallback(): void {
  //
}

export { authPromise };
