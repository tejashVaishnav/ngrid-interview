import { ProductCard } from "@/components/layout/ProductCard"
import { ProductDetailsComponet } from "@/components/layout/ProductDetails"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div>
            <ProductDetails />
        </div>
    )
}

const ProductDetails = () => {
    return (
        <div className="h-full w-full flex flex-col">
            <ProductDetailsComponet />

        </div>
    )
}