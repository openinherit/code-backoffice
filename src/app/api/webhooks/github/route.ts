import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * GitHub webhook handler for pull_request events.
 *
 * When a PR created by the publish flow is merged, drafts transition
 * from "publishing" to "published". When a PR is closed without merge,
 * drafts revert to "draft".
 *
 * Uses the Supabase service-role client (not the per-user cookie-based
 * client) because webhooks arrive without auth cookies.
 */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role credentials are not configured");
  }
  return createClient(url, key);
}

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret is configured, skip verification (development mode)
    return true;
  }
  if (!signature) return false;

  const expected =
    "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(signature, "utf-8"),
      Buffer.from(expected, "utf-8"),
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");

  // Only handle pull_request events
  if (event !== "pull_request") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const payload = JSON.parse(body) as {
    action: string;
    pull_request: {
      number: number;
      merged: boolean;
      merged_at: string | null;
    };
  };

  const { action, pull_request: pr } = payload;
  const prNumber = pr.number;

  // We only care about "closed" events (which includes merges)
  if (action !== "closed") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = getSupabase();

  // Look up this PR in our publish_history
  const { data: history, error: historyError } = await supabase
    .from("publish_history")
    .select("id, draft_ids, status")
    .eq("pr_number", prNumber)
    .single();

  if (historyError || !history) {
    // Not a PR we created — ignore
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Already processed
  if (history.status === "merged" || history.status === "closed") {
    return NextResponse.json({ ok: true, already_processed: true });
  }

  const draftIds: string[] = history.draft_ids ?? [];

  if (pr.merged) {
    // PR was merged — mark drafts as published
    if (draftIds.length > 0) {
      await supabase
        .from("property_drafts")
        .update({ status: "published" })
        .in("id", draftIds);
    }

    await supabase
      .from("publish_history")
      .update({
        status: "merged",
        merged_at: pr.merged_at ?? new Date().toISOString(),
      })
      .eq("id", history.id);

    return NextResponse.json({ ok: true, action: "merged", prNumber });
  } else {
    // PR was closed without merge — revert drafts to draft
    if (draftIds.length > 0) {
      await supabase
        .from("property_drafts")
        .update({ status: "draft" })
        .in("id", draftIds);
    }

    await supabase
      .from("publish_history")
      .update({ status: "closed" })
      .eq("id", history.id);

    return NextResponse.json({ ok: true, action: "closed", prNumber });
  }
}
