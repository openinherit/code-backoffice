import { getOrganisation } from "@/actions/organisations";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrgActions } from "@/components/org-actions";

const roleBadge: Record<string, string> = {
  org_admin: "bg-indigo-100 text-indigo-700",
  org_member: "bg-gray-100 text-gray-600",
  admin: "bg-red-100 text-red-700",
};

const statusBadge: Record<string, string> = {
  partner_draft: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-600",
  publishing: "bg-indigo-100 text-indigo-700",
  published: "bg-green-100 text-green-700",
};

export default async function OrgDetailPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const params = await props.params;

  let org;
  try {
    org = await getOrganisation(params.orgSlug);
  } catch {
    notFound();
  }

  const pendingInvites = org.invitations.filter((i) => !i.accepted_at);

  return (
    <div className="p-6">
      <Link
        href="/partners"
        className="text-sm text-indigo-600 hover:underline"
      >
        &larr; Back to partners
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{org.name}</h2>
          <p className="mt-1 text-xs text-gray-500">
            Created{" "}
            {new Date(org.created_at).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Extension Assignments */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Extension Assignments
          </h3>
          <OrgActions orgId={org.id} orgSlug={org.slug} />
        </div>

        {org.assignments.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400">
            No extension assignments yet.
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-2 font-medium">Extension</th>
                  <th className="px-4 py-2 font-medium">Roles</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {org.assignments.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-semibold text-gray-900">
                      {a.extension_name}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {a.succession && (
                          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                            succession
                          </span>
                        )}
                        {a.tax && (
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            tax
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/extensions/${a.extension_id}`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        View extension &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Users */}
      <section className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900">
          Users ({org.users.length})
        </h3>

        {org.users.length === 0 && pendingInvites.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400">
            No users yet. Pending invitations will appear here.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {/* Active users */}
            {org.users.map((user) => {
              const initials = (
                user.display_name ??
                user.email.split("@")[0] ??
                "?"
              )
                .split(/\s+/)
                .map((w) => w[0]?.toUpperCase())
                .join("")
                .slice(0, 2);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.display_name ?? user.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${roleBadge[user.role] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Pending invitations */}
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 opacity-70"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-500">
                    ?
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {invite.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Invited{" "}
                      {new Date(invite.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                      {" — "}
                      {new Date(invite.expires_at) < new Date() ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        <span className="text-amber-600">Pending</span>
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${roleBadge[invite.role] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {invite.role.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Drafts */}
      <section className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900">
          Drafts ({org.drafts.length})
        </h3>

        {org.drafts.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400">
            No drafts from this organisation.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {org.drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-900">
                      {draft.name}
                    </span>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[draft.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {draft.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {draft.extension_id} &middot;{" "}
                      {draft.coverage_area ?? "—"}
                    </span>
                  </div>
                  {draft.description && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {draft.description}
                    </p>
                  )}
                  {draft.review_note && (
                    <p className="mt-1 text-xs text-red-600">
                      Review note: {draft.review_note}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(draft.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
