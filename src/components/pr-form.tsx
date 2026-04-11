"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishDrafts } from "@/actions/publish";

type PrFormProps = {
  draftIds: string[];
  defaultTitle: string;
  defaultDescription: string;
  branchName: string;
};

export function PrForm({
  draftIds,
  defaultTitle,
  defaultDescription,
  branchName,
}: PrFormProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await publishDrafts({
          draftIds,
          title,
          description,
        });

        const params = new URLSearchParams({
          pr_number: String(result.prNumber),
          pr_url: result.prUrl,
          title,
          branch: branchName,
        });

        router.push(`/publish/complete?${params.toString()}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create PR");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="pr-title"
          className="block text-sm font-medium text-gray-700"
        >
          PR title
        </label>
        <input
          id="pr-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="pr-description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="pr-description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Branch
        </label>
        <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 font-mono text-sm text-gray-600">
          {branchName}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !title.trim()}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating PR..." : "Create Pull Request"}
      </button>
    </form>
  );
}
