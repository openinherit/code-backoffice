import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PropertyGroup } from "@/components/property-group";

const roleBadge: Record<string, string> = {
  org_admin: "bg-indigo-100 text-indigo-700",
  org_member: "bg-gray-100 text-gray-600",
};

export default async function PartnerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, display_name, organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organisation_id) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Partner Dashboard</h1>
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            Your account is not yet associated with a partner organisation.
            Please contact an INHERIT administrator.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the organisation
  const { data: org } = await supabase
    .from("organisations")
    .select("id, name, slug")
    .eq("id", profile.organisation_id)
    .single();

  if (!org) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Partner Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">
          Organisation not found. Please contact an administrator.
        </p>
      </div>
    );
  }

  // Fetch assignments
  const { data: assignments } = await supabase
    .from("organisation_assignments")
    .select("id, extension_id, succession, tax")
    .eq("org_id", org.id);

  // Fetch extension details for assigned extensions
  const extSlugs = (assignments ?? []).map((a) => a.extension_id);
  let extensions: {
    slug: string;
    name: string;
    property_groups: {
      id: string;
      coverage_area: string | null;
      name: string;
      description: string | null;
      display_order: number;
    }[];
    properties: {
      id: string;
      coverage_area: string | null;
      group_id: string | null;
      name: string;
      description: string | null;
      schema_type: string;
      schema_definition: Record<string, unknown>;
    }[];
  }[] = [];

  if (extSlugs.length > 0) {
    const { data: extData } = await supabase
      .from("extensions")
      .select(
        `
        slug, name,
        property_groups (id, coverage_area, name, description, display_order),
        properties (id, coverage_area, group_id, name, description, schema_type, schema_definition)
      `,
      )
      .in("slug", extSlugs);

    extensions = (extData ?? []) as unknown as typeof extensions;
  }

  // Fetch this user's drafts
  const { data: myDrafts } = await supabase
    .from("property_drafts")
    .select(
      "id, property_id, extension_id, coverage_area, name, description, schema_type, status, created_at",
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  // Build a map of assigned coverage areas per extension
  const assignmentMap = new Map<
    string,
    { succession: boolean; tax: boolean }
  >();
  for (const a of assignments ?? []) {
    assignmentMap.set(a.extension_id, {
      succession: a.succession,
      tax: a.tax,
    });
  }

  return (
    <div className="p-6">
      {/* Org header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{org.name}</h1>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ${roleBadge[profile.role] ?? "bg-gray-100 text-gray-600"}`}
        >
          {profile.role.replace("_", " ")}
        </span>
      </div>

      {/* Info banner */}
      <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-800">
          Your edits are saved as drafts. An INHERIT administrator will review
          and publish them.
        </p>
      </div>

      {/* Extensions and properties */}
      {extensions.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No extensions have been assigned to your organisation yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {extensions.map((ext) => {
            const assignment = assignmentMap.get(ext.slug);
            const coverageAreas: string[] = [];
            if (assignment?.succession) coverageAreas.push("succession");
            if (assignment?.tax) coverageAreas.push("tax");

            return (
              <section key={ext.slug}>
                <h2 className="text-base font-semibold text-gray-900">
                  {ext.name}
                </h2>
                <div className="mt-1 flex gap-1">
                  {coverageAreas.map((area) => (
                    <span
                      key={area}
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        area === "succession"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {area}
                    </span>
                  ))}
                </div>

                {coverageAreas.map((area) => {
                  const groups = ext.property_groups
                    .filter((g) => g.coverage_area === area)
                    .sort((a, b) => a.display_order - b.display_order);

                  const areaProps = ext.properties.filter(
                    (p) => p.coverage_area === area,
                  );

                  const areaDrafts = (myDrafts ?? []).filter(
                    (d) =>
                      d.extension_id === ext.slug &&
                      d.coverage_area === area &&
                      !d.property_id,
                  );

                  if (groups.length === 0) {
                    return (
                      <div
                        key={area}
                        className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400"
                      >
                        No property groups for {area} yet.
                      </div>
                    );
                  }

                  return (
                    <div key={area} className="mt-4 space-y-4">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        {area} rules
                      </h3>
                      {groups.map((group) => {
                        const groupProps = areaProps.filter(
                          (p) => p.group_id === group.id,
                        );
                        const allProps = [
                          ...groupProps.map((p) => ({
                            ...p,
                            isDraft: false as const,
                          })),
                          ...areaDrafts.map((d) => ({
                            ...d,
                            group_id: null as string | null,
                            schema_definition: {} as Record<string, unknown>,
                            isDraft: true as const,
                          })),
                        ];

                        return (
                          <PropertyGroup
                            key={group.id}
                            name={group.name}
                            description={group.description}
                            properties={allProps}
                            extensionSlug={ext.slug}
                            coverageArea={area}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}

      {/* Gaps section */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-900">
          Areas needing expertise
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          The following coverage areas within your assigned extensions have fewer
          than 3 published properties. Your contributions here would be
          especially valuable.
        </p>

        <div className="mt-3 space-y-2">
          {extensions.flatMap((ext) => {
            const assignment = assignmentMap.get(ext.slug);
            const areas: string[] = [];
            if (assignment?.succession) areas.push("succession");
            if (assignment?.tax) areas.push("tax");

            return areas
              .filter((area) => {
                const count = ext.properties.filter(
                  (p) => p.coverage_area === area,
                ).length;
                return count < 3;
              })
              .map((area) => {
                const count = ext.properties.filter(
                  (p) => p.coverage_area === area,
                ).length;
                return (
                  <div
                    key={`${ext.slug}-${area}`}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ext.name} — {area}
                      </p>
                      <p className="text-xs text-gray-500">
                        {count} published propert{count !== 1 ? "ies" : "y"}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-amber-700">
                      Needs input
                    </span>
                  </div>
                );
              });
          })}
          {extensions.every((ext) => {
            const assignment = assignmentMap.get(ext.slug);
            const areas: string[] = [];
            if (assignment?.succession) areas.push("succession");
            if (assignment?.tax) areas.push("tax");
            return areas.every(
              (area) =>
                ext.properties.filter((p) => p.coverage_area === area)
                  .length >= 3,
            );
          }) && (
            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
              All areas are well-covered. Thank you for your contributions!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
