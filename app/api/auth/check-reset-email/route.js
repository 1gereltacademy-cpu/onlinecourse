
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { email } = await request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "И-мэйл хаягаа зөв оруулна уу." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    let page = 1;
    const perPage = 1000;
    let found = false;

    while (true) {
      const { data, error } =
        await supabase.auth.admin.listUsers({
          page,
          perPage,
        });

      if (error) {
        console.error("Check reset email error:", error.message);
        return NextResponse.json(
          { error: "И-мэйл шалгах үед серверийн алдаа гарлаа." },
          { status: 500 }
        );
      }

      found = data.users.some(
        (user) =>
          user.email?.toLowerCase() === cleanEmail
      );

      if (found || data.users.length < perPage) break;
      page++;
    }

    return NextResponse.json({ exists: found });
  } catch (error) {
    console.error("Check reset email failed:", error.message);

    return NextResponse.json(
      { error: "Хүсэлтийг боловсруулах боломжгүй байна." },
      { status: 500 }
    );
  }
}
