"use client"

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from "react"
import { ConnectWalletButton, useCardano } from '@cardano-foundation/cardano-connect-with-wallet';
import { useCardanoLoginContext } from "@/contexts/CardanoLoginContext";

export default function CardanoWalletLoginButton() {
    const { 
        isEnabled,
        isConnected,
        //enabledWallet,
        stakeAddress,
        signMessage,
        //connect,
        //disconnect 
    } = useCardano();
    const { setUserInfo } = useCardanoLoginContext()

    const router = useRouter()
    const [message, setMessage] = useState<string>()
    const [key, setKey] = useState<string>()
    const [signature, setSignature] = useState<string>()
    const [isSigning, setIsSigning] = useState(false)
    const [hasSigned, setHasSigned] = useState(false)
    //const [loginResponse, setLoginResponse] = useState<any>(null)
    const canSign = useMemo(() => isEnabled && isConnected && !isSigning && !hasSigned, [isSigning, isEnabled, hasSigned, isConnected])


    const onConnect = useCallback(async () => {
        if (!canSign) return
        setIsSigning(true)

        const keyToSign = await initLoginRequest(stakeAddress)
        setMessage(keyToSign)

        // Sign key in connected wallet
        await signMessage(keyToSign, (signature, key) => {
            setSignature(signature)
            setKey(key)
        })

        setIsSigning(false)
        setHasSigned(true)
    }, [stakeAddress, canSign, signMessage])


    // When we have key, message, signature and stakeAddress we can submit to login backend for verification
    useEffect(() => {
        if (!key || !message || !signature || !stakeAddress || !hasSigned) return

        (async () => {
            const newUserInfo = await loginRequest(stakeAddress, message, key, signature)
            setUserInfo(newUserInfo)
            router.push('/')
            
            setMessage(undefined)
            setKey(undefined)
            setSignature(undefined)
        })()

    }, [!!key, !!message, !!signature, stakeAddress, hasSigned])


    if (canSign) onConnect()

    return (
    <>
        <ConnectWalletButton onConnect={onConnect} onDisconnect={logoutRequest}/>
    </>
    )
} 

async function initLoginRequest(wallet: string | null) {
    const res = await fetch('/api/account/login/request',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ wallet: wallet })
        }
    )
    const json = await res.json()
    
    return json.requiresSignature
}

async function loginRequest(wallet: string, keyToSign: string, key: string, signature: string) {
    const res = await fetch('/api/account/login',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet: wallet,
                keyToSign: keyToSign,
                key: key,
                signature: signature
            })
        }
    )
    const json = await res.json()
    
    return json
}

async function logoutRequest() {
    // POST request to /api/account/logout
    const res = await fetch('/api/account/logout', {method: 'POST'})
    const json = await res.json()
    return json
}