import { listOrganisations } from "@/actions/organisations";
import { listExtensions } from "@/actions/extensions";
import Link from "next/link";
import { InviteModal } from "@/components/invite-modal";

export default async function PartnersPage() {
  const [orgs, extensions] = await Promise.all([
    listOrganisations(),
    listExtensions(),
  ]);

  // Build extension name lookup
  const extNames = new Map<string, string>();
  for (const ext of extensions) {
    extNames.set(ext.slug, ext.name);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Partner Organisations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage partner organisations and their extension assignments.
          </p>
        </div>
        <InviteModal extensions={extensions} />
      </div>

      {orgs.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 px-6 py-16 text-center">
          <div className="mx-auto max-w-sm">
            <svg
              className="mx-auto h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-900">
              No partner organisations yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Invite your first partner to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-2 font-medium">Organisation</th>
                <th className="px-4 py-2 font-medium">Assignments</th>
                <th className="px-4 py-2 font-medium">Users</th>
                <th className="px-4 py-2 font-medium">Drafts</th>
                <th className="px-4 py-2 font-medium">Last Active</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-semibold text-gray-900">
                    {org.name}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {org.assignments.map((a) => (
                        <span key={a.id} className="inline-flex gap-1">
                          {a.succession && (
                            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                              {extNames.get(a.extension_id) ?? a.extension_id}{" "}
                              — succession
                            </span>
                          )}
                          {a.tax && (
                            <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              {extNames.get(a.extension_id) ?? a.extension_id}{" "}
                              — tax
                            </span>
                          )}
                        </span>
                      ))}
                      {org.assignments.length === 0 && (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {org.user_count}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {org.draft_count}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {org.last_active
                      ? new Date(org.last_active).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/partners/${org.slug}`}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Manage &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {orgs.length} organisation{orgs.length !== 1 ? "s" : ""} total
        </p>
        {orgs.some((o) => o.draft_count > 0) && (
          <Link
            href="/partners/drafts"
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Review all drafts &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
