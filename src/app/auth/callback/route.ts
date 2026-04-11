import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("[auth/callback] code present:", !!code);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("[auth/callback] user:", user?.email, "id:", user?.id);

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        console.log("[auth/callback] profile:", profile, "error:", profileError?.message);

        if (profile?.role === "admin") {
          return NextResponse.redirect(`${origin}/extensions`);
        }
        return NextResponse.redirect(`${origin}/`);
      }
    }
  }

  console.log("[auth/callback] falling through to /login");
  return NextResponse.redirect(`${origin}/login`);
}
