import { auth } from "@/auth";
import { AuthButton } from "@/components/layout/AuthButton";
import { ProductCard } from "@/components/layout/ProductCard";
import { getProducts } from "@/requests/products";
import { useSession } from "next-auth/react";
import { createClient } from '@/utils/supabase/static-props'
import Link from "next/link";


export default async function Home() {
  const Products = await getProducts()

  const supabse = createClient()

  const { data, error } = await supabse.auth.getUser()
 console.log("user",data)
  console.log(Products)
  return (
    <div className="flex py-10 min-h-screen   justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col gap-6">
        <ProductList />
      </div>
    </div>
  );
}


const ProductList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 10 }).map((_, index) => (
        <Link key={index} href={`/product/${index}`}>
          <ProductCard />
        </Link>
      ))}
    </div>
  )
}