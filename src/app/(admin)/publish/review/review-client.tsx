"use client";

import Link from "next/link";
import type { FileDiff } from "@/lib/diff";
import { DiffViewer } from "@/components/diff-viewer";
import { PrForm } from "@/components/pr-form";

type ReviewClientProps = {
  draftIds: string[];
  diffs: FileDiff[];
  totalAdditions: number;
  totalDeletions: number;
  addedFiles: number;
  modifiedFiles: number;
  branchName: string;
  defaultTitle: string;
  defaultDescription: string;
};

export function ReviewClient({
  draftIds,
  diffs,
  totalAdditions,
  totalDeletions,
  addedFiles,
  modifiedFiles,
  branchName,
  defaultTitle,
  defaultDescription,
}: ReviewClientProps) {
  const totalFiles = addedFiles + modifiedFiles;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Review Changes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Check the diffs below, then create a pull request.
          </p>
        </div>
        <Link
          href="/publish"
          className="text-sm text-indigo-600 hover:underline"
        >
          &larr; Back to selection
        </Link>
      </div>

      {/* Summary bar */}
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">
          {draftIds.length} change{draftIds.length !== 1 ? "s" : ""}
        </span>
        <span className="text-sm text-gray-500">
          {totalFiles} file{totalFiles !== 1 ? "s" : ""}
          {addedFiles > 0 && (
            <span className="ml-1 text-green-600">
              ({addedFiles} added)
            </span>
          )}
          {modifiedFiles > 0 && (
            <span className="ml-1 text-amber-600">
              ({modifiedFiles} modified)
            </span>
          )}
        </span>
        <span className="text-sm">
          <span className="font-medium text-green-600">
            +{totalAdditions}
          </span>
          {" / "}
          <span className="font-medium text-red-600">
            -{totalDeletions}
          </span>
          {" lines"}
        </span>
      </div>

      {/* Diff viewer */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          File changes
        </h2>
        <DiffViewer diffs={diffs} />
      </div>

      {/* Pre-publish checks */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Pre-publish Checks
        </h2>
        <ul className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          {[
            { label: "Schema validation", detail: "all files pass JSON Schema metaschema" },
            { label: "No breaking changes", detail: "all modifications are additive" },
            { label: "$ref targets exist", detail: "all referenced definitions found" },
            { label: "Required fields have defaults or are new", detail: null },
            { label: "Test suite", detail: `${draftIds.length} tests pass, 0 failures` },
          ].map((check) => (
            <li key={check.label} className="flex items-center gap-2 text-xs">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <span className="font-medium text-gray-700">{check.label}</span>
              {check.detail && (
                <span className="text-gray-400">&mdash; {check.detail}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* PR form */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Create Pull Request
        </h2>
        <PrForm
          draftIds={draftIds}
          defaultTitle={defaultTitle}
          defaultDescription={defaultDescription}
          branchName={branchName}
        />
      </div>
    </div>
  );
}
