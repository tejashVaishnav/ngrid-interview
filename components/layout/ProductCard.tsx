import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import Image from "next/image"
export const ProductCard = () => {
    return (
        <Card className="w-[250px]">
            <CardHeader>
                 <Image src={'/product.jpg'} alt="" width={200} height={200}/>
            </CardHeader>
            <CardContent>
                <p>Product Name</p>
            </CardContent>
            <CardFooter>
                <p>Product Price</p>
            </CardFooter>
        </Card>
    )
}