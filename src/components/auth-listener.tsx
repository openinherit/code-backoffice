"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Listens for Supabase auth events (e.g. hash fragment tokens from magic links)
 * and redirects authenticated users to the appropriate page.
 *
 * Mounted in the root layout so it runs on every page.
 */
export function AuthListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        // Get the user's role to determine redirect
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
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
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
