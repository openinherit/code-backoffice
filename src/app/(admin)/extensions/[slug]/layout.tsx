import Link from "next/link";
import { getExtension } from "@/actions/extensions";
import { notFound } from "next/navigation";

const typeBadge: Record<string, string> = {
  geographic: "bg-blue-100 text-blue-700",
  tradition: "bg-pink-100 text-pink-700",
  hybrid: "bg-violet-100 text-violet-700",
};

const maturityBadge: Record<string, string> = {
  stable: "bg-green-100 text-green-700",
  candidate: "bg-indigo-100 text-indigo-700",
  draft: "bg-amber-100 text-amber-700",
};

export default async function ExtensionDetailLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  let extension;
  try {
    extension = await getExtension(params.slug);
  } catch {
    notFound();
  }

  const successionCount =
    extension.properties.filter((p) => p.coverage_area === "succession")
      .length +
    extension.property_drafts.filter(
      (d) => d.coverage_area === "succession" && !d.property_id,
    ).length;

  const taxCount =
    extension.properties.filter((p) => p.coverage_area === "tax").length +
    extension.property_drafts.filter(
      (d) => d.coverage_area === "tax" && !d.property_id,
    ).length;

  const tabs = [
    {
      label: `Succession Rules (${successionCount})`,
      href: `/extensions/${params.slug}/succession`,
    },
    {
      label: `Tax Treatment (${taxCount})`,
      href: `/extensions/${params.slug}/tax`,
    },
    {
      label: "Metadata",
      href: `/extensions/${params.slug}/metadata`,
    },
  ];

  return (
    <div className="p-6">
      <Link
        href="/extensions"
        className="text-sm text-indigo-600 hover:underline"
      >
        &larr; Back to extensions
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          {extension.name}
        </h2>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${typeBadge[extension.extension_type] ?? "bg-gray-100 text-gray-600"}`}
        >
          {extension.extension_type}
        </span>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${maturityBadge[extension.maturity] ?? "bg-gray-100 text-gray-600"}`}
        >
          {extension.maturity}
        </span>
      </div>

      <nav className="mt-4 flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{props.children}</div>
    </div>
  );
}
