"use client";

import { useState } from "react";
import type { FileDiff, DiffLine } from "@/lib/diff";

const statusLabel: Record<string, string> = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
};

const statusBadge: Record<string, string> = {
  added: "bg-green-100 text-green-700",
  modified: "bg-amber-100 text-amber-700",
  deleted: "bg-red-100 text-red-700",
};

function DiffLineRow({ line }: { line: DiffLine }) {
  const bg =
    line.type === "added"
      ? "bg-green-50"
      : line.type === "removed"
        ? "bg-red-50"
        : "";

  const prefix =
    line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";

  const textColour =
    line.type === "added"
      ? "text-green-800"
      : line.type === "removed"
        ? "text-red-800"
        : "text-gray-600";

  return (
    <tr className={bg}>
      <td className="w-12 select-none px-2 py-0 text-right text-[11px] text-gray-400">
        {line.lineNumber ?? ""}
      </td>
      <td className="w-5 select-none px-1 py-0 text-center text-[11px] font-mono text-gray-400">
        {prefix}
      </td>
      <td className={`px-2 py-0 font-mono text-[11px] whitespace-pre ${textColour}`}>
        {line.content}
      </td>
    </tr>
  );
}

function FileCard({ diff }: { diff: FileDiff }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-2 text-left text-sm hover:bg-gray-100"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-700">{diff.path}</span>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[diff.status] ?? "bg-gray-100 text-gray-600"}`}
          >
            {statusLabel[diff.status] ?? diff.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {diff.additions > 0 && (
            <span className="font-medium text-green-600">
              +{diff.additions}
            </span>
          )}
          {diff.deletions > 0 && (
            <span className="font-medium text-red-600">
              -{diff.deletions}
            </span>
          )}
          <span className="text-gray-400">{collapsed ? "▸" : "▾"}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {diff.lines.map((line, i) => (
                <DiffLineRow key={i} line={line} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function DiffViewer({ diffs }: { diffs: FileDiff[] }) {
  if (diffs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
        <p className="text-sm text-gray-500">No changes detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {diffs.map((diff) => (
        <FileCard key={diff.path} diff={diff} />
      ))}
    </div>
  );
}
