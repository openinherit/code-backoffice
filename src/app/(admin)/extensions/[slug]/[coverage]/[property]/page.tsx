import { getExtension } from "@/actions/extensions";
import { PropertyEditor } from "@/components/property-editor";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PropertyPage(props: {
  params: Promise<{ slug: string; coverage: string; property: string }>;
}) {
  const params = await props.params;
  let extension;
  try {
    extension = await getExtension(params.slug);
  } catch {
    notFound();
  }

  const propertyName = decodeURIComponent(params.property);

  // Find published property first
  const published = extension.properties.find(
    (p) => p.name === propertyName && p.coverage_area === params.coverage,
  );

  // Check for a draft (either editing existing or new)
  const draft = extension.property_drafts.find(
    (d) => d.name === propertyName && d.coverage_area === params.coverage,
  );

  const property = draft ?? published;

  if (!property) {
    notFound();
  }

  // Find the group name
  const groupId = "group_id" in property ? property.group_id : null;
  const group = groupId
    ? extension.property_groups.find((g) => g.id === groupId)
    : null;

  const isDraft = !!draft;
  const status = isDraft ? draft.status : "published";

  return (
    <div className="p-6">
      <nav className="flex items-center gap-1 text-xs text-gray-500">
        <Link href="/extensions" className="text-indigo-600 hover:underline">
          Extensions
        </Link>
        <span>/</span>
        <Link
          href={`/extensions/${params.slug}/${params.coverage}`}
          className="text-indigo-600 hover:underline"
        >
          {extension.name} &mdash;{" "}
          {params.coverage === "succession" ? "Succession" : "Tax"}
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{property.name}</span>
      </nav>

      <div className="mt-6">
        <PropertyEditor
          name={property.name}
          description={property.description ?? null}
          schemaType={property.schema_type}
          schemaDefinition={property.schema_definition ?? {}}
          status={status}
          groupName={group?.name}
          backHref={`/extensions/${params.slug}/${params.coverage}`}
          extensionId={params.slug}
          coverageArea={params.coverage}
          propertyId={property.id}
        />
      </div>

      <div className="mt-6">
        <Link
          href={`/extensions/${params.slug}/${params.coverage}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          &larr; Back to{" "}
          {params.coverage === "succession"
            ? "succession rules"
            : "tax treatment"}
        </Link>
      </div>
    </div>
  );
}
