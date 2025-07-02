import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import type { Session } from "next-auth";
import bcrypt from "bcrypt";
import { SignupValidation } from "@repo/zod/index"; // or wherever your schema is
import db from "@repo/db/db";

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

export const authOption: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text", placeholder: "Ronak Maheshwari" },
        email: { label: "Email", type: "text", placeholder: "ronak@gmail.com" },
        phone: { label: "Phone", type: "text", placeholder: "9545293123" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<any> {
        console.log("authorize hit:", credentials);

        if (!credentials) return null;

        // Parse and validate with Zod
        const parsed = SignupValidation.safeParse(credentials);
        if (!parsed.success) {
          console.error("Zod validation failed:", parsed.error.flatten());
          return null;
        }

        const { name, email, phone, password } = parsed.data;

        try {
          const existingUser = await db.user.findFirst({
            where: {
              OR: [{ email }, { number: phone }],
            },
          });

          if (existingUser) {
            console.log("User found:", existingUser.email);

            if (typeof existingUser.password !== "string") {
              console.error("User password is not a string");
              return null;
            }
            const isPasswordValid = await bcrypt.compare(password, existingUser.password);
            console.log("Password valid?", isPasswordValid);

            if (!isPasswordValid) return null;

            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
            };
          }

          const hashedPassword = await bcrypt.hash(password, Number(process.env.SALTRound || 10));
          const newUser = await db.user.create({
            data: {
              name,
              email,
              number: phone,
              password: hashedPassword,
            },
          });

          console.log("User registered:", newUser.email);

          return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
          };
        } catch (err) {
          console.error("DB error:", err);
          return null;
        }
      },
    }),
  ],
  secret: process.env.JWT_SECRET || "secret",
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    error: "/auth/error",
    signIn: "/auth/signin", // Only if you have a custom sign-in page
  },
};
