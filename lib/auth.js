import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { useDemoMode } from "@/lib/runtimeEnv";

function demoModeEnabled() {
  return useDemoMode();
}

function getDemoCredentials() {
  return {
    email: (process.env.UHC_DEMO_EMAIL || "doctor@shuno.online").trim().toLowerCase(),
    password: process.env.UHC_DEMO_PASSWORD || "1234",
    name: process.env.UHC_DEMO_NAME || "UHC Demo Physician",
    id: "demo-user",
  };
}

export const authOptions = {
  // Netlify / preview URLs: host must be trusted or sign-in and API auth break on deploy.
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "UHC Physician",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        if (demoModeEnabled()) {
          const demo = getDemoCredentials();
          if (email !== demo.email) return null;
          if (password !== demo.password) return null;
          return { id: demo.id, email: demo.email, name: demo.name };
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name || user.email };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
