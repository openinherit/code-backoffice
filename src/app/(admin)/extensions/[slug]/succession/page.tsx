import { getExtension } from "@/actions/extensions";
import { PropertyGroup } from "@/components/property-group";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SuccessionPage(props: {
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
    .filter((g) => g.coverage_area === "succession")
    .sort((a, b) => a.display_order - b.display_order);

  const publishedProps = extension.properties.filter(
    (p) => p.coverage_area === "succession",
  );

  const draftProps = extension.property_drafts.filter(
    (d) => d.coverage_area === "succession" && !d.property_id,
  );

  const draftCount = extension.property_drafts.filter(
    (d) => d.coverage_area === "succession",
  ).length;

  const successionCoverage =
    typeof extension.metadata?.successionCoverage === "string"
      ? extension.metadata.successionCoverage
      : null;
  const coveragePct =
    successionCoverage === "comprehensive"
      ? 100
      : successionCoverage === "partial"
        ? Math.min(80, Math.max(40, publishedProps.length * 8))
        : Math.min(30, Math.max(10, publishedProps.length * 5));

  const progressBarColour =
    successionCoverage === "comprehensive"
      ? "bg-emerald-600"
      : successionCoverage === "partial"
        ? "bg-indigo-600"
        : "bg-amber-700";

  const progressTextColour =
    successionCoverage === "comprehensive"
      ? "text-emerald-600"
      : successionCoverage === "partial"
        ? "text-indigo-600"
        : "text-amber-700";

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
        <span className="text-xs font-medium text-gray-600">
          Succession completion:
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

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No property groups defined for succession rules yet.
          </p>
        </div>
      ) : (
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
                coverageArea="succession"
              />
            );
          })}
        </div>
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
            coverageArea="succession"
          />
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
        <Link
          href={`/extensions/${params.slug}/succession/new`}
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
