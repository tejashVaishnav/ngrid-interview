"use client"
import { Button } from "@/components/ui/button"
import { PlusIcon, Sparkles, FileText, Search, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createProject } from "@/requests/projects"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { UserType } from "@/requests/user"
const files = [
  { name: 'Untitled File', location: '', created: '19 min ago', edited: '19 min ago', comments: 0 },
  { name: 'Untitled File', location: '', created: '2 hrs ago', edited: '2 hrs ago', comments: 0 },
  { name: 'Untitled File', location: '', created: '3 hrs ago', edited: '3 hrs ago', comments: 0 },
];
export default function Dashboard({ user }: { user: UserType }) {
  const tabs = ["All", "Recents", "Created by Me", "Folders", "Unsorted"]
  const session = useSession()
  const actionCards = [
    {
      icon: PlusIcon,
      title: "Create a Blank File",
      description: "Start from scratch",
    },
    {
      icon: Sparkles,
      title: "Generate an AI Diagram",
      description: "Use AI to create diagrams",
    },
    {
      icon: FileText,
      title: "Generate an AI outline",
      description: "Let AI generate content",
    },
  ]
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const handleNeeProject = async () => {
    setLoading(true)
    try {
      const res = await createProject("untitled", "untitled", user?.id as string, user?.usersToTeams?.[0].team?.id as string)
      if (res) {
        console.log(res, "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=")
        router.push(`/project/${res[0].id}`)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          {/* Tabs */}
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`text-sm transition-colors ${tab === "All" ? "text-gray-900 font-medium" : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="rounded-md border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none"
              />
              <span className="ml-3 text-xs text-gray-400">Ctrl K</span>
            </div>

            {/* Avatars */}
            <div className="flex -space-x-2 ml-4">
              <Avatar className="h-8 w-8 border border-white">
                <AvatarFallback className="bg-blue-600 text-white text-xs">U</AvatarFallback>
              </Avatar>
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

      {/* Main content */}
      <main className="px-8 py-8">
        {/* Action cards grid */}
        <div className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-12">

          <div
            onClick={handleNeeProject}
            className="p-8 text-center cursor-pointer border border-gray-200 rounded-sm bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-center mb-4">
              {loading ? <Loader2 className="h-8 w-8 animate-spin text-gray-400" /> : <PlusIcon className="h-8 w-8 text-gray-400" />}
            </div>
            <h3 className="font-medium text-gray-700">Create a Blank File</h3>
          </div>

          <div
            className="p-8 text-center cursor-pointer border border-gray-200 rounded-sm bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700">Generate an AI outline</h3>
          </div>
          <div className=""></div>
        </div>

        {/* Table section */}
        <div className="w-full bg-white">
          {/* Table */}
          <div className="w-full">
            {/* Header */}
            <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-6 py-3 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div>Name</div>
              <div>Location</div>
              <div>Created</div>
              <div className="flex items-center gap-1">
                <span>Edited</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div>Comments</div>
              <div>Author</div>
            </div>

            {/* Rows */}
            {user?.usersToTeams[0].team?.projects?.map((file, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 items-center group"
              >
                <div className="text-sm text-gray-900">{file.name}</div>
                <div className="text-sm text-gray-500">{file.slug}</div>
                <div className="text-sm text-gray-500">{file.createdAt?.toString()}</div>
                <div className="text-sm text-gray-500">{file.updatedAt?.toString()}</div>
                <div className="text-sm text-gray-500"> </div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    ts
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
