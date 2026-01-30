import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    // Email Magic Link (for wisc.edu emails)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    // Restrict to @wisc.edu emails
    async signIn({ user }) {
      if (!user.email?.endsWith("@wisc.edu")) {
        return false; // Block non-wisc.edu emails
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
});

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
