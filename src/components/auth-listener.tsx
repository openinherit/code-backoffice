"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Detects Supabase auth tokens in URL hash fragments (implicit flow)
 * and redirects authenticated users to the appropriate page.
 */
export function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on the login page where hash fragments arrive
    if (pathname !== "/login") return;

    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;

    const supabase = createClient();

    // Parse the hash fragment and set the session
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(async ({ data: { user }, error }) => {
          if (error || !user) {
            console.error("Failed to set session:", error);
            return;
          }

          // Clear the hash from the URL
          window.history.replaceState(null, "", "/login");

          // Get role for redirect
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile?.role === "admin") {
            router.push("/extensions");
          } else {
            router.push("/");
          }
        });
    }
  }, [pathname, router]);

  return null;
}
