import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { isAdminRequest } from "../../../lib/adminAuth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const all = searchParams.get("all");

  if (all === "true") {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("start_minutes", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookings: data });
  }

  if (!date) return NextResponse.json({ error: "date szukseges" }, { status: 400 });

  // publikus lekérdezés: csak az időpont és időtartam látszik, ügyfél adat nem
  const { data, error } = await supabase
    .from("bookings")
    .select("start_minutes, duration")
    .eq("date", date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { date, startMinutes, duration, name, phone, paid, amount } = body;

  if (!date || startMinutes == null || !duration || !name || !phone) {
    return NextResponse.json({ error: "hiányzó mezők" }, { status: 400 });
  }
  if (/[a-zA-Z]/.test(phone)) {
    return NextResponse.json({ error: "érvénytelen telefonszám" }, { status: 400 });
  }
  const digitCount = (phone.match(/\d/g) || []).length;
  if (digitCount < 9) {
    return NextResponse.json({ error: "érvénytelen telefonszám" }, { status: 400 });
  }
  if (!name.trim()) {
    return NextResponse.json({ error: "hiányzó név" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      date,
      start_minutes: startMinutes,
      duration,
      name: name.trim(),
      phone: phone.trim(),
      paid: !!paid,
      amount: amount || null,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique constraint (date, start_minutes) - valaki kozben lefoglalta
    if (error.code === "23505") {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ booking: data });
}

export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id szukseges" }, { status: 400 });
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
