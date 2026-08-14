import { NextResponse } from "next/server";
import { ADMIN_COOKIE, makeSessionToken } from "../../../lib/adminAuth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;
  if (!password || !process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Hibás jelszó" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
