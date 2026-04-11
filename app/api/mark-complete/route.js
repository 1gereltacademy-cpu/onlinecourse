import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const body = await req.json();

  const browserSafeClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const authHeader = req.headers.get("authorization");
  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data } = await browserSafeClient.auth.getUser(token);
    user = data.user;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert({
      user_id: user.id,
      lesson_id: body.lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ progress: data });
}
