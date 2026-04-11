"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  ExtensionRow,
  PropertyGroupRow,
  PropertyRow,
  PropertyDraftRow,
} from "@/lib/supabase/types";

export async function listExtensions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("extensions")
    .select(
      `
      slug, name, legal_tradition, extension_type, key_features, maturity, metadata,
      properties (coverage_area)
    `,
    )
    .order("name");

  if (error) throw new Error(error.message);
  // Cast because the manual Database type lacks relationship metadata for
  // the nested select; PostgREST returns arrays at runtime.
  return (data ?? []) as unknown as ListExtension[];
}

/** Shape returned by listExtensions() — extension with nested property rows. */
export type ListExtension = {
  slug: string;
  name: string;
  legal_tradition: string | null;
  extension_type: string;
  key_features: string | null;
  maturity: string;
  metadata: Record<string, unknown>;
  properties: { coverage_area: string | null }[];
};

/** Extension with joined property groups, properties, and drafts. */
export type ExtensionDetail = ExtensionRow & {
  property_groups: Pick<
    PropertyGroupRow,
    "id" | "coverage_area" | "name" | "description" | "display_order"
  >[];
  properties: Pick<
    PropertyRow,
    "id" | "coverage_area" | "group_id" | "name" | "description" | "schema_type" | "schema_definition"
  >[];
  property_drafts: Pick<
    PropertyDraftRow,
    | "id"
    | "property_id"
    | "coverage_area"
    | "name"
    | "description"
    | "schema_type"
    | "schema_definition"
    | "status"
    | "author_id"
    | "created_at"
    | "updated_at"
  >[];
};

export async function getExtension(slug: string): Promise<ExtensionDetail> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("extensions")
    .select(
      `
      *,
      property_groups (id, coverage_area, name, description, display_order),
      properties (id, coverage_area, group_id, name, description, schema_type, schema_definition),
      property_drafts (id, property_id, coverage_area, name, description, schema_type, schema_definition, status, author_id, created_at, updated_at)
    `,
    )
    .eq("slug", slug)
    .single();

  if (error) throw new Error(error.message);
  // The manual Database type lacks relationship metadata, so PostgREST returns
  // arrays at runtime but the generated TS type is a single object. Cast to the
  // correct shape.
  return data as unknown as ExtensionDetail;
}
