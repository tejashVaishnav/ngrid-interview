// In any protected page (e.g., dashboard/page.tsx)
'use client';

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Login1Props {
    heading?: string;
    logo: {
        url: string;
        src: string;
        alt: string;
        title?: string;
    };
    buttonText?: string;
    googleText?: string;
    signupText?: string;
    signupUrl?: string;
}

const Login1 = ({
    heading = "Sign In",
    logo = {
        url: "https://www.shadcnblocks.com",
        src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-wordmark.svg",
        alt: "logo",
        title: "WhiteBoard.me",
    },
    buttonText = "Sign in",
    signupText = "Need an account?",
    signupUrl = "https://shadcnblocks.com",
}: Login1Props) => {


    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = () => {
        setIsLoading(true);
        try {
            signIn("google", { callbackUrl: "/" });
        } catch (error) {
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <section className="bg-muted h-screen">
            <div className="flex h-full items-center justify-center">
                {/* Logo */}
                <div className="flex flex-col items-center gap-6 lg:justify-start">
                    <a href={logo.url}>
                        <img
                            src={logo.src}
                            alt={logo.alt}
                            title={logo.title}
                            className="h-10 dark:invert"
                        />
                    </a>
                    <div className="min-w-sm border-muted bg-background flex w-full max-w-sm flex-col items-center gap-y-4 rounded-md border px-6 py-8 shadow-md">
                        {heading && <h1 className="text-xl font-semibold">{heading}</h1>}
                        <Input
                            type="email"
                            placeholder="Email"
                            className="text-sm"
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            className="text-sm"
                            required
                        />
                        <Button type="submit" className="w-full">
                            {buttonText}
                        </Button>
                        <Separator />
                        <Button onClick={() => {
                            "server only"
                            setIsLoading(true);
                            signIn("google", { callbackUrl: "/dashboard" })
                        }} variant="outline" className="w-full">
                            {isLoading ? <Loader2 className="animate-spin" /> : "Sign In with Google"}
                        </Button>
                    </div>
                    <div className="text-muted-foreground flex justify-center gap-1 text-sm">
                        <p>{signupText}</p>
                        <a
                            href={signupUrl}
                            className="text-primary font-medium hover:underline"
                        >
                            Sign Up
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login1;
