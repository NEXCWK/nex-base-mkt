import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail } from "@/lib/auth/users";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email?.endsWith("@nexcoworking.com.br")) return false;
      const dbUser = findUserByEmail(user.email);
      if (!dbUser) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = findUserByEmail(user.email);
        token.id = dbUser?.id ?? user.id;
        token.role = dbUser?.role ?? "member";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
