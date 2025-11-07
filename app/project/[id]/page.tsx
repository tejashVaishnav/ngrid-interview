import InfiniteCanvas from "@/components/board"

export default async function Project({ params }: { params: Promise<{ id: string }> }) {
    const id = await params
    return (
        <div> 
            <InfiniteCanvas />
        </div>
    )
}