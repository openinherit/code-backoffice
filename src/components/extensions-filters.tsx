"use client";

import { useState } from "react";
import type { ListExtension } from "@/actions/extensions";
import { ExtensionsTable } from "@/components/extensions-table";

export function FilteredExtensionsTable({
  extensions,
}: {
  extensions: ListExtension[];
}) {
  const [search, setSearch] = useState("");
  const [successionFilter, setSuccessionFilter] = useState<string>("all");
  const [taxFilter, setTaxFilter] = useState<string>("all");

  const filtered = extensions.filter((ext) => {
    // Search by name
    if (search && !ext.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Succession coverage filter
    if (successionFilter !== "all") {
      const coverage =
        typeof ext.metadata?.successionCoverage === "string"
          ? ext.metadata.successionCoverage
          : null;
      if (coverage !== successionFilter) return false;
    }

    // Tax coverage filter
    if (taxFilter !== "all") {
      const coverage =
        typeof ext.metadata?.taxCoverage === "string"
          ? ext.metadata.taxCoverage
          : null;
      if (coverage !== taxFilter) return false;
    }

    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-6 py-3">
        <input
          className="w-[200px] rounded-md border border-gray-300 px-2.5 py-1.5 text-xs"
          placeholder="Search extensions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs"
          value={successionFilter}
          onChange={(e) => setSuccessionFilter(e.target.value)}
        >
          <option value="all">All succession</option>
          <option value="comprehensive">Comprehensive</option>
          <option value="partial">Partial</option>
          <option value="outline">Outline</option>
        </select>
        <select
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs"
          value={taxFilter}
          onChange={(e) => setTaxFilter(e.target.value)}
        >
          <option value="all">All tax</option>
          <option value="comprehensive">Comprehensive</option>
          <option value="partial">Partial</option>
          <option value="outline">Outline</option>
        </select>
        <div className="flex-1" />
        <button className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
          + New Extension
        </button>
      </div>

      <ExtensionsTable extensions={filtered} />
    </div>
  );
}
