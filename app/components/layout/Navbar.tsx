import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import NavbarView from "./navbar/NavbarView.client";
import type { NavbarUser } from "./navbar/types";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  const user: NavbarUser = session?.user
    ? {
        name: session.user.name ?? null,
        userType: session.user.userType ?? null,
        role: session.user.role ?? null,
      }
    : null;

  return <NavbarView user={user} />;
}
