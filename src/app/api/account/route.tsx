
import { NextResponse } from 'next/server';
import { getUserInfo } from '@/lib/CardanoLogin';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: Request) {
    const userInfo = await getUserInfo()

    return NextResponse.json(userInfo);
}