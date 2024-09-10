
import { NextResponse } from 'next/server';
import { initLoginRequest, isAuthenticated } from '@/lib/CardanoLogin';

export async function POST(req: Request) {
  const wallet = (await req.json()).wallet
  if (!wallet) return NextResponse.json({ error: 'Missing wallet' })

  const isAuth = await isAuthenticated()
  if (isAuth) return NextResponse.json({ isAuthenticated: true })

  const keyToSign = await initLoginRequest(wallet)
  if (!keyToSign) return NextResponse.json({ error: 'Failed to generate key' })

  return NextResponse.json({ requiresSignature: keyToSign });
}