import { NextResponse } from "next/server";
import { isAdminRequest, makeCalendarFeedToken } from "../../../lib/adminAuth";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const origin = new URL(request.url).origin;
  const token = makeCalendarFeedToken();
  return NextResponse.json({ url: `${origin}/api/calendar-feed?key=${token}` });
}
