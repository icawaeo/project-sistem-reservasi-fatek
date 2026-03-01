import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    userType: string;
    identifier: string;
  }

  interface Session {
    user: {
      id: string;
      userType: string;
      identifier: string;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: string;
    identifier: string | null;
  }
}