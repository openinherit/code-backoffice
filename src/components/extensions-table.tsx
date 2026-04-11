import Link from "next/link";
import type { ListExtension } from "@/actions/extensions";

/* ── Badge styles ── */

const typeBadgeStyles: Record<string, string> = {
  geographic: "bg-blue-100 text-blue-800",
  tradition: "bg-pink-100 text-pink-800",
};

const coverageBadgeStyles: Record<string, string> = {
  comprehensive: "bg-emerald-100 text-emerald-700",
  partial: "bg-indigo-100 text-indigo-700",
  outline: "bg-amber-100 text-amber-700",
};

const progressBarColours: Record<string, string> = {
  comprehensive: "bg-emerald-600",
  partial: "bg-indigo-600",
  outline: "bg-amber-700",
};

/* ── Helpers ── */

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function coverageFromMetadata(
  metadata: Record<string, unknown> | null,
  area: "succession" | "tax",
): string | null {
  if (!metadata) return null;
  const key = area === "succession" ? "successionCoverage" : "taxCoverage";
  const val = metadata[key];
  return typeof val === "string" ? val : null;
}

function countByCoverage(
  properties: { coverage_area: string | null }[],
  area: string,
): number {
  return properties.filter((p) => p.coverage_area === area).length;
}

/* ── Coverage cell (matches mockup) ── */

function CoverageCell({
  slug,
  area,
  propCount,
  coverage,
  draftCount,
}: {
  slug: string;
  area: "succession" | "tax";
  propCount: number;
  coverage: string | null;
  draftCount: number;
}) {
  // No properties AND no coverage metadata — show dash
  if (propCount === 0 && !coverage) {
    return (
      <td className="px-2 py-3 text-center text-gray-400">—</td>
    );
  }

  const badgeLabel = coverage ? capitalise(coverage) : "Outline";
  const badgeStyle = coverageBadgeStyles[coverage ?? "outline"] ?? coverageBadgeStyles.outline;
  const barColour = progressBarColours[coverage ?? "outline"] ?? progressBarColours.outline;
  const textColour =
    coverage === "comprehensive"
      ? "text-emerald-600"
      : coverage === "partial"
        ? "text-indigo-600"
        : "text-amber-700";

  // Percentage — comprehensive=100%, partial scaled by props, outline scaled lower
  const pct =
    coverage === "comprehensive"
      ? 100
      : coverage === "partial"
        ? Math.min(80, Math.max(40, propCount * 8))
        : Math.min(30, Math.max(10, propCount * 5));

  const areaLabel = area === "succession" ? "succession" : "tax";

  return (
    <td className="px-2 py-3 text-center">
      {/* Coverage badge */}
      <span
        className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badgeStyle}`}
      >
        {badgeLabel}
      </span>

      {/* Prop count + test count */}
      <div className="mt-0.5 text-[10px] text-gray-400">
        {propCount} prop{propCount !== 1 ? "s" : ""} &middot; 0 tests
      </div>

      {/* Progress bar + percentage */}
      <div className="mx-auto mt-0.5 inline-flex items-center gap-1">
        <div className="h-[3px] w-[100px] rounded-full bg-gray-200">
          <div
            className={`h-[3px] rounded-full ${barColour}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[9px] font-semibold ${textColour}`}>
          {pct}%
        </span>
      </div>

      {/* Edit link + draft count */}
      <div className="mt-0.5">
        <Link
          href={`/extensions/${slug}/${areaLabel}`}
          className="text-[10px] font-medium text-indigo-600 hover:underline"
        >
          Edit {areaLabel} →
        </Link>
        {draftCount > 0 && (
          <span className="ml-1 rounded bg-amber-50 px-1 py-0.5 text-[9px] font-medium text-amber-700">
            {draftCount} draft{draftCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </td>
  );
}

/* ── Main table ── */

export function ExtensionsTable({
  extensions,
}: {
  extensions: ListExtension[];
}) {
  // Count extensions at draft maturity as a proxy for unpublished work
  const totalDrafts = extensions.filter((e) => e.maturity === "draft").length;

  return (
    <div className="overflow-x-auto">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-6 py-3">
        <input
          className="w-[200px] rounded-md border border-gray-300 px-2.5 py-1.5 text-xs"
          placeholder="Search extensions..."
        />
        <select className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs">
          <option>All succession</option>
          <option>Comprehensive</option>
          <option>Partial</option>
          <option>Outline</option>
        </select>
        <select className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs">
          <option>All tax</option>
          <option>Comprehensive</option>
          <option>Partial</option>
          <option>Outline</option>
        </select>
        <div className="flex-1" />
        <button className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
          + New Extension
        </button>
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-700">
              Extension
            </th>
            <th className="whitespace-nowrap px-2 py-2 text-left font-semibold text-gray-700">
              Legal Tradition
            </th>
            <th className="px-2 py-2 text-left font-semibold text-gray-700">
              Type
            </th>
            <th className="px-2 py-2 text-left font-semibold text-gray-700">
              Key Features
            </th>
            <th className="min-w-[170px] px-2 py-2 text-center font-semibold text-gray-700">
              Succession Rules
            </th>
            <th className="min-w-[170px] px-2 py-2 text-center font-semibold text-gray-700">
              Tax Treatment
            </th>
            <th className="px-2 py-2 text-center font-semibold text-gray-700">
              Scenarios
            </th>
            <th className="px-2 py-2 text-left font-semibold text-gray-700">
              Seeking
            </th>
          </tr>
        </thead>
        <tbody>
          {extensions.map((ext) => {
            const successionCount = countByCoverage(ext.properties, "succession");
            const taxCount = countByCoverage(ext.properties, "tax");
            const successionCoverage = coverageFromMetadata(ext.metadata, "succession");
            const taxCoverage = coverageFromMetadata(ext.metadata, "tax");
            const seeking =
              typeof ext.metadata?.seeking === "string" ? ext.metadata.seeking : null;

            return (
              <tr key={ext.slug} className="border-b border-gray-100">
                {/* Extension name */}
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/extensions/${ext.slug}`}
                    className="font-semibold text-gray-900 hover:text-indigo-600"
                  >
                    {ext.name}
                  </Link>
                </td>

                {/* Legal Tradition */}
                <td className="px-2 py-3 text-gray-500">
                  {ext.legal_tradition ?? "—"}
                </td>

                {/* Type badge */}
                <td className="px-2 py-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      typeBadgeStyles[ext.extension_type] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ext.extension_type}
                  </span>
                </td>

                {/* Key Features */}
                <td className="max-w-[180px] px-2 py-3 text-[11px] text-gray-500">
                  {ext.key_features ?? "—"}
                </td>

                {/* Succession Rules */}
                <CoverageCell
                  slug={ext.slug}
                  area="succession"
                  propCount={successionCount}
                  coverage={successionCoverage}
                  draftCount={0}
                />

                {/* Tax Treatment */}
                <CoverageCell
                  slug={ext.slug}
                  area="tax"
                  propCount={taxCount}
                  coverage={taxCoverage}
                  draftCount={0}
                />

                {/* Scenarios */}
                <td className="px-2 py-3 text-center">
                  {typeof ext.metadata?.scenarios === "number" &&
                  ext.metadata.scenarios > 0 ? (
                    <Link
                      href={`/extensions/${ext.slug}/scenarios`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {ext.metadata.scenarios}
                    </Link>
                  ) : (
                    <span className="text-gray-400">&mdash;</span>
                  )}
                </td>

                {/* Seeking */}
                <td className="px-2 py-3 text-[11px] text-gray-500">
                  {seeking ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 text-xs text-gray-400">
        <span>
          {extensions.length} extension{extensions.length !== 1 ? "s" : ""} total
        </span>
        {totalDrafts > 0 && (
          <Link
            href="/publish"
            className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Publish {totalDrafts} draft{totalDrafts !== 1 ? "s" : ""} → Create PR
          </Link>
        )}
      </div>
    </div>
  );
}
