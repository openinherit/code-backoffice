import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Session is set — redirect to extensions.
      // The admin/partner layouts handle role-based routing.
      return NextResponse.redirect(`${origin}/extensions`);
    }

    console.error("[auth/callback] exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login`);
}
