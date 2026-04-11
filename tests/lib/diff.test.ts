import { describe, it, expect } from "vitest";
import { computeDiff, computeFileDiff } from "@/lib/diff";

// ------------------------------------------------------------------
// computeDiff
// ------------------------------------------------------------------

describe("computeDiff", () => {
  it("returns only context lines for identical content", () => {
    const text = '{\n  "a": 1\n}';
    const lines = computeDiff(text, text);

    expect(lines.every((l) => l.type === "context")).toBe(true);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual({ type: "context", content: "{", lineNumber: 1 });
    expect(lines[1]).toEqual({
      type: "context",
      content: '  "a": 1',
      lineNumber: 2,
    });
    expect(lines[2]).toEqual({ type: "context", content: "}", lineNumber: 3 });
  });

  it("marks added lines when new content is longer", () => {
    const oldText = "line1";
    const newText = "line1\nline2\nline3";
    const lines = computeDiff(oldText, newText);

    expect(lines[0]).toEqual({
      type: "context",
      content: "line1",
      lineNumber: 1,
    });
    expect(lines[1]).toEqual({
      type: "added",
      content: "line2",
      lineNumber: 2,
    });
    expect(lines[2]).toEqual({
      type: "added",
      content: "line3",
      lineNumber: 3,
    });
  });

  it("marks removed lines when old content is longer", () => {
    const oldText = "line1\nline2\nline3";
    const newText = "line1";
    const lines = computeDiff(oldText, newText);

    expect(lines[0]).toEqual({
      type: "context",
      content: "line1",
      lineNumber: 1,
    });
    expect(lines[1]).toEqual({
      type: "removed",
      content: "line2",
      lineNumber: 2,
    });
    expect(lines[2]).toEqual({
      type: "removed",
      content: "line3",
      lineNumber: 3,
    });
  });

  it("marks changed lines as removed + added", () => {
    const oldText = "hello world";
    const newText = "hello planet";
    const lines = computeDiff(oldText, newText);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({
      type: "removed",
      content: "hello world",
      lineNumber: 1,
    });
    expect(lines[1]).toEqual({
      type: "added",
      content: "hello planet",
      lineNumber: 1,
    });
  });

  it("handles empty old content", () => {
    const lines = computeDiff("", "new line");
    // "" splits to [""], "new line" splits to ["new line"]
    // Line 1: "" vs "new line" → removed + added
    expect(lines.some((l) => l.type === "removed")).toBe(true);
    expect(lines.some((l) => l.type === "added")).toBe(true);
  });

  it("handles empty new content", () => {
    const lines = computeDiff("old line", "");
    expect(lines.some((l) => l.type === "removed")).toBe(true);
    expect(lines.some((l) => l.type === "added")).toBe(true);
  });

  it("handles both empty", () => {
    const lines = computeDiff("", "");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({ type: "context", content: "", lineNumber: 1 });
  });

  it("handles multi-line changes in the middle", () => {
    const oldText = "a\nb\nc\nd";
    const newText = "a\nB\nC\nd";
    const lines = computeDiff(oldText, newText);

    expect(lines[0]).toEqual({ type: "context", content: "a", lineNumber: 1 });
    expect(lines[1]).toEqual({
      type: "removed",
      content: "b",
      lineNumber: 2,
    });
    expect(lines[2]).toEqual({
      type: "added",
      content: "B",
      lineNumber: 2,
    });
    expect(lines[3]).toEqual({
      type: "removed",
      content: "c",
      lineNumber: 3,
    });
    expect(lines[4]).toEqual({
      type: "added",
      content: "C",
      lineNumber: 3,
    });
    expect(lines[5]).toEqual({ type: "context", content: "d", lineNumber: 4 });
  });
});

// ------------------------------------------------------------------
// computeFileDiff
// ------------------------------------------------------------------

describe("computeFileDiff", () => {
  it("returns status 'added' when old content is null", () => {
    const diff = computeFileDiff(
      "v3/extensions/scotland/scotland.json",
      null,
      '{\n  "type": "object"\n}\n',
    );

    expect(diff.path).toBe("v3/extensions/scotland/scotland.json");
    expect(diff.status).toBe("added");
    expect(diff.deletions).toBe(0);
    // Non-empty lines: "{", '  "type": "object"', "}"
    expect(diff.additions).toBe(3);
    expect(diff.lines.every((l) => l.type === "added")).toBe(true);
  });

  it("returns status 'modified' when old content is provided", () => {
    const oldContent = '{\n  "a": 1\n}';
    const newContent = '{\n  "a": 2\n}';
    const diff = computeFileDiff("test.json", oldContent, newContent);

    expect(diff.status).toBe("modified");
    expect(diff.additions).toBe(1);
    expect(diff.deletions).toBe(1);
  });

  it("counts additions and deletions correctly", () => {
    const oldContent = "line1\nline2\nline3";
    const newContent = "line1\nchanged\nline3\nline4";
    const diff = computeFileDiff("file.txt", oldContent, newContent);

    expect(diff.status).toBe("modified");
    // line2 → changed: 1 removal + 1 addition; line4 added: 1 addition
    expect(diff.additions).toBe(2);
    expect(diff.deletions).toBe(1);
  });

  it("returns zero additions/deletions for identical content", () => {
    const content = '{\n  "stable": true\n}';
    const diff = computeFileDiff("same.json", content, content);

    expect(diff.status).toBe("modified");
    expect(diff.additions).toBe(0);
    expect(diff.deletions).toBe(0);
    expect(diff.lines.every((l) => l.type === "context")).toBe(true);
  });

  it("filters empty lines from new-file additions", () => {
    // A trailing newline produces an empty string after split
    const diff = computeFileDiff("new.json", null, "hello\n");
    // "hello\n" splits to ["hello", ""] — only "hello" is non-empty
    expect(diff.additions).toBe(1);
    expect(diff.lines).toHaveLength(1);
    expect(diff.lines[0].content).toBe("hello");
  });
});
