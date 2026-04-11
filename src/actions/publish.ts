"use server";

import { createClient } from "@/lib/supabase/server";
import { generateExtensionSchema } from "@/lib/schema-generator";
import type { SchemaFile } from "@/lib/schema-generator";
import { computeFileDiff } from "@/lib/diff";
import type { FileDiff } from "@/lib/diff";
import {
  getFileContent,
  createBranchAndCommit,
  createPullRequest,
} from "@/lib/github";

// ------------------------------------------------------------------
// Get all approved drafts, grouped by extension
// ------------------------------------------------------------------

export type PublishableGroup = {
  extension: {
    slug: string;
    name: string;
    schema_path: string;
    maturity: string;
  };
  drafts: Array<{
    id: string;
    name: string;
    description: string | null;
    schema_type: string;
    schema_definition: Record<string, unknown>;
    coverage_area: string | null;
  }>;
};

export async function getPublishableDrafts(): Promise<PublishableGroup[]> {
  const supabase = await createClient();

  const { data: drafts, error } = await supabase
    .from("property_drafts")
    .select("*")
    .in("status", ["draft", "approved"])
    .order("extension_id");

  if (error) throw new Error(error.message);
  if (!drafts || drafts.length === 0) return [];

  // Gather the extension slugs we need
  const extSlugs = [...new Set(drafts.map((d) => d.extension_id))];
  const { data: extensions, error: extError } = await supabase
    .from("extensions")
    .select("slug, name, schema_path, maturity")
    .in("slug", extSlugs);

  if (extError) throw new Error(extError.message);

  const extMap = new Map(
    (extensions ?? []).map((e) => [e.slug, e]),
  );

  // Group drafts by extension
  const groupMap = new Map<string, PublishableGroup>();

  for (const d of drafts) {
    const ext = extMap.get(d.extension_id);
    if (!ext) continue;

    let group = groupMap.get(d.extension_id);
    if (!group) {
      group = {
        extension: {
          slug: ext.slug,
          name: ext.name,
          schema_path: ext.schema_path ?? `v3/extensions/${ext.slug}`,
          maturity: ext.maturity,
        },
        drafts: [],
      };
      groupMap.set(d.extension_id, group);
    }

    group.drafts.push({
      id: d.id,
      name: d.name,
      description: d.description,
      schema_type: d.schema_type,
      schema_definition: d.schema_definition,
      coverage_area: d.coverage_area,
    });
  }

  return Array.from(groupMap.values());
}

// ------------------------------------------------------------------
// Generate a diff preview (no side-effects)
// ------------------------------------------------------------------

export type PublishPreview = {
  files: SchemaFile[];
  diffs: FileDiff[];
};

export async function generatePreview(
  draftIds: string[],
): Promise<PublishPreview> {
  const supabase = await createClient();

  // Fetch the requested drafts
  const { data: drafts, error } = await supabase
    .from("property_drafts")
    .select("*")
    .in("id", draftIds);

  if (error) throw new Error(error.message);
  if (!drafts || drafts.length === 0) {
    return { files: [], diffs: [] };
  }

  // Gather extensions
  const extSlugs = [...new Set(drafts.map((d) => d.extension_id))];
  const { data: extensions, error: extError } = await supabase
    .from("extensions")
    .select("slug, name, schema_path, maturity")
    .in("slug", extSlugs);

  if (extError) throw new Error(extError.message);

  const extMap = new Map(
    (extensions ?? []).map((e) => [e.slug, e]),
  );

  // Also fetch existing published properties so the generated schema is
  // complete (not just the drafts being published).
  const { data: existingProps } = await supabase
    .from("properties")
    .select("extension_id, name, description, schema_type, schema_definition, coverage_area")
    .in("extension_id", extSlugs);

  // Group drafts + existing properties by extension, preferring drafts
  const files: SchemaFile[] = [];
  const diffs: FileDiff[] = [];

  for (const slug of extSlugs) {
    const ext = extMap.get(slug);
    if (!ext) continue;

    const schemaPath = ext.schema_path ?? `v3/extensions/${slug}`;

    // Merge: start with existing properties, override with drafts
    const propMap = new Map<string, {
      name: string;
      description: string | null;
      schema_type: string;
      schema_definition: Record<string, unknown>;
      coverage_area: string;
    }>();

    for (const p of existingProps ?? []) {
      if (p.extension_id === slug) {
        propMap.set(p.name, {
          name: p.name,
          description: p.description,
          schema_type: p.schema_type,
          schema_definition: p.schema_definition,
          coverage_area: p.coverage_area ?? "",
        });
      }
    }

    for (const d of drafts) {
      if (d.extension_id === slug) {
        propMap.set(d.name, {
          name: d.name,
          description: d.description,
          schema_type: d.schema_type,
          schema_definition: d.schema_definition,
          coverage_area: d.coverage_area ?? "",
        });
      }
    }

    const schemaFile = generateExtensionSchema(
      { slug, name: ext.name, schema_path: schemaPath, maturity: ext.maturity },
      Array.from(propMap.values()),
    );

    files.push(schemaFile);

    // Fetch the current file from GitHub for diffing
    const currentContent = await getFileContent(schemaFile.path);
    diffs.push(computeFileDiff(schemaFile.path, currentContent, schemaFile.content));
  }

  return { files, diffs };
}

// ------------------------------------------------------------------
// Publish: create branch → commit → PR → update DB
// ------------------------------------------------------------------

export async function publishDrafts(data: {
  draftIds: string[];
  title: string;
  description: string;
}): Promise<{ prNumber: number; prUrl: string } | { error: string }> {
  try {
  return await publishDraftsInner(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[publishDrafts] error:", msg);
    return { error: msg };
  }
}

async function publishDraftsInner(data: {
  draftIds: string[];
  title: string;
  description: string;
}): Promise<{ prNumber: number; prUrl: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Generate the preview (which produces the schema files)
  const { files } = await generatePreview(data.draftIds);
  if (files.length === 0) throw new Error("No files to publish");

  // Determine branch name
  const now = new Date();
  const ts = now
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14); // YYYYMMDDHHmmss
  const branchName = `backoffice/publish-${ts}`;

  // Commit to GitHub
  const commitMessage = `${data.title}\n\n${data.description}\n\nPublished via INHERIT Backoffice`;
  await createBranchAndCommit(
    branchName,
    files.map((f) => ({ path: f.path, content: f.content })),
    commitMessage,
  );

  // Open the PR
  const pr = await createPullRequest(branchName, data.title, data.description);

  // Mark drafts as "publishing"
  const { error: updateError } = await supabase
    .from("property_drafts")
    .update({ status: "publishing" })
    .in("id", data.draftIds);

  if (updateError) throw new Error(updateError.message);

  // Record in publish_history
  const { error: historyError } = await supabase
    .from("publish_history")
    .insert({
      pr_number: pr.number,
      pr_url: pr.url,
      branch: branchName,
      title: data.title,
      description: data.description,
      draft_ids: data.draftIds,
      status: "open",
      created_by: user.id,
    });

  if (historyError) throw new Error(historyError.message);

  return { prNumber: pr.number, prUrl: pr.url };
}
