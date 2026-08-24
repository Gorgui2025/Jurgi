import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      roles: string[];
      region: string | null;
      accountStatus: string;
      avatar: string | null;
    };
  }
  interface User {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    roles: string[];
    region: string | null;
    accountStatus: string;
    avatar: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    roles: string[];
    region: string | null;
    accountStatus: string;
    avatar: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/connexion" },
  secret: process.env.NEXTAUTH_SECRET || "jurgi-dev-secret-key-change-in-production",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Téléphone", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // Email + password login
        if (credentials.email && credentials.password) {
          // Check User table first
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (user && user.passwordHash) {
            const valid = await bcrypt.compare(credentials.password, user.passwordHash);
            if (valid) {
              if (user.accountStatus === "pending_validation") {
                throw new Error("pending_validation");
              }
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                roles: JSON.parse(user.roles),
                region: user.region,
                accountStatus: user.accountStatus,
                avatar: user.avatar,
              };
            }
          }

          // Check Admin table
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
          });
          if (admin && admin.isActive) {
            const valid = await bcrypt.compare(credentials.password, admin.passwordHash);
            if (valid) {
              await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
              return {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: null,
                roles: ["admin", admin.role],
                region: null,
                accountStatus: "active",
                avatar: null,
              };
            }
          }

          return null;
        }

        // Phone + password login
        if (credentials.phone && credentials.password) {
          const user = await prisma.user.findUnique({
            where: { phone: credentials.phone },
          });
          if (!user || !user.passwordHash) return null;

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;

          if (user.accountStatus === "pending_validation") {
            throw new Error("pending_validation");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            roles: JSON.parse(user.roles),
            region: user.region,
            accountStatus: user.accountStatus,
            avatar: user.avatar,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phone = user.phone;
        token.roles = user.roles;
        token.region = user.region;
        token.accountStatus = user.accountStatus;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        phone: token.phone,
        roles: token.roles,
        region: token.region,
        accountStatus: token.accountStatus,
        avatar: null,
      };
      return session;
    },
  },
};
