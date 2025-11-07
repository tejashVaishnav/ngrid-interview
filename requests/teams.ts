import { db } from "@/db"
import { teams, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Session } from "next-auth"

 
export const getUserTeam = async (session: Session) => {
    try {
        if(session.user){
        const res = await db.select().from(teams).where(eq(teams.createdby, session.user.email as string))
        return res
        }
        return null
    } catch (error) {
        console.log(error)
    }
}
export const createTeam = async (name: string, slug: string, createdby: string) => {

    try {
        const res = await db.insert(teams).values({
            name: name,
            slug: slug,
            createdby: createdby,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        return res
    } catch (error) {
        console.log(error)
    }
}
