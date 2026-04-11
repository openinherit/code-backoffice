import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Admins should use the admin layout
  if (profile.role === "admin") {
    redirect("/extensions");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">INHERIT Backoffice</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{profile.email}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-red-500 hover:underline">Sign out</button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
