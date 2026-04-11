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

  return (
    <div>
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
            const allProps = [
              ...groupPublished.map((p) => ({
                ...p,
                isDraft: false as const,
              })),
              ...draftProps.map((d) => ({
                ...d,
                isDraft: true as const,
              })),
            ];

            return (
              <PropertyGroup
                key={group.id}
                name={group.name}
                description={group.description}
                properties={
                  groupPublished.length === 0 && draftProps.length === 0
                    ? []
                    : allProps.filter(
                        (p) =>
                          ("group_id" in p && p.group_id === group.id) ||
                          !("group_id" in p),
                      )
                }
                extensionSlug={params.slug}
                coverageArea="succession"
              />
            );
          })}
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
