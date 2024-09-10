import { authenticateLogin } from '@/lib/CardanoLogin'
import { NextResponse } from 'next/server';

// Define the GET handler
export async function POST(req: Request) {
    const authCookie = (await req.json()).authCookie
    if (!authCookie) return NextResponse.json({ error: 'Missing authCookie' })

    try {
        const authWallet = await authenticateLogin(authCookie)
        const isAuth = authWallet ? true : false    

        return NextResponse.json({ isAuth: isAuth, authWallet: authWallet });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid login' })
    }
}