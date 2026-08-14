import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { isAdminRequest } from "../../../lib/adminAuth";

export async function GET() {
  // publikus: az ügyfélnek is látnia kell, mely napok vannak zárva
  const { data, error } = await supabase
    .from("closures")
    .select("*")
    .order("start_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ closures: data });
}

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { start, end, reason } = body;
  if (!start || !end) return NextResponse.json({ error: "start és end szukseges" }, { status: 400 });

  const { data, error } = await supabase
    .from("closures")
    .insert({ start_date: start, end_date: end, reason: reason || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ closure: data });
}

export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id szukseges" }, { status: 400 });
  const { error } = await supabase.from("closures").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
