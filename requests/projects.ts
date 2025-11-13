"use server"
import { db } from "@/db"
import { projects } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Session } from "next-auth"
import { revalidatePath } from "next/cache"

export const createProject = async (name: string, slug: string, createdby: string, teamid: string) => {
    try {
        const res = await db.insert(projects).values({
            name: name,
            slug: slug,
            createdby: createdby,
            teamid: teamid,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning()

        console.log(res, "inserted from server" )
        revalidatePath("/")
        return res
    } catch (error) {
        console.log(error)
    }
}

export const getProjects = async ({teamid}: {teamid: string}) => {
    try {
        const res = await db.select().from(projects).where(eq(projects.teamid, teamid))
        console.log(res, "fetched from server")
        return res
    } catch (error) {
        console.log(error)
    }
}

export const deleteProject = async ({id,session}: {id:string,session:Session}) => {
    if(!session){
        return "unauthorized"
    }

    const user = session.user
    //check if user is the creator of the project
    const project = await db.select().from(projects).where(eq(projects.id, id))
    if(project[0].createdby !== user?.id){
        return "unauthorized"
    }
    try {
        const res = await db.delete(projects).where(eq(projects.id, id))
        console.log(res, "deleted from server")
        revalidatePath("/")
        return res
    } catch (error) {
        console.log(error)
    }
}