import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getPostLoginRedirectPath } from "@/lib/admin-access";
import { logServerError } from "@/lib/server-logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      redirectTo: getPostLoginRedirectPath(session?.user),
    });
  } catch (error) {
    logServerError("[api/auth/post-login-redirect] Failed to resolve post login redirect", error, {
      method: "GET",
      path: "/api/auth/post-login-redirect",
    });
    return NextResponse.json({ redirectTo: "/" });
  }
}
