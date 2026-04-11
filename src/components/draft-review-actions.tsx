"use client";

import { useState, useTransition } from "react";
import { approveDraft, rejectDraft } from "@/actions/drafts";

export function DraftReviewActions({ draftId }: { draftId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);

  if (result === "approved") {
    return (
      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
        Approved
      </span>
    );
  }

  if (result === "rejected") {
    return (
      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Rejected
      </span>
    );
  }

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveDraft(draftId);
        setResult("approved");
      } catch {
        // Silently handle — the page will revalidate
      }
    });
  }

  function handleReject() {
    if (!rejectNote.trim()) return;
    startTransition(async () => {
      try {
        await rejectDraft(draftId, rejectNote.trim());
        setResult("rejected");
      } catch {
        // Silently handle
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {showReject ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Reason for rejection..."
            className="w-48 rounded border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleReject}
            disabled={isPending || !rejectNote.trim()}
            className="rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => {
              setShowReject(false);
              setRejectNote("");
            }}
            className="text-[10px] text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-md bg-green-600 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "..." : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={isPending}
            className="rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
