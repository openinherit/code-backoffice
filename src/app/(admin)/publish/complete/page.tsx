import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PublishCompletePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const prNumber = typeof searchParams.pr_number === "string"
    ? searchParams.pr_number
    : null;
  const prUrl = typeof searchParams.pr_url === "string"
    ? searchParams.pr_url
    : null;
  const title = typeof searchParams.title === "string"
    ? searchParams.title
    : "Schema update";
  const branch = typeof searchParams.branch === "string"
    ? searchParams.branch
    : "backoffice/publish";

  if (!prNumber || !prUrl) {
    redirect("/publish");
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-lg pt-8 text-center">
        {/* Green tick */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Pull Request Created
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your schema changes have been pushed to GitHub.
        </p>

        {/* PR card */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Open
            </span>
            <span className="font-mono text-xs text-gray-500">
              #{prNumber}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 font-mono text-xs text-gray-400">
            {branch} &rarr; main
          </p>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            View on GitHub &rarr;
          </a>
        </div>

        {/* What happens next */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left">
          <h2 className="text-sm font-semibold text-gray-900">
            What happens next
          </h2>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600">
            <li>CI runs linting and validation on the PR</li>
            <li>A maintainer reviews and approves the changes</li>
            <li>The PR is merged into <code className="text-xs">main</code></li>
            <li>npm publish triggers automatically from the release workflow</li>
          </ol>
        </div>

        {/* Publishing status info box */}
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> Your drafts are now in{" "}
            <span className="font-semibold">publishing</span> status. They will
            be marked as <span className="font-semibold">published</span> once
            the PR is merged, or reverted to{" "}
            <span className="font-semibold">draft</span> if the PR is closed.
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/extensions"
            className="text-sm text-indigo-600 hover:underline"
          >
            &larr; Back to extensions
          </Link>
        </div>
      </div>
    </div>
  );
}
