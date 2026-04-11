"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  OrganisationRow,
  OrganisationAssignmentRow,
  ProfileRow,
  InvitationRow,
  PropertyDraftRow,
} from "@/lib/supabase/types";

// ------------------------------------------------------------------
// Admin client for privileged operations (e.g. sending invite emails)
// ------------------------------------------------------------------

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ------------------------------------------------------------------
// Composite types returned by queries
// ------------------------------------------------------------------

export type OrganisationWithDetails = OrganisationRow & {
  assignments: (Pick<OrganisationAssignmentRow, "id" | "extension_id" | "succession" | "tax"> & {
    extension_name?: string;
  })[];
  users: Pick<ProfileRow, "id" | "email" | "display_name" | "role" | "created_at">[];
  invitations: Pick<InvitationRow, "id" | "email" | "role" | "accepted_at" | "expires_at" | "created_at">[];
  drafts: Pick<
    PropertyDraftRow,
    | "id"
    | "property_id"
    | "extension_id"
    | "coverage_area"
    | "name"
    | "description"
    | "schema_type"
    | "status"
    | "author_id"
    | "review_note"
    | "created_at"
    | "updated_at"
  >[];
  user_count: number;
  draft_count: number;
};

export type OrganisationSummary = OrganisationRow & {
  assignments: Pick<OrganisationAssignmentRow, "id" | "extension_id" | "succession" | "tax">[];
  user_count: number;
  draft_count: number;
  last_active: string | null;
};

// ------------------------------------------------------------------
// List organisations (admin overview)
// ------------------------------------------------------------------

export async function listOrganisations(): Promise<OrganisationSummary[]> {
  const supabase = await createClient();

  // Fetch organisations
  const { data: orgs, error: orgError } = await supabase
    .from("organisations")
    .select("*")
    .order("name");

  if (orgError) throw new Error(orgError.message);
  if (!orgs || orgs.length === 0) return [];

  // Fetch all assignments
  const { data: assignments } = await supabase
    .from("organisation_assignments")
    .select("id, org_id, extension_id, succession, tax");

  // Fetch all profiles grouped by org
  const { data: profiles } = await supabase
    .from("profiles")
    .select("organisation_id, created_at")
    .not("organisation_id", "is", null);

  // Fetch all extensions for name lookup
  const { data: extensions } = await supabase
    .from("extensions")
    .select("slug, name");

  // Fetch draft counts per author org
  const { data: drafts } = await supabase
    .from("property_drafts")
    .select("author_id, created_at, updated_at");

  // Fetch author profiles to map draft -> org
  const { data: authorProfiles } = await supabase
    .from("profiles")
    .select("id, organisation_id")
    .not("organisation_id", "is", null);

  const authorOrgMap = new Map<string, string>();
  for (const p of authorProfiles ?? []) {
    if (p.organisation_id) authorOrgMap.set(p.id, p.organisation_id);
  }

  const extensionNameMap = new Map<string, string>();
  for (const e of extensions ?? []) {
    extensionNameMap.set(e.slug, e.name);
  }

  return orgs.map((org) => {
    const orgAssignments = (assignments ?? [])
      .filter((a) => a.org_id === org.id)
      .map((a) => ({
        id: a.id,
        extension_id: a.extension_id,
        succession: a.succession,
        tax: a.tax,
      }));

    const orgProfiles = (profiles ?? []).filter(
      (p) => p.organisation_id === org.id,
    );

    const orgDrafts = (drafts ?? []).filter((d) => {
      const draftOrg = authorOrgMap.get(d.author_id);
      return draftOrg === org.id;
    });

    const lastActive =
      orgDrafts.length > 0
        ? orgDrafts.reduce(
            (latest, d) => {
              const t = d.updated_at ?? d.created_at;
              return t > latest ? t : latest;
            },
            orgDrafts[0].updated_at ?? orgDrafts[0].created_at,
          )
        : orgProfiles.length > 0
          ? orgProfiles.reduce(
              (latest, p) => (p.created_at > latest ? p.created_at : latest),
              orgProfiles[0].created_at,
            )
          : null;

    return {
      ...org,
      assignments: orgAssignments,
      user_count: orgProfiles.length,
      draft_count: orgDrafts.length,
      last_active: lastActive,
    };
  });
}

// ------------------------------------------------------------------
// Get a single organisation by slug (detail page)
// ------------------------------------------------------------------

export async function getOrganisation(
  slug: string,
): Promise<OrganisationWithDetails> {
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (orgError) throw new Error(orgError.message);

  // Assignments with extension names
  const { data: assignments } = await supabase
    .from("organisation_assignments")
    .select("id, org_id, extension_id, succession, tax")
    .eq("org_id", org.id);

  const { data: extensions } = await supabase
    .from("extensions")
    .select("slug, name");

  const extensionNameMap = new Map<string, string>();
  for (const e of extensions ?? []) {
    extensionNameMap.set(e.slug, e.name);
  }

  const enrichedAssignments = (assignments ?? []).map((a) => ({
    id: a.id,
    extension_id: a.extension_id,
    succession: a.succession,
    tax: a.tax,
    extension_name: extensionNameMap.get(a.extension_id) ?? a.extension_id,
  }));

  // Users in this org
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .eq("organisation_id", org.id)
    .order("created_at");

  // Invitations
  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, email, role, accepted_at, expires_at, created_at")
    .eq("organisation_id", org.id)
    .order("created_at", { ascending: false });

  // Drafts from this org's users
  const userIds = (users ?? []).map((u) => u.id);
  let drafts: OrganisationWithDetails["drafts"] = [];

  if (userIds.length > 0) {
    const { data: draftData } = await supabase
      .from("property_drafts")
      .select(
        "id, property_id, extension_id, coverage_area, name, description, schema_type, status, author_id, review_note, created_at, updated_at",
      )
      .in("author_id", userIds)
      .order("created_at", { ascending: false });

    drafts = draftData ?? [];
  }

  return {
    ...org,
    assignments: enrichedAssignments,
    users: users ?? [],
    invitations: invitations ?? [],
    drafts,
    user_count: (users ?? []).length,
    draft_count: drafts.length,
  };
}

// ------------------------------------------------------------------
// Create organisation + assignment + invitation
// ------------------------------------------------------------------

export async function createOrganisation(data: {
  name: string;
  extensionSlug: string;
  succession: boolean;
  tax: boolean;
  adminEmail: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Create the organisation
  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert({
      name: data.name,
      slug,
      created_by: user.id,
    })
    .select()
    .single();

  if (orgError) throw new Error(orgError.message);

  // Create the assignment
  const { error: assignError } = await supabase
    .from("organisation_assignments")
    .insert({
      org_id: org.id,
      extension_id: data.extensionSlug,
      succession: data.succession,
      tax: data.tax,
    });

  if (assignError) throw new Error(assignError.message);

  // Create the invitation
  const { error: inviteError } = await supabase.from("invitations").insert({
    email: data.adminEmail,
    organisation_id: org.id,
    role: "org_admin" as const,
    invited_by: user.id,
    accepted_at: null,
  });

  if (inviteError) throw new Error(inviteError.message);

  // Send the actual invite email via the Admin API
  const admin = createAdminClient();
  const { error: emailError } = await admin.auth.admin.inviteUserByEmail(
    data.adminEmail,
    {
      data: { role: "org_admin", organisation_id: slug },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  );
  if (emailError) {
    console.error("[invite] email failed:", emailError.message);
  }

  return org;
}

// ------------------------------------------------------------------
// Remove an assignment
// ------------------------------------------------------------------

export async function removeAssignment(assignmentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organisation_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------
// Add assignment to existing org
// ------------------------------------------------------------------

export async function addAssignment(data: {
  orgId: string;
  extensionSlug: string;
  succession: boolean;
  tax: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("organisation_assignments").insert({
    org_id: data.orgId,
    extension_id: data.extensionSlug,
    succession: data.succession,
    tax: data.tax,
  });

  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------
// Resend / revoke invitation
// ------------------------------------------------------------------

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);

  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------
// Update user role within an org
// ------------------------------------------------------------------

export async function updateUserRole(
  userId: string,
  role: "org_admin" | "org_member",
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------
// Remove user from org
// ------------------------------------------------------------------

export async function removeUserFromOrg(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ organisation_id: null, role: "org_member" })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
