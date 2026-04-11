"use client";

import { useState, useTransition } from "react";
import { getUserContext, sendMagicLink } from "@/actions/auth";
import type { UserContext } from "@/actions/auth";

type Step = "email" | "magic-link-sent" | "not-found";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [context, setContext] = useState<UserContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const ctx = await getUserContext(email.trim().toLowerCase());

      if (!ctx) {
        setStep("not-found");
        return;
      }

      setContext(ctx);

      const result = await sendMagicLink(email.trim().toLowerCase());
      if (result.error) {
        setError(result.error);
        return;
      }

      setStep("magic-link-sent");
    });
  }

  function handleResend() {
    setError(null);
    startTransition(async () => {
      const result = await sendMagicLink(email.trim().toLowerCase());
      if (result.error) {
        setError(result.error);
      }
    });
  }

  function handleUseDifferentEmail() {
    setStep("email");
    setContext(null);
    setError(null);
    setEmail("");
  }

  // Derive the initial for the org avatar
  const orgInitial = context?.organisation_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="w-80">
      <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
      <p className="mt-1 text-sm text-gray-500">
        Access your INHERIT Backoffice account
      </p>

      {/* Step: Email input */}
      {(step === "email" || step === "not-found") && (
        <form onSubmit={handleContinue} className="mt-6">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (step === "not-found") setStep("email");
            }}
            placeholder="you@example.com"
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${
              step === "not-found"
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />

          {step === "not-found" && (
            <p className="mt-1.5 text-xs text-red-600">
              No account found for this email. INHERIT Backoffice is
              invite-only.
            </p>
          )}

          {error && (
            <p className="mt-1.5 text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Checking..." : "Continue"}
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            INHERIT Backoffice is invite-only. You need an invitation to
            sign in.
          </p>
        </form>
      )}

      {/* Step: Magic link sent */}
      {step === "magic-link-sent" && context && (
        <div className="mt-6 space-y-4">
          {/* Context card */}
          {context.role === "admin" ? (
            <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
              <span className="inline-flex items-center rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
                ADMIN
              </span>
              <span className="text-sm text-gray-700">
                {context.display_name ?? context.email}
              </span>
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {orgInitial}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {context.organisation_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {context.display_name ?? context.email}
                  </p>
                </div>
              </div>

              {context.assignments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {context.assignments.map((a) => (
                    <span
                      key={a.extension_id}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {a.extension_id}
                      {a.succession && " \u00b7 Succession"}
                      {a.tax && " \u00b7 Tax"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Check your email confirmation */}
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-3">
            <p className="text-sm font-medium text-green-800">
              Check your email
            </p>
            <p className="mt-0.5 text-xs text-green-700">
              We sent a magic link to{" "}
              <span className="font-medium">{email}</span>. Click it to
              sign in.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleResend}
              disabled={isPending}
              className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Resend link"}
            </button>
            <button
              type="button"
              onClick={handleUseDifferentEmail}
              className="text-gray-500 hover:text-gray-700"
            >
              Use different email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
