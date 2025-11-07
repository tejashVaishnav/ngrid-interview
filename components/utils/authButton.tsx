import { checkAuth } from "@/lib/auth-utils";
import { AuthRoutes } from "./AuthRoutes";
import UserAvatar from "./userAvatar";
import { auth } from "@/auth";
import { Button } from "../ui/button";
import Link from "next/link";

export const AuthButton = async () => {
    const session = await auth();
    return (
        <div>
            {session !== null ? <UserAvatar session={session} /> :
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/sign-in">
                            Login
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/sign-up">
                            Sign Up
                        </Link>
                    </Button>
                </div>}
        </div>
    )
}