"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveDraft(data: {
  extensionId: string;
  propertyId?: string;
  coverageArea: string;
  name: string;
  description?: string;
  schemaType: string;
  schemaDefinition: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: draft, error } = await supabase
    .from("property_drafts")
    .upsert(
      {
        extension_id: data.extensionId,
        property_id: data.propertyId ?? null,
        coverage_area: data.coverageArea,
        name: data.name,
        description: data.description ?? null,
        schema_type: data.schemaType,
        schema_definition: data.schemaDefinition,
        status: "partner_draft",
        author_id: user.id,
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return draft;
}

export async function discardDraft(draftId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("property_drafts")
    .delete()
    .eq("id", draftId);

  if (error) throw new Error(error.message);
}

export async function listSharedDefinitions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shared_definitions")
    .select("id, name, description, field_summary")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listPropertyGroups(
  extensionSlug: string,
  coverageArea: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_groups")
    .select("id, name, description, display_order")
    .eq("extension_id", extensionSlug)
    .eq("coverage_area", coverageArea)
    .order("display_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}
