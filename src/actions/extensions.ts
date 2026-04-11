"use server";

import { createClient } from "@/lib/supabase/server";

export async function listExtensions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("extensions")
    .select("slug, name, legal_tradition, extension_type, key_features, maturity")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}
