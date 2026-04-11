"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPublishableDrafts,
  type PublishableGroup,
} from "@/actions/publish";

export default function PublishPage() {
  const [groups, setGroups] = useState<PublishableGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getPublishableDrafts();
        setGroups(data);
        // Select all by default
        const allIds = new Set(
          data.flatMap((g) => g.drafts.map((d) => d.id)),
        );
        setSelected(allIds);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load drafts",
        );
      } finally {
        setLoading(false);
      }
    });
  }, []);

  function toggleDraft(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    const allIds = groups.flatMap((g) => g.drafts.map((d) => d.id));
    if (selected.size === allIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  function handleReview() {
    if (selected.size === 0) return;
    const params = new URLSearchParams();
    for (const id of selected) {
      params.append("id", id);
    }
    router.push(`/publish/review?${params.toString()}`);
  }

  const allIds = groups.flatMap((g) => g.drafts.map((d) => d.id));
  const allSelected = allIds.length > 0 && selected.size === allIds.length;

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Loading publishable drafts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Publish to GitHub</h1>
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No drafts to publish. All changes are already published.
          </p>
          <Link
            href="/extensions"
            className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
          >
            &larr; Back to extensions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Publish to GitHub</h1>
          <p className="mt-1 text-sm text-gray-500">
            Select the drafts you want to include in this pull request.
          </p>
        </div>
        <Link
          href="/extensions"
          className="text-sm text-indigo-600 hover:underline"
        >
          &larr; Back to extensions
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        {/* Select all */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <input
            type="checkbox"
            id="select-all"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
            Select all ({allIds.length} draft{allIds.length !== 1 ? "s" : ""})
          </label>
        </div>

        {groups.map((group) => (
          <div key={group.extension.slug}>
            <h2 className="text-sm font-semibold text-gray-900">
              {group.extension.name}
              <span className="ml-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                {group.extension.maturity}
              </span>
            </h2>
            <p className="mt-0.5 font-mono text-xs text-gray-400">
              {group.extension.schema_path}
            </p>

            <div className="mt-2 space-y-1">
              {group.drafts.map((draft) => (
                <label
                  key={draft.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(draft.id)}
                    onChange={() => toggleDraft(draft.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {draft.name}
                      </span>
                      <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                        {draft.schema_type}
                      </span>
                      {draft.coverage_area && (
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                          {draft.coverage_area}
                        </span>
                      )}
                    </div>
                    {draft.description && (
                      <p className="mt-0.5 text-xs text-gray-500 truncate">
                        {draft.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">
          {selected.size} of {allIds.length} draft{allIds.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
        <button
          type="button"
          onClick={handleReview}
          disabled={selected.size === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review changes &rarr;
        </button>
      </div>
    </div>
  );
}
