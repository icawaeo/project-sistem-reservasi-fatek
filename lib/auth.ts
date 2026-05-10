import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { logServerError, logServerWarn } from "@/lib/server-logger";

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
          userType: user.userType,
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
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.role = token.role;
        if (token.identifier) {
          session.user.identifier = token.identifier;
        }


        try {
          if (typeof token.id === "string" && token.id) {
            const dbUser = await prisma.user.findUnique({
              where: { user_id: token.id },
              select: { name: true, email: true },
            });
            if (dbUser) {
              session.user.name = dbUser.name;
              session.user.email = dbUser.email;
            }
          }
        } catch (error) {
          logServerError("[nextauth] Failed to refresh session user fields", error, {
            tokenUserId: typeof token.id === "string" ? token.id : null,
          });
        }
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