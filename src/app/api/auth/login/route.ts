import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSession,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo123";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  if (password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createSession();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());

  return NextResponse.json({ ok: true });
}
