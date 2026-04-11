import { getExtension } from "@/actions/extensions";
import { PropertyGroup } from "@/components/property-group";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TaxPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  let extension;
  try {
    extension = await getExtension(params.slug);
  } catch {
    notFound();
  }

  const groups = extension.property_groups
    .filter((g) => g.coverage_area === "tax")
    .sort((a, b) => a.display_order - b.display_order);

  const publishedProps = extension.properties.filter(
    (p) => p.coverage_area === "tax",
  );

  const draftProps = extension.property_drafts.filter(
    (d) => d.coverage_area === "tax" && !d.property_id,
  );

  const draftCount = extension.property_drafts.filter(
    (d) => d.coverage_area === "tax",
  ).length;

  const hasGroups = groups.length > 0;

  const taxCoverage =
    typeof extension.metadata?.taxCoverage === "string"
      ? extension.metadata.taxCoverage
      : null;
  const coveragePct =
    taxCoverage === "comprehensive"
      ? 100
      : taxCoverage === "partial"
        ? Math.min(80, Math.max(40, publishedProps.length * 8))
        : Math.min(30, Math.max(10, publishedProps.length * 5));

  const progressBarColour =
    taxCoverage === "comprehensive"
      ? "bg-emerald-600"
      : taxCoverage === "partial"
        ? "bg-indigo-600"
        : "bg-amber-700";

  const progressTextColour =
    taxCoverage === "comprehensive"
      ? "text-emerald-600"
      : taxCoverage === "partial"
        ? "text-indigo-600"
        : "text-amber-700";

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
        <span className="text-xs font-medium text-gray-600">
          Tax completion:
        </span>
        <div className="h-2 flex-1 rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full ${progressBarColour}`}
            style={{ width: `${coveragePct}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${progressTextColour}`}>
          {coveragePct}%
        </span>
        {draftCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            {draftCount} unpublished draft{draftCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!hasGroups && publishedProps.length === 0 && draftProps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No property groups or properties defined for tax treatment yet.
          </p>
        </div>
      ) : hasGroups ? (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupPublished = publishedProps.filter(
              (p) => p.group_id === group.id,
            );

            return (
              <PropertyGroup
                key={group.id}
                name={group.name}
                description={group.description}
                properties={groupPublished.map((p) => ({
                  ...p,
                  isDraft: false as const,
                }))}
                extensionSlug={params.slug}
                coverageArea="tax"
              />
            );
          })}
        </div>
      ) : (
        <PropertyGroup
          name="Ungrouped"
          description={null}
          properties={publishedProps.map((p) => ({
            ...p,
            isDraft: false as const,
          }))}
          extensionSlug={params.slug}
          coverageArea="tax"
        />
      )}

      {/* Ungrouped drafts — shown separately so they don't appear in every group */}
      {draftProps.length > 0 && (
        <div className="mt-6">
          <PropertyGroup
            name="Drafts (ungrouped)"
            description="Drafts not yet assigned to a property group"
            properties={draftProps.map((d) => ({
              ...d,
              isDraft: true as const,
            }))}
            extensionSlug={params.slug}
            coverageArea="tax"
          />
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
        <Link
          href={`/extensions/${params.slug}/tax/new`}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          + Add property
        </Link>
        {draftCount > 0 && (
          <Link
            href="/publish"
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Publish {draftCount} draft{draftCount !== 1 ? "s" : ""} &rarr;
            Create PR
          </Link>
        )}
      </div>
    </div>
  );
}
