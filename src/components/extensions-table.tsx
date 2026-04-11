import Link from "next/link";

type Extension = {
  slug: string;
  name: string;
  legal_tradition: string | null;
  extension_type: string;
  key_features: string | null;
  maturity: string;
};

const typeBadge: Record<string, string> = {
  geographic: "bg-blue-100 text-blue-700",
  tradition: "bg-pink-100 text-pink-700",
};

const maturityBadge: Record<string, string> = {
  stable: "bg-green-100 text-green-700",
  candidate: "bg-indigo-100 text-indigo-700",
  draft: "bg-amber-100 text-amber-700",
};

export function ExtensionsTable({ extensions }: { extensions: Extension[] }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Extensions</h1>
      <p className="mt-1 text-sm text-gray-500">
        All registered extensions in the INHERIT standard.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-2 font-medium">Extension</th>
              <th className="px-4 py-2 font-medium">Legal Tradition</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Key Features</th>
              <th className="px-4 py-2 font-medium">Maturity</th>
            </tr>
          </thead>
          <tbody>
            {extensions.map((ext) => (
              <tr key={ext.slug} className="border-b border-gray-100">
                <td className="px-4 py-2 font-semibold text-gray-900">
                  <Link
                    href={`/extensions/${ext.slug}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {ext.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {ext.legal_tradition ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${typeBadge[ext.extension_type] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {ext.extension_type}
                  </span>
                </td>
                <td
                  className="max-w-xs truncate px-4 py-2 text-gray-500"
                  title={ext.key_features ?? undefined}
                >
                  {ext.key_features ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${maturityBadge[ext.maturity] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {ext.maturity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {extensions.length} extension{extensions.length !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}
