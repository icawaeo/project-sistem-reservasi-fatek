import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import Sidebar from "@/app/components/administrator/ui/Sidebar";
import Navbar from "@/app/components/administrator/ui/Navbar";
import UserManagementContent from "@/app/components/administrator/kelola-user/UserManagementContent";
import type { UserItem } from "@/app/components/administrator/kelola-user/user-types";

const RESEND_COOLDOWN_SECONDS = 60;

const getResendCooldownSeconds = (tokens: Array<{ createdAt: Date; usedAt: Date | null }>) => {
  const latestToken = tokens
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  if (!latestToken) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - latestToken.createdAt.getTime()) / 1000);
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
};

export default async function SuperadminKelolaUserPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if (!isSuperadminUser(session.user)) {
    redirect("/administrator/admin");
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      user_id: true,
      name: true,
      email: true,
      userType: true,
      role: true,
      createdAt: true,
      passwordSetupTokens: {
        select: {
          createdAt: true,
          usedAt: true,
        },
      },
    },
  });

  const initialUsers: UserItem[] = users.map((user: { user_id: any; name: any; email: any; userType: string; role: any; createdAt: { toISOString: () => any; }; passwordSetupTokens: any[]; }) => ({
    id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    isVerified: user.passwordSetupTokens.every((token: { usedAt: null; }) => token.usedAt !== null),
    resendCooldownSeconds: getResendCooldownSeconds(user.passwordSetupTokens),
  }));

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <Sidebar role="superadmin" />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            pageTitle="Kelola User"
            pageSubtitle="Manajemen akun user dan role akses sistem"
          />

          <UserManagementContent initialUsers={initialUsers} />
        </div>
      </div>
    </div>
  );
}
