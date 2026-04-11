import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(css|js|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|ico)$/) ||
    publicRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Handle PKCE auth redirect — Supabase redirects to site root with ?code=
  // Route it to /auth/callback so the handler can exchange the code
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Auth check — refresh session cookies but don't block.
  // The admin/partner layouts handle auth redirects.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const proxyConfig = {
  matcher: [
    "/((?!_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|ico)$).*)",
  ],
};
