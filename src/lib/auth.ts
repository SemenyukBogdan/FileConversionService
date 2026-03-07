const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60 * 24; // 24 години

export function createSession(userId: string): string {
  return Buffer.from(userId, "utf8").toString("base64url");
}

const UUID_REGEX = /^[a-f0-9-]{36}$/i;

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const userId = Buffer.from(token, "base64url").toString("utf8");
    return userId && UUID_REGEX.test(userId) ? userId : null;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };
}

export { SESSION_COOKIE };
