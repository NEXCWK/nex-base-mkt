import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email?.endsWith("@nexcoworking.com.br") ?? false;
      }
      return false;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET ?? "nextauth-fallback-secret-change-in-production",
};
