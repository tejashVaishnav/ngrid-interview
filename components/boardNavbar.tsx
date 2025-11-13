import { Search } from "lucide-react"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"

export const BoardNavbar = ({ activeUsers, isConnected }: { activeUsers: number, isConnected: boolean }) => {
    return (
        <header className="border-b border-gray-200 px-8 py-1">
            <div className="flex items-center justify-between gap-8">
                {/* Tabs */}
                <div className="">
                    <div className="relative flex items-center">

                        <input
                            type="text"
                            placeholder="Search"
                            className="rounded-md   border-gray-300 bg-white pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none"
                        />
                    </div>
                </div>
                {/* Right side actions */}
                <div className="flex items-center gap-4">
                    {/* Search */}

                    <div className={`w-2 h-2  rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>

                    {/* Avatars */}
                    <div className="flex -space-x-2 ml-4">
                        {Array.from({ length: activeUsers }).map((user) => (
                            <Avatar className="h-8 w-8 border border-white">
                                <AvatarFallback className="bg-blue-600 text-white text-xs">U</AvatarFallback>
                            </Avatar>
                        ))}
                        <Avatar className="h-8 w-8 border border-white">
                            <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">A</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border border-white">
                            <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">B</AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Invite button */}
                    <Button className="ml-4 gap-2 bg-blue-600 hover:bg-blue-700 text-white">✈️ Invite</Button>
                </div>
            </div>
        </header>
    )
}