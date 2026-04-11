// Placeholder Database types — generated from 001_schema.sql
// Replace with `supabase gen types typescript` output once a live instance is available.

export type UserRole = "admin" | "org_admin" | "org_member";
export type DraftStatus =
  | "partner_draft"
  | "approved"
  | "draft"
  | "publishing"
  | "published"
  | "rejected";
export type PrStatus = "open" | "merged" | "closed";

// ------------------------------------------------------------------
// Table row shapes
// ------------------------------------------------------------------

export interface OrganisationRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  created_by: string | null;
}

export interface ExtensionRow {
  slug: string;
  name: string;
  legal_tradition: string | null;
  extension_type: string;
  key_features: string | null;
  maturity: string;
  schema_path: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganisationAssignmentRow {
  id: string;
  org_id: string;
  extension_id: string;
  succession: boolean;
  tax: boolean;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  organisation_id: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface InvitationRow {
  id: string;
  email: string;
  organisation_id: string;
  role: UserRole;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface PropertyGroupRow {
  id: string;
  extension_id: string;
  coverage_area: string | null;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyRow {
  id: string;
  extension_id: string;
  group_id: string | null;
  coverage_area: string | null;
  name: string;
  description: string | null;
  schema_type: string;
  schema_definition: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PropertyDraftRow {
  id: string;
  property_id: string | null;
  extension_id: string;
  coverage_area: string | null;
  name: string;
  description: string | null;
  schema_type: string;
  schema_definition: Record<string, unknown>;
  status: DraftStatus;
  author_id: string;
  reviewer_id: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedDefinitionRow {
  id: string;
  name: string;
  description: string | null;
  schema_definition: Record<string, unknown>;
  field_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishHistoryRow {
  id: string;
  pr_number: number | null;
  pr_url: string | null;
  branch: string | null;
  title: string;
  description: string | null;
  draft_ids: string[];
  status: PrStatus;
  created_by: string;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------
// Insert types (columns with DB defaults are optional)
// ------------------------------------------------------------------

export type OrganisationInsert = Omit<OrganisationRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ExtensionInsert = Omit<ExtensionRow, "created_at" | "updated_at"> & {
  extension_type?: string;
  maturity?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type OrganisationAssignmentInsert = Omit<
  OrganisationAssignmentRow,
  "id" | "created_at"
> & {
  id?: string;
  succession?: boolean;
  tax?: boolean;
  created_at?: string;
};

export type ProfileInsert = Omit<ProfileRow, "created_at" | "updated_at"> & {
  role?: UserRole;
  created_at?: string;
  updated_at?: string;
};

export type InvitationInsert = Omit<InvitationRow, "id" | "created_at" | "expires_at"> & {
  id?: string;
  accepted_at?: string | null;
  expires_at?: string;
  created_at?: string;
};

export type PropertyGroupInsert = Omit<
  PropertyGroupRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type PropertyInsert = Omit<PropertyRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  schema_type?: string;
  schema_definition?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type PropertyDraftInsert = Omit<
  PropertyDraftRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  schema_type?: string;
  schema_definition?: Record<string, unknown>;
  status?: DraftStatus;
  created_at?: string;
  updated_at?: string;
};

export type SharedDefinitionInsert = Omit<
  SharedDefinitionRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  schema_definition?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type PublishHistoryInsert = Omit<
  PublishHistoryRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  draft_ids?: string[];
  status?: PrStatus;
  created_at?: string;
  updated_at?: string;
};

// ------------------------------------------------------------------
// Update types (all columns optional)
// ------------------------------------------------------------------

export type OrganisationUpdate = Partial<OrganisationRow>;
export type ExtensionUpdate = Partial<ExtensionRow>;
export type OrganisationAssignmentUpdate = Partial<OrganisationAssignmentRow>;
export type ProfileUpdate = Partial<ProfileRow>;
export type InvitationUpdate = Partial<InvitationRow>;
export type PropertyGroupUpdate = Partial<PropertyGroupRow>;
export type PropertyUpdate = Partial<PropertyRow>;
export type PropertyDraftUpdate = Partial<PropertyDraftRow>;
export type SharedDefinitionUpdate = Partial<SharedDefinitionRow>;
export type PublishHistoryUpdate = Partial<PublishHistoryRow>;

// ------------------------------------------------------------------
// Database shape (matches supabase-js / @supabase/ssr generic parameter)
// ------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      organisations: {
        Row: OrganisationRow;
        Insert: OrganisationInsert;
        Update: OrganisationUpdate;
      };
      extensions: {
        Row: ExtensionRow;
        Insert: ExtensionInsert;
        Update: ExtensionUpdate;
      };
      organisation_assignments: {
        Row: OrganisationAssignmentRow;
        Insert: OrganisationAssignmentInsert;
        Update: OrganisationAssignmentUpdate;
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      invitations: {
        Row: InvitationRow;
        Insert: InvitationInsert;
        Update: InvitationUpdate;
      };
      property_groups: {
        Row: PropertyGroupRow;
        Insert: PropertyGroupInsert;
        Update: PropertyGroupUpdate;
      };
      properties: {
        Row: PropertyRow;
        Insert: PropertyInsert;
        Update: PropertyUpdate;
      };
      property_drafts: {
        Row: PropertyDraftRow;
        Insert: PropertyDraftInsert;
        Update: PropertyDraftUpdate;
      };
      shared_definitions: {
        Row: SharedDefinitionRow;
        Insert: SharedDefinitionInsert;
        Update: SharedDefinitionUpdate;
      };
      publish_history: {
        Row: PublishHistoryRow;
        Insert: PublishHistoryInsert;
        Update: PublishHistoryUpdate;
      };
    };
    Views: {
      user_context: {
        Row: {
          user_id: string;
          email: string;
          role: UserRole;
          display_name: string | null;
          organisation_name: string | null;
          organisation_slug: string | null;
          assignments: Array<{
            extension_id: string;
            succession: boolean;
            tax: boolean;
          }>;
        };
      };
    };
    Functions: {
      get_user_context: {
        Args: { lookup_email: string };
        Returns: {
          user_id: string;
          email: string;
          role: UserRole;
          display_name: string | null;
          organisation_name: string | null;
          organisation_slug: string | null;
          assignments: Array<{
            extension_id: string;
            succession: boolean;
            tax: boolean;
          }>;
        } | null;
      };
    };
    Enums: {
      user_role: UserRole;
      draft_status: DraftStatus;
      pr_status: PrStatus;
    };
  };
};
