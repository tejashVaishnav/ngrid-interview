"use server"

import { db } from "@/db"
import { products } from "@/db/schema"


export const getProducts = async () => {
    try {
        const res = await db.query.products.findMany({
           
        })
        return res
    } catch (error) {
        console.log("Error fetching products", error)
    }
}

export const InsertProduct = async (product: {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    brand: string;
}) => {
    try {
        const res = await db.insert(products).values({
            name: "Product 1",
            description: "Description 1",
            price: 100,
            productOwner: "Product Owner 1",
        })
    } catch (error) {
        console.log("Error inserting product", error)
    }
}