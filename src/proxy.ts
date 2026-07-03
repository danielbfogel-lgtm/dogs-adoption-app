import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the `middleware` file convention to `proxy`
// (https://nextjs.org/docs/messages/middleware-to-proxy). This file runs on
// every matched request to refresh the Supabase session and enforce route
// protection — see lib/supabase/middleware.ts for the actual logic.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, common static asset extensions
     * - /api (Python serverless functions handle their own auth)
     */
    // "api(?:/|$)" (not bare "api") so a future route like /apiary or
    // /api-status doesn't accidentally skip session refresh/route protection.
    "/((?!_next/static|_next/image|favicon.ico|api(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
