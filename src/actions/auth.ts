"use server";

import { createClient } from "@/lib/supabase/server";

export type UserContext = {
  email: string;
  role: string;
  display_name: string | null;
  organisation_name: string | null;
  organisation_slug: string | null;
  assignments: Array<{
    extension_id: string;
    succession: boolean;
    tax: boolean;
  }>;
};

export async function getUserContext(
  email: string,
): Promise<UserContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_user_context", {
    lookup_email: email,
  });

  if (error || !data) return null;
  return data as UserContext;
}

export async function sendMagicLink(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
