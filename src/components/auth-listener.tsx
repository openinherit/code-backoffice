"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Detects Supabase auth tokens in URL hash fragments (implicit flow)
 * and redirects authenticated users via full page navigation.
 */
export function AuthListener() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/login") return;

    const hash = window.location.hash;
    if (!hash) return;

    // Handle error fragments (e.g. expired magic link)
    if (hash.includes("error=")) {
      // Clear the hash so the error doesn't persist on refresh
      window.history.replaceState(null, "", "/login");
      return;
    }

    if (!hash.includes("access_token")) return;

    console.log("[AuthListener] Hash fragment detected, setting session...");

    const supabase = createClient();
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      console.error("[AuthListener] Missing access_token or refresh_token");
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ data, error }) => {
        if (error) {
          console.error("[AuthListener] setSession failed:", error.message);
          return;
        }

        console.log("[AuthListener] Session set for:", data.user?.email);

        // Full page redirect — ensures server sees the cookies
        // The server-side admin/partner layout handles role-based routing
        window.location.href = "/extensions";
      });
  }, [pathname]);

  return null;
}
