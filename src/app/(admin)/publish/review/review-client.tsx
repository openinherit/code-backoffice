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
