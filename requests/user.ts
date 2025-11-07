"use server"
import { db } from "@/db"
import { users, teams } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export const getUser = async ({ email }: { email: string }) => {
    try {
        const res = await db.query.users.findFirst(
            {
                where: eq(users.email, email),
                with:
                {
                    teams: {
                        with: {
                            team: true, 
                        }
                    },
                    projects: true
                }
            })
        console.log(res, "fetched from server")
        return res
    } catch (error) {
        console.log(error)
    }
}

export type UserType = Awaited<ReturnType<typeof getUser>>