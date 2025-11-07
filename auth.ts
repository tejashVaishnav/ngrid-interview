
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";


export const { auth, handlers, signIn, signOut } = NextAuth({
    session: { strategy: "jwt" },
    adapter:  DrizzleAdapter(db),
    providers: [GoogleProvider(
        {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }
    )],
}) 