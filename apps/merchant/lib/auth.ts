import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import db from "@repo/db/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const AuthOption: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.JWT_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === "google" && user?.email) {
        try {
          const existingUser = await db.merchant.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            const newUser = await db.merchant.create({
              data: {
                email: user.email,
                name: user.name ?? null,
                auth_type: "Google",
                password: "", 
              },
            });
            console.log("New merchant created:", newUser);
            token.sub = String(newUser.id);
          } else {
            token.sub = String(existingUser.id);
          }
        } catch (err) {
          console.error("DB error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
