"use server"
import { db } from "@/db"
import { users, teams } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export const getUser = async ({ email }: { email: string }) => {
    try {
        const res = await db.query.users.findFirst({
            where: eq(users.email, email),
            with: {
              usersToTeams: {
                with: {
                  team: {
                    with: {
                      projects: true,
                       // Fetch projects through teams
                    }
                  }
                }
              }
            }
          })
        return res
    } catch (error) {
        console.log(error)
    }
}

export type UserType = Awaited<ReturnType<typeof getUser>>