import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { makeCalendarFeedToken } from "../../../lib/adminAuth";
import { buildICSCalendar, budapestLocalToUTC } from "../../../lib/utils";
import { SERVICE } from "../../../lib/theme";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key || key !== makeCalendarFeedToken()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .gte("date", todayStr)
    .order("date", { ascending: true })
    .order("start_minutes", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = (data || []).map((b) => {
    const [y, m, d] = b.date.split("-").map(Number);
    const start = budapestLocalToUTC(y, m, d, Math.floor(b.start_minutes / 60), b.start_minutes % 60);
    return {
      uid: `${b.id}@hajszalpontosan-feed`,
      title: `${SERVICE.name} — ${b.name}`,
      description: `Ügyfél: ${b.name} (${b.phone})`,
      location: "Hajszál Pontosan Fodrászat",
      start,
      durationMinutes: b.duration,
    };
  });

  const ics = buildICSCalendar(events, "Hajszál Pontosan – Foglalások");
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="hajszal-pontosan.ics"',
      "Cache-Control": "no-store",
    },
  });
}
