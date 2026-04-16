import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            // Upsert user into our database on every sign-in
            if (user.email) {
                try {
                    await prisma.user.upsert({
                        where: { email: user.email },
                        create: {
                            email: user.email,
                            name: user.name || undefined,
                            image: user.image || undefined,
                            // role will default to 'user' from schema
                        },
                        update: {
                            name: user.name || undefined,
                            image: user.image || undefined,
                        },
                    });
                } catch (err) {
                    console.warn("[AUTH] User upsert failed:", err);
                }
            }
            return true;
        },
        async jwt({ token, account, user }) {
            // Persist the access token + provider into the JWT on first sign-in
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider;
            }
            if (user?.email) {
                token.email = user.email;

                // Fetch fresh role from DB to embed strictly into the JWT for Edge Middleware
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    select: { role: true },
                });

                token.role = dbUser?.role || "USER"; // Fallback to safe user role
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            // Expose token + role + provider to the client session
            session.accessToken = token.accessToken;
            session.provider = token.provider;
            if (session.user && token.email) {
                session.user.role = token.role || "USER"; // Trust the securely signed JWT token role
                session.user.email = token.email;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
