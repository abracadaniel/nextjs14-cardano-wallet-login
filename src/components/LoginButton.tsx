"use client"

import { useRouter } from 'next/navigation'
import { useCardanoLoginContext } from "@/contexts/CardanoLoginContext";

export default function LoginButton() {
    const {
        userInfo,
        setUserInfo
    } = useCardanoLoginContext()

    const router = useRouter()
    const login = () => router.push('/login')
    const logout = async () => {
        const newUserInfo = await logoutRequest()
        setUserInfo(newUserInfo)
        router.push('/')
    }

    if (userInfo?.isAuthenticated) {
        return (<button type="button" onClick={logout}>Logout ({userInfo?.stakeAddress})</button>)
    } else {
        return (<button type="button" onClick={login}>Login</button>)
    }
} 

async function logoutRequest() {
    // POST request to /api/account/logout
    const res = await fetch('/api/account/logout', {method: 'POST'})
    const json = await res.json()
    return json
}