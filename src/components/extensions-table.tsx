import Link from "next/link";
import type { ListExtension } from "@/actions/extensions";

const typeBadge: Record<string, string> = {
  geographic: "bg-blue-100 text-blue-700",
  tradition: "bg-pink-100 text-pink-700",
};

/** Pluralise "prop" / "props". */
function propLabel(count: number): string {
  return count === 1 ? "1 prop" : `${count} props`;
}

/** Count properties for a given coverage area. */
function countByCoverage(
  properties: { coverage_area: string | null }[],
  area: string,
): number {
  return properties.filter((p) => p.coverage_area === area).length;
}

export function ExtensionsTable({
  extensions,
}: {
  extensions: ListExtension[];
}) {
  const draftCount = extensions.filter(
    (ext) => ext.maturity === "draft",
  ).length;

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
              <th className="px-4 py-2 font-medium">Succession Rules</th>
              <th className="px-4 py-2 font-medium">Tax Treatment</th>
              <th className="px-4 py-2 font-medium">Seeking</th>
            </tr>
          </thead>
          <tbody>
            {extensions.map((ext) => {
              const successionCount = countByCoverage(
                ext.properties,
                "succession",
              );
              const taxCount = countByCoverage(ext.properties, "tax");
              const seeking =
                typeof ext.metadata?.seeking === "string"
                  ? ext.metadata.seeking
                  : null;

              return (
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
                  <td className="px-4 py-2 text-gray-700">
                    {successionCount > 0 ? (
                      <span className="flex items-center gap-2">
                        <span>{propLabel(successionCount)}</span>
                        <Link
                          href={`/extensions/${ext.slug}/succession`}
                          className="text-indigo-600 hover:underline"
                        >
                          Edit succession &rarr;
                        </Link>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {taxCount > 0 ? (
                      <span className="flex items-center gap-2">
                        <span>{propLabel(taxCount)}</span>
                        <Link
                          href={`/extensions/${ext.slug}/tax`}
                          className="text-indigo-600 hover:underline"
                        >
                          Edit tax &rarr;
                        </Link>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {seeking ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>
          {extensions.length} extension{extensions.length !== 1 ? "s" : ""}{" "}
          total
        </span>
        {draftCount > 0 && (
          <Link
            href="/publish"
            className="text-indigo-600 hover:underline"
          >
            Publish {draftCount} draft{draftCount !== 1 ? "s" : ""} &rarr;
            Create PR
          </Link>
        )}
      </div>
    </div>
  );
}
