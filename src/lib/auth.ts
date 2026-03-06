const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60 * 24; // 24 години

export function createSession(): string {
  return "ok";
}

export function verifySession(token: string | undefined): boolean {
  return token === "ok";
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
