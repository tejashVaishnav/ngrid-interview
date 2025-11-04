"use client"
import { Card, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Image from "next/image"

export const ProductDetailsComponet = () => {

    return (
        <div className="grid w-full border grid-cols-2">

            <div className="h-full w-full flex flex-col">
                <Carousel className="w-full max-w-lg">
                    <CarouselContent>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                    <Card>
                                        <CardContent className="flex aspect-square items-center justify-center p-6">
                                            <Image alt="" src={'/product.jpg'} height={400} width={400} />
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
            <div className="flex flex-col">
                <h1>Product Name </h1>
                <p>Product Description</p>
                <p>Price</p>
            </div>
        </div>

    )
}