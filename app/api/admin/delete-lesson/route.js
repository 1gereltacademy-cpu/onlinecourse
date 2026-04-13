import { NextResponse } from "next/server";

// 👇 ЭНЭ import замыг өөрийн төслийн helper-т тааруулж солиорой.
// Жишээ нь:
// import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Lesson id ирээгүй байна" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    const { data: lesson, error: findError } = await supabase
      .from("lessons")
      .select("id, thumbnail_url")
      .eq("id", id)
      .single();

    if (findError || !lesson) {
      return NextResponse.json(
        { error: "Lesson олдсонгүй" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("lessons")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Lesson устгахад алдаа гарлаа" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lesson амжилттай устлаа",
    });
  } catch (error) {
    console.error("delete-lesson api error:", error);

    return NextResponse.json(
      { error: error.message || "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
  
}
