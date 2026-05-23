import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateCredentials } from "@/lib/auth/users";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await validateCredentials(
          credentials.email,
          credentials.password
        );
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstAccess: user.firstAccess,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstAccess = (user as unknown as { firstAccess: boolean }).firstAccess;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { firstAccess: boolean }).firstAccess = token.firstAccess as boolean;
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
  // Railway injeta RAILWAY_STATIC_URL automaticamente; fallback para NEXTAUTH_URL
  ...(process.env.RAILWAY_STATIC_URL
    ? { url: `https://${process.env.RAILWAY_STATIC_URL}` }
    : {}),
});

export { handler as GET, handler as POST };
