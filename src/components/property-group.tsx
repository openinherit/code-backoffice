import Link from "next/link";

type Property = {
  id: string;
  name: string;
  description: string | null;
  schema_type: string;
  coverage_area: string | null;
  group_id?: string | null;
  status?: string;
  isDraft?: boolean;
};

type PropertyGroupProps = {
  name: string;
  description: string | null;
  properties: Property[];
  extensionSlug: string;
  coverageArea: string;
};

const statusBadge: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
  partner_draft: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  publishing: "bg-indigo-100 text-indigo-700",
};

const typeBadge: Record<string, string> = {
  object: "bg-gray-100 text-gray-600",
  string: "bg-sky-100 text-sky-700",
  number: "bg-emerald-100 text-emerald-700",
  boolean: "bg-orange-100 text-orange-700",
  array: "bg-purple-100 text-purple-700",
  enum: "bg-rose-100 text-rose-700",
};

export function PropertyGroup({
  name,
  description,
  properties,
  extensionSlug,
  coverageArea,
}: PropertyGroupProps) {
  return (
    <div className="rounded-lg border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
          {name}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-400">
          No properties yet
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {properties.map((prop) => (
            <li
              key={prop.id}
              className={`flex items-center justify-between px-4 py-3 ${
                prop.isDraft ? "bg-amber-50" : ""
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-gray-900">
                    {prop.name}
                  </span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      prop.isDraft
                        ? statusBadge[prop.status ?? "draft"]
                        : statusBadge.published
                    }`}
                  >
                    {prop.isDraft ? (prop.status ?? "draft") : "published"}
                  </span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      typeBadge[prop.schema_type] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {prop.schema_type}
                  </span>
                </div>
                {prop.description && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {prop.description}
                  </p>
                )}
              </div>
              <Link
                href={`/extensions/${extensionSlug}/${coverageArea}/${prop.name}`}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                Edit &rarr;
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
