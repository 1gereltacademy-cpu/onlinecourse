
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Нэвтэрч орно уу." },
        { status: 401 }
      );
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Нэвтрэлт хүчингүй байна." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Админ эрх шаардлагатай." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID олдсонгүй." },
        { status: 400 }
      );
    }

    const allowedFields = [
      "title",
      "description",
      "price_mnt",
      "thumbnail_url",
      "category",
      "level",
      "is_premium",
      "is_published",
      "bank_name",
      "bank_account_name",
      "bank_account_number",
      "payment_qr_url",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Өөрчлөх мэдээлэл алга." },
        { status: 400 }
      );
    }

    if (Object.hasOwn(updates, "price_mnt")) {
      const price = Number(updates.price_mnt);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: "Үнэ буруу байна." },
          { status: 400 }
        );
      }

      updates.price_mnt = price;
    }

    const { data, error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update course error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/courses/${id}`);

    return NextResponse.json({ course: data });
  } catch (error) {
    console.error("Update course API error:", error);

    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа. Terminal дээрх мэдээллийг шалгана уу." },
      { status: 500 }
    );
  }
}
