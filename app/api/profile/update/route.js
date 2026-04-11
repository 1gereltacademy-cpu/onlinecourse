
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function normalizePhone(value) {
  return (value || "").replace(/\D/g, "");
}

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
    }

    const supabase = createClient(
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
    }

    const body = await req.json();
    const full_name = (body.full_name || "").trim();
    const phone = normalizePhone(body.phone);

    if (!full_name || !phone) {
      return NextResponse.json(
        { error: "Овог нэр болон утасны дугаараа бөглөнө үү." },
        { status: 400 }
      );
    }

    if (phone.length < 8) {
      return NextResponse.json(
        { error: "Утасны дугаар буруу байна." },
        { status: 400 }
      );
    }

    const { data: duplicatePhone } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .neq("id", user.id)
      .limit(1);

    if (duplicatePhone?.length) {
      return NextResponse.json(
        { error: "Энэ утасны дугаарыг өөр хэрэглэгч ашиглаж байна." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
