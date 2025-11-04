import Link from "next/link"

export const AuthButton = () =>{
    return(
     <div className="">
        <Link href={'/signIn'}>signIn</Link>
     </div>   
    )
}