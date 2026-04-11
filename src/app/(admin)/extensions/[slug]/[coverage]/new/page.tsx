import { getExtension } from "@/actions/extensions";
import { AddPropertyWizard } from "@/components/add-property-wizard";
import { notFound } from "next/navigation";

const VALID_COVERAGE = ["succession", "tax"] as const;

export default async function NewPropertyPage(props: {
  params: Promise<{ slug: string; coverage: string }>;
}) {
  const params = await props.params;

  if (
    !VALID_COVERAGE.includes(
      params.coverage as (typeof VALID_COVERAGE)[number],
    )
  ) {
    notFound();
  }

  let extension;
  try {
    extension = await getExtension(params.slug);
  } catch {
    notFound();
  }

  const groups = extension.property_groups
    .filter((g) => g.coverage_area === params.coverage)
    .sort((a, b) => a.display_order - b.display_order)
    .map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      display_order: g.display_order,
    }));

  return (
    <AddPropertyWizard
      extensionSlug={params.slug}
      coverageArea={params.coverage}
      groups={groups}
    />
  );
}
