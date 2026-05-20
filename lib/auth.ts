import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { logServerError, logServerWarn } from "@/lib/server-logger";

const normalizeSessionUserType = (userType: string | null | undefined, role: string | null | undefined) =>
  role === "USER" ? "USER" : userType ?? "";

export const authOptions: NextAuthOptions = {
  logger: {
    error(code, ...message) {
      logServerError("[nextauth] error", { code, message }, { code });
    },
    warn(code, ...message) {
      logServerWarn("[nextauth] warn", { code, message });
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === "development") {
        console.log({ timestamp: new Date().toISOString(), level: "debug", message: "[nextauth] debug", meta: { code, message } });
      }
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password harus diisi");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          console.log("LOGIN_DEBUG: User tidak ditemukan untuk email:", credentials.email);
          throw new Error("Email atau password salah");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        console.log("LOGIN_DEBUG: Apakah password valid?", isPasswordValid);

        if (!isPasswordValid) {
          throw new Error("Email atau password salah");
        }

        return {
          id: user.user_id,
          email: user.email,
          name: user.name,
          userType: normalizeSessionUserType(user.userType, user.role),
          role: user.role,
          identifier: user.identifier || "",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.role = user.role;
        token.identifier = user.identifier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        try {
          const tokenUserId = typeof token.id === "string" && token.id ? token.id : null;
          const tokenEmail = typeof token.email === "string" && token.email ? token.email : null;

          if (tokenUserId || tokenEmail) {
            const dbUser = await prisma.user.findUnique({
              where: tokenUserId ? { user_id: tokenUserId } : { email: tokenEmail as string },
              select: { user_id: true, name: true, email: true, userType: true, role: true, identifier: true },
            });
            if (dbUser) {
              token.id = dbUser.user_id;
              token.userType = normalizeSessionUserType(dbUser.userType, dbUser.role);
              token.role = dbUser.role;
              token.identifier = dbUser.identifier;

              session.user.id = dbUser.user_id;
              session.user.name = dbUser.name;
              session.user.email = dbUser.email;
              session.user.userType = normalizeSessionUserType(dbUser.userType, dbUser.role);
              session.user.role = dbUser.role;
              session.user.identifier = dbUser.identifier ?? "";
            }
          }
        } catch (error) {
          logServerError("[nextauth] Failed to refresh session user fields", error, {
            tokenUserId: typeof token.id === "string" ? token.id : null,
          });
        }

        session.user.id = typeof token.id === "string" ? token.id : session.user.id;
        session.user.userType = typeof token.userType === "string" ? token.userType : session.user.userType;
        session.user.role = typeof token.role === "string" ? token.role : session.user.role;
        session.user.identifier = typeof token.identifier === "string" ? token.identifier : session.user.identifier;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 jam auto-logout
  },
  secret: process.env.NEXTAUTH_SECRET,
};
