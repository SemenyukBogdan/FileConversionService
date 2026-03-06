import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo123";
const SESSION_COOKIE = "session";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  if (password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
