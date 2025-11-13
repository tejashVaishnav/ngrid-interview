import InfiniteCanvas from "@/components/board"
import { checkAuth } from "@/lib/auth-utils"
import { getUser } from "@/requests/user"
import { BoardNavbar } from "@/components/boardNavbar"
export default async function Project({ params }: { params: Promise<{ id: string }> }) {
    const id = await params
    const session = await checkAuth()
    const user = await getUser({ email: session.user?.email as string })
    console.log(user, "user from project page")
    return (
        <div> 
            <InfiniteCanvas projectId={id.id} user={user}/>
        </div>
    )
}