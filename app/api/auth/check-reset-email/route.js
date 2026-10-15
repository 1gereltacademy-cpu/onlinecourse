
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const cleanEmail = String(body.email || "").trim().toLowerCase();

    // И-мэйл хаягийн форматыг шалгах
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "И-мэйл хаягаа зөв оруулна уу." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error("Missing Supabase server environment variables");

      return NextResponse.json(
        { error: "Серверийн тохиргоо дутуу байна." },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("listUsers error:", error.message);

        return NextResponse.json(
          { error: "Бүртгэл шалгах үед серверийн алдаа гарлаа." },
          { status: 500 }
        );
      }

      const users = data?.users || [];

      const exists = users.some(
        (user) =>
          user.email?.trim().toLowerCase() === cleanEmail
      );

      if (exists) {
        return NextResponse.json({ exists: true });
      }

      if (users.length < perPage) {
        return NextResponse.json({ exists: false });
      }

      page += 1;
    }
  } catch (error) {
    console.error("Check email API error:", error);

    return NextResponse.json(
      { error: "Хүсэлтийг боловсруулах боломжгүй байна." },
      { status: 500 }
    );
  }
}
