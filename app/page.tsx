import { Hero } from "@/components/layout/hero";
import MaxWidthWrapper from "@/components/utils/MaxWidthWrapper";
import { Navbar1 } from "@/components/ui/navbar";

export default async function Home() {

  return (
    <div className="flex flex-col min-h-screen items-center justify-center   dark:bg-black">
      <Navbar1 />
      <MaxWidthWrapper>
        <Hero />
      </MaxWidthWrapper>
    </div>
  );
}
