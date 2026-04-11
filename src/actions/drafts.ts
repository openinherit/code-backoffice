"use server";

import { createClient } from "@/lib/supabase/server";
import type { PropertyDraftRow } from "@/lib/supabase/types";

// ------------------------------------------------------------------
// Composite type for draft with author info
// ------------------------------------------------------------------

export type DraftWithAuthor = Pick<
  PropertyDraftRow,
  | "id"
  | "property_id"
  | "extension_id"
  | "coverage_area"
  | "name"
  | "description"
  | "schema_type"
  | "schema_definition"
  | "status"
  | "author_id"
  | "reviewer_id"
  | "review_note"
  | "created_at"
  | "updated_at"
> & {
  author_email: string;
  author_name: string | null;
  organisation_name: string | null;
  organisation_slug: string | null;
  extension_name: string;
};

// ------------------------------------------------------------------
// List all partner drafts (admin review page)
// ------------------------------------------------------------------

export async function listPartnerDrafts(): Promise<DraftWithAuthor[]> {
  const supabase = await createClient();

  const { data: drafts, error } = await supabase
    .from("property_drafts")
    .select("*")
    .in("status", ["partner_draft", "approved", "rejected"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!drafts || drafts.length === 0) return [];

  // Gather author IDs
  const authorIds = [...new Set(drafts.map((d) => d.author_id))];
  const { data: authors } = await supabase
    .from("profiles")
    .select("id, email, display_name, organisation_id")
    .in("id", authorIds);

  // Gather org IDs
  const orgIds = [
    ...new Set(
      (authors ?? [])
        .map((a) => a.organisation_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const orgMap = new Map<string, { name: string; slug: string }>();
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("organisations")
      .select("id, name, slug")
      .in("id", orgIds);
    for (const org of orgs ?? []) {
      orgMap.set(org.id, { name: org.name, slug: org.slug });
    }
  }

  // Extension name map
  const extSlugs = [...new Set(drafts.map((d) => d.extension_id))];
  const { data: extensions } = await supabase
    .from("extensions")
    .select("slug, name")
    .in("slug", extSlugs);

  const extMap = new Map<string, string>();
  for (const e of extensions ?? []) {
    extMap.set(e.slug, e.name);
  }

  // Author map
  const authorMap = new Map<
    string,
    { email: string; display_name: string | null; organisation_id: string | null }
  >();
  for (const a of authors ?? []) {
    authorMap.set(a.id, a);
  }

  return drafts.map((d) => {
    const author = authorMap.get(d.author_id);
    const org = author?.organisation_id
      ? orgMap.get(author.organisation_id)
      : null;

    return {
      id: d.id,
      property_id: d.property_id,
      extension_id: d.extension_id,
      coverage_area: d.coverage_area,
      name: d.name,
      description: d.description,
      schema_type: d.schema_type,
      schema_definition: d.schema_definition,
      status: d.status,
      author_id: d.author_id,
      reviewer_id: d.reviewer_id,
      review_note: d.review_note,
      created_at: d.created_at,
      updated_at: d.updated_at,
      author_email: author?.email ?? "Unknown",
      author_name: author?.display_name ?? null,
      organisation_name: org?.name ?? null,
      organisation_slug: org?.slug ?? null,
      extension_name: extMap.get(d.extension_id) ?? d.extension_id,
    };
  });
}

// ------------------------------------------------------------------
// Approve a draft
// ------------------------------------------------------------------

export async function approveDraft(draftId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("property_drafts")
    .update({
      status: "approved",
      reviewer_id: user.id,
    })
    .eq("id", draftId);

  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------
// Reject a draft
// ------------------------------------------------------------------

export async function rejectDraft(draftId: string, note: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("property_drafts")
    .update({
      status: "rejected",
      reviewer_id: user.id,
      review_note: note,
    })
    .eq("id", draftId);

  if (error) throw new Error(error.message);
}
