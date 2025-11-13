import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import { teams, usersToTeams } from "./db/schema";
import { eq } from "drizzle-orm";

export const { auth, handlers, signIn, signOut } = NextAuth({
    session: { strategy: "jwt" },
    adapter: DrizzleAdapter(db),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            // user is only available during sign-in
            if (user) {
                token.id = user.id;
                token.isNewUser = trigger === "signIn";
            }
            return token;
        },
        async session({ session, token }) {
            // Add user id to session from token
            if (token.id) {
                session.user.id = token.id as string;
            }

            // Create team for new users (only runs once after first sign-in)
            if (token.id) {
                console.log("token.id", token.id)
                try {
                    const existingTeam = await db
                        .select()
                        .from(usersToTeams)
                        .where(eq(usersToTeams.userId, token.id as string))
                        .limit(1);
                    console.log("existingTeam", existingTeam)

                    if (existingTeam.length === 0) {
                        const userName = session.user.name || session.user.email?.split('@')[0] || 'User';
                        const slug = `${userName.toLowerCase().replace(/\s+/g, '-')}-${(token.id as string).slice(0, 8)}`;

                        const res = await db.insert(teams).values({
                            name: `${userName}'s Team`,
                            slug: slug,
                            createdby: token.id as string,
                        }).returning();

                        const teamId = res[0].id;
                        const addRelation = await db.insert(usersToTeams).values({
                            userId: token.id as string,
                            teamId: teamId,
                        });
                        console.log("Team created successfully for user:", token.id);
                    }
                } catch (error) {
                    console.error("Error creating team:", error);
                }

                // Remove the flag so it doesn't run again
                token.isNewUser = false;
            }

            return session;
        },
    },
});