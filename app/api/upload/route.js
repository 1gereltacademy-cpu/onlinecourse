import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = getSupabaseServer();

  const formData = await req.formData();
  const file = formData.get("file");

  const fileName = Date.now() + "-" + file.name;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, file);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: publicUrl } = supabase.storage
    .from("images")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl.publicUrl });
}