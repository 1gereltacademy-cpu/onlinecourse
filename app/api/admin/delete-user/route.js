import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    // 🔐 Login шалгах
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 👤 user авах (browser эрхээр)
    const browserSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const {
      data: { user },
    } = await browserSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🛡 admin эсэхийг шалгах
    const { data: myProfile } = await browserSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (myProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🧾 request body
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId шаардлагатай" },
        { status: 400 }
      );
    }

    // ❌ өөрийгөө устгахгүй
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Өөрийгөө устгах боломжгүй" },
        { status: 400 }
      );
    }

    // 🔑 service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY байхгүй байна" },
        { status: 500 }
      );
    }

    // 🚀 full access supabase client
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey
    );

    // 🧹 холбоотой data устгах
    await serviceSupabase
      .from("payment_orders")
      .delete()
      .eq("user_id", userId);

    await serviceSupabase
      .from("enrollments")
      .delete()
      .eq("user_id", userId);

    await serviceSupabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    // 🔥 хамгийн чухал — AUTH account устгах
    const { error: authDeleteError } =
      await serviceSupabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      return NextResponse.json(
        { error: authDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}