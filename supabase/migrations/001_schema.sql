-- ============================================================
-- 001_schema.sql — INHERIT Backoffice database schema
-- Tables, views, functions, triggers
-- ============================================================

-- ----------------------------------------------------------
-- Enums
-- ----------------------------------------------------------

CREATE TYPE user_role AS ENUM ('admin', 'org_admin', 'org_member');
CREATE TYPE draft_status AS ENUM ('partner_draft', 'approved', 'draft', 'publishing', 'published', 'rejected');
CREATE TYPE pr_status AS ENUM ('open', 'merged', 'closed');

-- ----------------------------------------------------------
-- Tables
-- ----------------------------------------------------------

-- Partner organisations
CREATE TABLE organisations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id)
);

-- Extensions (the 21 INHERIT jurisdiction/tradition schemas)
CREATE TABLE extensions (
  slug            text PRIMARY KEY,
  name            text NOT NULL,
  legal_tradition text,
  extension_type  text NOT NULL DEFAULT 'geographic',
  key_features    text,
  maturity        text NOT NULL DEFAULT 'draft',
  schema_path     text,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Organisation ↔ Extension assignments (succession law / tax treatment roles)
CREATE TABLE organisation_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  extension_id  text NOT NULL REFERENCES extensions(slug) ON DELETE CASCADE,
  succession    boolean NOT NULL DEFAULT false,
  tax           boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (org_id, extension_id),
  CONSTRAINT at_least_one_role CHECK (succession OR tax)
);

-- User profiles (linked to Supabase auth)
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  display_name    text,
  organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL,
  role            user_role NOT NULL DEFAULT 'org_member',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Invitations (email-based, pre-registration)
CREATE TABLE invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'org_member',
  invited_by      uuid NOT NULL REFERENCES auth.users(id),
  accepted_at     timestamptz,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Property groups (logical grouping within an extension)
CREATE TABLE property_groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id  text NOT NULL REFERENCES extensions(slug) ON DELETE CASCADE,
  coverage_area text,
  name          text NOT NULL,
  description   text,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Properties (published state of extension fields)
CREATE TABLE properties (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id      text NOT NULL REFERENCES extensions(slug) ON DELETE CASCADE,
  group_id          uuid REFERENCES property_groups(id) ON DELETE SET NULL,
  coverage_area     text,
  name              text NOT NULL,
  description       text,
  schema_type       text NOT NULL DEFAULT 'object',
  schema_definition jsonb DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Property drafts (pending changes — the core editorial workflow)
CREATE TABLE property_drafts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       uuid REFERENCES properties(id) ON DELETE SET NULL,  -- null for new properties
  extension_id      text NOT NULL REFERENCES extensions(slug) ON DELETE CASCADE,
  coverage_area     text,
  name              text NOT NULL,
  description       text,
  schema_type       text NOT NULL DEFAULT 'object',
  schema_definition jsonb DEFAULT '{}'::jsonb,
  status            draft_status NOT NULL DEFAULT 'partner_draft',
  author_id         uuid NOT NULL REFERENCES auth.users(id),
  reviewer_id       uuid REFERENCES auth.users(id),
  review_note       text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Shared definitions ($defs — reusable schema fragments)
CREATE TABLE shared_definitions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL UNIQUE,
  description       text,
  schema_definition jsonb DEFAULT '{}'::jsonb,
  field_summary     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Publish history (GitHub PR tracking)
CREATE TABLE publish_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number   integer,
  pr_url      text,
  branch      text,
  title       text NOT NULL,
  description text,
  draft_ids   uuid[] DEFAULT '{}',
  status      pr_status NOT NULL DEFAULT 'open',
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  merged_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_org ON profiles(organisation_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_org ON invitations(organisation_id);
CREATE INDEX idx_org_assignments_org ON organisation_assignments(org_id);
CREATE INDEX idx_org_assignments_ext ON organisation_assignments(extension_id);
CREATE INDEX idx_property_groups_ext ON property_groups(extension_id);
CREATE INDEX idx_properties_ext ON properties(extension_id);
CREATE INDEX idx_properties_group ON properties(group_id);
CREATE INDEX idx_property_drafts_ext ON property_drafts(extension_id);
CREATE INDEX idx_property_drafts_author ON property_drafts(author_id);
CREATE INDEX idx_property_drafts_status ON property_drafts(status);
CREATE INDEX idx_publish_history_status ON publish_history(status);

-- ----------------------------------------------------------
-- View: user_context (safe data for the login page)
-- ----------------------------------------------------------

CREATE VIEW user_context AS
SELECT
  p.id AS user_id,
  p.email,
  p.role,
  p.display_name,
  o.name AS organisation_name,
  o.slug AS organisation_slug,
  COALESCE(
    json_agg(
      json_build_object(
        'extension_id', oa.extension_id,
        'succession', oa.succession,
        'tax', oa.tax
      )
    ) FILTER (WHERE oa.extension_id IS NOT NULL),
    '[]'::json
  ) AS assignments
FROM profiles p
LEFT JOIN organisations o ON o.id = p.organisation_id
LEFT JOIN organisation_assignments oa ON oa.org_id = p.organisation_id
GROUP BY p.id, p.email, p.role, p.display_name, o.name, o.slug;

-- ----------------------------------------------------------
-- Function: get_user_context (security definer for anon lookup)
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION get_user_context(lookup_email text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT row_to_json(uc)
  FROM user_context uc
  WHERE uc.email = lookup_email
  LIMIT 1;
$$;

-- ----------------------------------------------------------
-- Trigger: auto-create profile on auth.users insert
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv invitations%ROWTYPE;
BEGIN
  -- Check for a pending invitation
  SELECT * INTO _inv
  FROM invitations
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF _inv.id IS NOT NULL THEN
    -- Create profile with invited role and org
    INSERT INTO profiles (id, email, display_name, organisation_id, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      _inv.organisation_id,
      _inv.role
    );

    -- Mark invitation as accepted
    UPDATE invitations SET accepted_at = now() WHERE id = _inv.id;
  ELSE
    -- No invitation — create profile with default role
    INSERT INTO profiles (id, email, display_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------
-- Trigger: auto-update updated_at timestamp
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_property_drafts_updated_at
  BEFORE UPDATE ON property_drafts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_extensions_updated_at
  BEFORE UPDATE ON extensions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_property_groups_updated_at
  BEFORE UPDATE ON property_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_shared_definitions_updated_at
  BEFORE UPDATE ON shared_definitions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_publish_history_updated_at
  BEFORE UPDATE ON publish_history
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
