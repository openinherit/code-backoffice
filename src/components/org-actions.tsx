"use client";

/**
 * Placeholder client component for org-level actions on the detail page.
 * "Add assignment" and "Edit organisation" buttons will be wired to modals
 * in a future iteration. For now, this provides the UI anchor points.
 */
export function OrgActions(props: { orgId: string; orgSlug: string }) {
  void props;
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        title="Add assignment — coming soon"
        disabled
      >
        + Add assignment
      </button>
    </div>
  );
}
