import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  let profile = null;
  let profileError = null;
  if (data.user) {
    const result = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", data.user.id)
      .single();
    profile = result.data;
    profileError = result.error?.message ?? null;
  }

  return NextResponse.json({
    cookies: allCookies.map((c) => ({
      name: c.name,
      valueLength: c.value.length,
    })),
    user: data.user?.email ?? null,
    userId: data.user?.id ?? null,
    authError: error?.message ?? null,
    profile,
    profileError,
  });
}
