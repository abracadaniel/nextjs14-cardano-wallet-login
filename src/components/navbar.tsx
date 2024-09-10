"use client"

import LoginButton from "./LoginButton";
import { useCardanoLoginContext } from "@/contexts/CardanoLoginContext";
import Link from "next/link";

export default function Navbar() {
    const { userInfo } = useCardanoLoginContext()

    return (<>
    <div>
        <Link href="/">Home | </Link>
        {userInfo?.isAuthenticated && <Link href="/app">Authenticated | </Link>}
        <LoginButton />
    </div>
    </>)
}