"use client";

import { useEffect, useState, useMemo } from "react";
import { listSharedDefinitions } from "@/actions/properties";

type SharedDef = {
  id: string;
  name: string;
  description: string | null;
  field_summary: string | null;
};

export type DefsBrowserProps = {
  selected: string | null;
  onSelect: (defName: string) => void;
};

export function DefsBrowser({ selected, onSelect }: DefsBrowserProps) {
  const [definitions, setDefinitions] = useState<SharedDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listSharedDefinitions()
      .then((data) => {
        if (!cancelled) {
          setDefinitions(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load definitions");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return definitions;
    const q = search.toLowerCase();
    return definitions.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false) ||
        (d.field_summary?.toLowerCase().includes(q) ?? false),
    );
  }, [definitions, search]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
        Loading shared definitions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
        <p className="text-xs text-blue-700">
          <strong>Shared definitions ($defs)</strong> are reusable schema
          fragments defined centrally. Selecting one creates a{" "}
          <code className="font-mono">$ref</code> to the shared definition,
          ensuring consistency across extensions.
        </p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search definitions..."
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 focus:outline-none"
        />
      </div>

      {/* Definition cards */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
          {search ? "No definitions match your search" : "No shared definitions available"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((def) => {
            const isSelected = selected === def.name;
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => onSelect(def.name)}
                className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-gray-900">
                    {def.name}
                  </span>
                  {isSelected && (
                    <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      selected
                    </span>
                  )}
                </div>
                {def.description && (
                  <p className="mt-1 text-xs text-gray-500">
                    {def.description}
                  </p>
                )}
                {def.field_summary && (
                  <p className="mt-1 font-mono text-[11px] text-gray-400">
                    {def.field_summary}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
