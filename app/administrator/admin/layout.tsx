import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (session.user.userType !== "STAFF") {
    redirect("/landingpage");
  }

  if (isSuperadminUser(session.user)) {
    redirect("/administrator/superadmin/dashboard");
  }

  return children;
}
