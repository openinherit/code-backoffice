"use client";

import { useState, useTransition } from "react";
import { createOrganisation } from "@/actions/organisations";

type Extension = {
  slug: string;
  name: string;
};

export function InviteModal({ extensions }: { extensions: Extension[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [extensionSlug, setExtensionSlug] = useState("");
  const [succession, setSuccession] = useState(false);
  const [tax, setTax] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  function reset() {
    setName("");
    setExtensionSlug("");
    setSuccession(false);
    setTax(false);
    setAdminEmail("");
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Organisation name is required.");
      return;
    }
    if (!extensionSlug) {
      setError("Please select an extension.");
      return;
    }
    if (!succession && !tax) {
      setError("At least one role (Succession or Tax) must be selected.");
      return;
    }
    if (!adminEmail.trim()) {
      setError("Admin email is required.");
      return;
    }

    startTransition(async () => {
      try {
        await createOrganisation({
          name: name.trim(),
          extensionSlug,
          succession,
          tax,
          adminEmail: adminEmail.trim(),
        });
        setSuccess(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create organisation.",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
      >
        + Invite Organisation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Invite Organisation
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Create a new partner organisation and send an invitation.
              </p>
            </div>

            {success ? (
              <div className="px-6 py-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Organisation created
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  An invitation record has been created for {adminEmail}. Email
                  delivery is not yet active — share the link manually.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 px-6 py-4">
                  {error && (
                    <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="org-name"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Organisation name
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. Farrer & Co"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="extension"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Extension
                    </label>
                    <select
                      id="extension"
                      value={extensionSlug}
                      onChange={(e) => setExtensionSlug(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Select an extension...</option>
                      {extensions.map((ext) => (
                        <option key={ext.slug} value={ext.slug}>
                          {ext.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <fieldset>
                    <legend className="text-xs font-medium text-gray-700">
                      Roles (at least one required)
                    </legend>
                    <div className="mt-2 flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={succession}
                          onChange={(e) => setSuccession(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Succession
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={tax}
                          onChange={(e) => setTax(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Tax
                      </label>
                    </div>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="admin-email"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Admin email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="admin@partner.com"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isPending ? "Creating..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
