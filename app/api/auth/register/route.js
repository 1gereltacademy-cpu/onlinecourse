import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizePhone(value) {
  return (value || "").replace(/\D/g, "").slice(0, 8);
}

function normalizeRegisterNumber(value) {
  return (value || "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 10);
}

export async function POST(req) {
  try {
    const body = await req.json();

    const full_name = String(body.full_name || "").trim();
    const phone = normalizePhone(body.phone);
    const register_number = normalizeRegisterNumber(body.register_number);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!full_name || !phone || !register_number || !email || !password) {
      return NextResponse.json(
        { error: "Бүх талбарыг бөглөнө үү." },
        { status: 400 }
      );
    }

    if (!/^\d{8}$/.test(phone)) {
      return NextResponse.json(
        { error: "Утасны дугаар яг 8 оронтой тоо байх ёстой." },
        { status: 400 }
      );
    }

    if (!/^[А-ЯӨҮЁ]{2}\d{8}$/.test(register_number)) {
      return NextResponse.json(
        {
          error:
            "Регистрийн эхний 2 тэмдэгт крилл том үсэг, дараагийн 8 нь тоо байх ёстой.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Нууц үг хамгийн багадаа 6 тэмдэгттэй байна." },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY байхгүй байна." },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey
    );

    const { data: phoneExists, error: phoneError } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .limit(1);

    if (phoneError) {
      return NextResponse.json({ error: phoneError.message }, { status: 500 });
    }

    if (phoneExists?.length) {
      return NextResponse.json(
        { error: "Энэ утасны дугаараар бүртгэл үүссэн байна." },
        { status: 400 }
      );
    }

    const { data: regExists, error: regError } = await supabase
      .from("profiles")
      .select("id")
      .eq("register_number", register_number)
      .limit(1);

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    if (regExists?.length) {
      return NextResponse.json(
        { error: "Энэ регистрийн дугаараар бүртгэл үүссэн байна." },
        { status: 400 }
      );
    }

    const { data: createdUser, error: createUserError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createUserError) {
      const msg =
        createUserError.message ===
        "A user with this email address has already been registered"
          ? "Энэ и-мэйлээр бүртгэл үүссэн байна."
          : createUserError.message;

      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userId = createdUser?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Auth хэрэглэгч үүссэнгүй." },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase.from("profiles").insert({
           id: userId,
           full_name: full_name,
           name: full_name,
           email: email,
           phone,
           register_number,
            role: "user",
        });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
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