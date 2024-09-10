
import { NextResponse } from 'next/server';
import { logout } from '@/lib/CardanoLogin';
import { cookies } from 'next/headers'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: Request) {

    // Check auth cookie
    const cookieStore = cookies()
    const authCookie = cookieStore.get('auth')?.value || ""
    if (!authCookie) return NextResponse.json({ error: "Missing auth cookie", isAuthenticated: false });

    // Logout in database
    logout(authCookie)

    // Clear auth cookie
    cookieStore.set({
        name: 'auth',
        value: '',
        maxAge: 0,
        path: '/',
    })

    return NextResponse.json({ isAuthenticated: false });
}