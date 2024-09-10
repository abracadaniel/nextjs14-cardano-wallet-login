
import { NextResponse } from 'next/server';
import { login, generateAuthCookie, getUserInfo } from '@/lib/CardanoLogin';
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const json = await req.json()
    const wallet = json?.wallet
    const keyToSign = json?.keyToSign
    const key = json?.key
    const signature = json?.signature
    
    if (!wallet) return NextResponse.json({ error: 'Missing wallet' })
    if (!keyToSign) return NextResponse.json({ error: 'Missing keyToSign' })
    if (!key) return NextResponse.json({ error: 'Missing key' })
    if (!signature) return NextResponse.json({ error: 'Missing signature' })
    
    const success = await login(wallet, keyToSign, key, signature)
    if (!success) NextResponse.json({ error: "Could not verify key" });

    // Update cookie
    const authCookie = await generateAuthCookie(wallet, keyToSign, key, signature)
    const cookieStore = cookies()
    cookieStore.set(authCookie)

    const userInfo = await getUserInfo(authCookie.value)

    return NextResponse.json({ ...userInfo });
}