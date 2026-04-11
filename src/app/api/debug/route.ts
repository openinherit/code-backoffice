import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return NextResponse.json({
    cookies: allCookies.map((c) => ({
      name: c.name,
      valueLength: c.value.length,
      valueStart: c.value.substring(0, 30),
    })),
    user: data.user?.email ?? null,
    error: error?.message ?? null,
  });
}
