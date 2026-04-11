-- ============================================================
-- 002_rls.sql — Row-Level Security policies
-- ============================================================

-- ----------------------------------------------------------
-- Helper functions
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION user_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organisation_id FROM profiles
  WHERE id = auth.uid();
$$;

-- ----------------------------------------------------------
-- Enable RLS on all tables
-- ----------------------------------------------------------

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_history ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- Organisations
-- ----------------------------------------------------------

-- Admins can do everything
CREATE POLICY organisations_admin_all ON organisations
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Partners can view their own org
CREATE POLICY organisations_member_select ON organisations
  FOR SELECT
  USING (id = user_org_id());

-- ----------------------------------------------------------
-- Organisation assignments
-- ----------------------------------------------------------

-- Admins can do everything
CREATE POLICY org_assignments_admin_all ON organisation_assignments
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Partners can view assignments for their own org
CREATE POLICY org_assignments_member_select ON organisation_assignments
  FOR SELECT
  USING (org_id = user_org_id());

-- ----------------------------------------------------------
-- Profiles
-- ----------------------------------------------------------

-- Admins can do everything (uses JWT metadata to avoid recursion — is_admin() queries profiles)
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Users can view their own profile
CREATE POLICY profiles_self_select ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own display_name (profile row)
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Org admins can view profiles within their org (avoids querying profiles for role check)
CREATE POLICY profiles_org_admin_select ON profiles
  FOR SELECT
  USING (
    organisation_id = user_org_id()
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('org_admin', 'admin')
  );

-- ----------------------------------------------------------
-- Invitations
-- ----------------------------------------------------------

-- Admins can do everything
CREATE POLICY invitations_admin_all ON invitations
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Org admins can manage invitations for their own org
CREATE POLICY invitations_org_admin_all ON invitations
  FOR ALL
  USING (
    organisation_id = user_org_id()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'org_admin'
    )
  )
  WITH CHECK (
    organisation_id = user_org_id()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'org_admin'
    )
  );

-- Users can view invitations sent to their email
CREATE POLICY invitations_self_select ON invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- ----------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------

-- Readable by all authenticated users
CREATE POLICY extensions_authenticated_select ON extensions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage extensions
CREATE POLICY extensions_admin_all ON extensions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ----------------------------------------------------------
-- Property groups
-- ----------------------------------------------------------

-- Readable by all authenticated users
CREATE POLICY property_groups_authenticated_select ON property_groups
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage property groups
CREATE POLICY property_groups_admin_all ON property_groups
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ----------------------------------------------------------
-- Properties (published state)
-- ----------------------------------------------------------

-- Readable by all authenticated users
CREATE POLICY properties_authenticated_select ON properties
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage properties
CREATE POLICY properties_admin_all ON properties
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ----------------------------------------------------------
-- Property drafts
-- ----------------------------------------------------------

-- Admins can do everything with drafts
CREATE POLICY property_drafts_admin_all ON property_drafts
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Partners can view drafts on their assigned extensions
CREATE POLICY property_drafts_partner_select ON property_drafts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organisation_assignments oa
      WHERE oa.org_id = user_org_id()
        AND oa.extension_id = property_drafts.extension_id
    )
  );

-- Partners can create drafts on assigned extensions (status must be partner_draft)
CREATE POLICY property_drafts_partner_insert ON property_drafts
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'partner_draft'
    AND EXISTS (
      SELECT 1 FROM organisation_assignments oa
      WHERE oa.org_id = user_org_id()
        AND oa.extension_id = property_drafts.extension_id
    )
  );

-- Partners can update their own drafts (only if status is partner_draft or rejected)
CREATE POLICY property_drafts_partner_update ON property_drafts
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND status IN ('partner_draft', 'rejected')
    AND EXISTS (
      SELECT 1 FROM organisation_assignments oa
      WHERE oa.org_id = user_org_id()
        AND oa.extension_id = property_drafts.extension_id
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('partner_draft', 'rejected')
  );

-- Partners can delete their own partner_draft status drafts
CREATE POLICY property_drafts_partner_delete ON property_drafts
  FOR DELETE
  USING (
    author_id = auth.uid()
    AND status = 'partner_draft'
  );

-- ----------------------------------------------------------
-- Shared definitions
-- ----------------------------------------------------------

-- Readable by all authenticated users
CREATE POLICY shared_definitions_authenticated_select ON shared_definitions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage shared definitions
CREATE POLICY shared_definitions_admin_all ON shared_definitions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ----------------------------------------------------------
-- Publish history
-- ----------------------------------------------------------

-- Admins only — full access
CREATE POLICY publish_history_admin_all ON publish_history
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
