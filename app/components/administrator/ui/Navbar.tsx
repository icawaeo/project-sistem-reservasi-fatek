import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import NavbarView from "./navbar/NavbarView.client";
import type { AdminNavbarProps } from "./navbar/types";

export default async function Navbar({ pageTitle, pageSubtitle, role, userName }: AdminNavbarProps) {
  const session = await getServerSession(authOptions);
  const resolvedUserName = userName ?? session?.user?.name ?? "Admin";

  return <NavbarView pageTitle={pageTitle} pageSubtitle={pageSubtitle} role={role} userName={resolvedUserName} />;
}
