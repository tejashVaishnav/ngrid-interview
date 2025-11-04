import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import  google  from "next-auth/providers/google";
import { accounts, db, sessions, users, verificationTokens } from "./db/schema";

export const { handlers, auth } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    providers: [
        google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        })
    ]
})