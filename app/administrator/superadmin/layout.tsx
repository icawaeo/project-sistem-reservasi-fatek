import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ADMIN_DASHBOARD_PATH, isSuperadminUser } from "@/lib/admin-access";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (!isSuperadminUser(session.user)) {
    redirect(ADMIN_DASHBOARD_PATH);
  }

  return children;
}