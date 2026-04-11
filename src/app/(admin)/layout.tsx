import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
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
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">INHERIT Backoffice</span>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
            ADMIN
          </span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-gray-500">
          <Link
            href="/extensions"
            className="font-medium text-indigo-600 hover:underline"
          >
            Extensions
          </Link>
          <Link
            href="/partners"
            className="font-medium text-indigo-600 hover:underline"
          >
            Partners
          </Link>
          <span className="text-gray-300">|</span>
          <span>{profile.email}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-red-500 hover:underline">Sign out</button>
          </form>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
