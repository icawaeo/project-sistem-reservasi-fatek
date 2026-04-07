import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getPostLoginRedirectPath } from "@/lib/admin-access";

export async function GET() {
  const session = await getServerSession(authOptions);

  return NextResponse.json({
    redirectTo: getPostLoginRedirectPath(session?.user),
  });
}
