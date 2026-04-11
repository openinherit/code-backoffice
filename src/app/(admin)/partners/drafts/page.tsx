import { listPartnerDrafts } from "@/actions/drafts";
import Link from "next/link";
import { DraftReviewActions } from "@/components/draft-review-actions";

const statusBadge: Record<string, string> = {
  partner_draft: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-600",
  publishing: "bg-indigo-100 text-indigo-700",
  published: "bg-green-100 text-green-700",
};

export default async function DraftReviewPage() {
  const drafts = await listPartnerDrafts();

  // Group drafts by organisation
  const grouped = new Map<
    string,
    { orgName: string; orgSlug: string | null; drafts: typeof drafts }
  >();
  for (const draft of drafts) {
    const key = draft.organisation_slug ?? "unaffiliated";
    if (!grouped.has(key)) {
      grouped.set(key, {
        orgName: draft.organisation_name ?? "Unaffiliated",
        orgSlug: draft.organisation_slug,
        drafts: [],
      });
    }
    grouped.get(key)!.drafts.push(draft);
  }

  const totalNew = drafts.filter((d) => !d.property_id).length;
  const totalModifications = drafts.filter((d) => !!d.property_id).length;

  return (
    <div className="p-6">
      <Link
        href="/partners"
        className="text-sm text-indigo-600 hover:underline"
      >
        &larr; Back to partners
      </Link>

      <h1 className="mt-4 text-xl font-semibold">Draft Review</h1>
      <p className="mt-1 text-sm text-gray-500">
        Review property drafts submitted by partner organisations.
      </p>

      {/* Filter summary */}
      <div className="mt-4 flex gap-2">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          All ({drafts.length})
        </span>
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
          New properties ({totalNew})
        </span>
        <span className="inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600">
          Modifications ({totalModifications})
        </span>
      </div>

      {drafts.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-900">
            No drafts to review
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Partner drafts will appear here once organisations start submitting
            property definitions.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {[...grouped.entries()].map(
            ([key, { orgName, orgSlug, drafts: orgDrafts }]) => (
              <section key={key}>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {orgName}
                  </h2>
                  {orgSlug && (
                    <Link
                      href={`/partners/${orgSlug}`}
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      View org
                    </Link>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {orgDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">
                              {draft.extension_name}
                            </span>
                            <span className="text-[10px] text-gray-300">
                              &rarr;
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {draft.coverage_area ?? "—"}
                            </span>
                            <span className="text-[10px] text-gray-300">
                              &rarr;
                            </span>
                            <span className="font-mono text-sm font-bold text-gray-900">
                              {draft.name}
                            </span>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[draft.status] ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {draft.status.replace("_", " ")}
                            </span>
                            {!draft.property_id && (
                              <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                                new
                              </span>
                            )}
                          </div>

                          {draft.description && (
                            <p className="mt-1 text-xs text-gray-500">
                              {draft.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                            <span>
                              By {draft.author_name ?? draft.author_email}
                            </span>
                            <span>
                              {new Date(draft.created_at).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>

                          {draft.review_note && (
                            <p className="mt-1 text-xs text-red-600">
                              Review note: {draft.review_note}
                            </p>
                          )}
                        </div>

                        {draft.status === "partner_draft" && (
                          <DraftReviewActions draftId={draft.id} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}

      {/* Footer with bulk approve */}
      {drafts.filter((d) => d.status === "partner_draft").length > 0 && (
        <div className="mt-6 flex items-center justify-end border-t border-gray-200 pt-4">
          <button
            type="button"
            className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Approve all{" "}
            {drafts.filter((d) => d.status === "partner_draft").length} drafts
          </button>
        </div>
      )}
    </div>
  );
}
