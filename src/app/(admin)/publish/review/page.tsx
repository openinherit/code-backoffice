import { redirect } from "next/navigation";
import { generatePreview } from "@/actions/publish";
import { ReviewClient } from "./review-client";

export default async function ReviewPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  // Extract draft IDs from search params — supports ?id=a&id=b
  const rawIds = searchParams.id;
  const draftIds: string[] = Array.isArray(rawIds)
    ? rawIds
    : rawIds
      ? [rawIds]
      : [];

  if (draftIds.length === 0) {
    redirect("/publish");
  }

  const preview = await generatePreview(draftIds);

  if (preview.diffs.length === 0) {
    redirect("/publish");
  }

  // Compute summary stats
  const totalAdditions = preview.diffs.reduce((s, d) => s + d.additions, 0);
  const totalDeletions = preview.diffs.reduce((s, d) => s + d.deletions, 0);
  const addedFiles = preview.diffs.filter((d) => d.status === "added").length;
  const modifiedFiles = preview.diffs.filter(
    (d) => d.status === "modified",
  ).length;

  // Build branch name
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const branchName = `backoffice/publish-${dateStr}`;

  // Build default PR title & description
  const extensionNames = [
    ...new Set(
      preview.files.map((f) => {
        const parts = f.path.split("/");
        return parts[parts.length - 1].replace(".json", "");
      }),
    ),
  ];

  const defaultTitle = `feat: publish ${extensionNames.join(", ")} schema updates`;
  const defaultDescription = [
    `Publishes ${draftIds.length} draft${draftIds.length !== 1 ? "s" : ""} across ${extensionNames.length} extension${extensionNames.length !== 1 ? "s" : ""}.`,
    "",
    "**Changes:**",
    ...preview.diffs.map(
      (d) => `- \`${d.path}\` (${d.status}, +${d.additions}/-${d.deletions})`,
    ),
    "",
    "Created via INHERIT Backoffice.",
  ].join("\n");

  return (
    <ReviewClient
      draftIds={draftIds}
      diffs={preview.diffs}
      totalAdditions={totalAdditions}
      totalDeletions={totalDeletions}
      addedFiles={addedFiles}
      modifiedFiles={modifiedFiles}
      branchName={branchName}
      defaultTitle={defaultTitle}
      defaultDescription={defaultDescription}
    />
  );
}
