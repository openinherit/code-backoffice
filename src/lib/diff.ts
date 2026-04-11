// Diff Engine — simple line-by-line text diff for schema preview.

export type DiffLine = {
  type: "added" | "removed" | "context";
  content: string;
  lineNumber?: number;
};

export type FileDiff = {
  path: string;
  status: "added" | "modified" | "deleted";
  additions: number;
  deletions: number;
  lines: DiffLine[];
};

/**
 * Compute a line-by-line diff between two strings.
 *
 * This is intentionally simple (not a proper LCS diff) — it compares
 * corresponding lines by index. Good enough for reviewing JSON Schema
 * changes where the structure is predictable.
 */
export function computeDiff(
  oldContent: string,
  newContent: string,
): DiffLine[] {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  const lines: DiffLine[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      if (oldLine !== undefined) {
        lines.push({ type: "context", content: oldLine, lineNumber: i + 1 });
      }
    } else {
      if (oldLine !== undefined) {
        lines.push({ type: "removed", content: oldLine, lineNumber: i + 1 });
      }
      if (newLine !== undefined) {
        lines.push({ type: "added", content: newLine, lineNumber: i + 1 });
      }
    }
  }

  return lines;
}

/**
 * Produce a FileDiff for a single path, comparing old content (or null for
 * a brand-new file) against the new content.
 */
export function computeFileDiff(
  path: string,
  oldContent: string | null,
  newContent: string,
): FileDiff {
  if (oldContent === null) {
    // Brand-new file — every non-empty line is an addition.
    const newLines = newContent.split("\n").filter((l) => l.length > 0);
    return {
      path,
      status: "added",
      additions: newLines.length,
      deletions: 0,
      lines: newLines.map((l, i) => ({
        type: "added" as const,
        content: l,
        lineNumber: i + 1,
      })),
    };
  }

  const diffLines = computeDiff(oldContent, newContent);
  return {
    path,
    status: "modified",
    additions: diffLines.filter((l) => l.type === "added").length,
    deletions: diffLines.filter((l) => l.type === "removed").length,
    lines: diffLines,
  };
}
