"use client";

import { useSession } from "next-auth/react";

import NavbarView from "./NavbarView.client";
import type { NavbarUser } from "./types";

export default function NavbarClient() {
  const { data: session } = useSession();

  const user: NavbarUser = session?.user
    ? {
        name: session.user.name ?? null,
        userType: session.user.userType ?? null,
        role: session.user.role ?? null,
      }
    : null;

  return <NavbarView user={user} />;
}
