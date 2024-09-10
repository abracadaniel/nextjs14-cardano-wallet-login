"use server"

import moment from 'moment';
import verifyDataSignature from '@cardano-foundation/cardano-verify-datasignature'
import prisma from '@/lib/prisma'
import NextCrypto from 'next-crypto';
import { cookies } from "next/headers";
import { v4 as uuidv4 } from 'uuid';



export async function login(wallet: string, keyToSign: string, key: string, signature: string) {
    const loginRequest: object | null = await prisma.loginRequests.findUnique({
        where: {
            walletAddress_key: {
                walletAddress: wallet,
                key: keyToSign
            },
            expires: { gt: moment().toDate() },
        },
        select: {
          walletAddress: true,
          key: true
        },
    })
    if (!loginRequest) throw new Error("No valid loginRequest")

    // Verify signature
    const validSignature = await verifySignature(wallet, keyToSign, key, signature)
    if (!validSignature) throw new Error("Signature is invalid")

    // Clean up loginRequests
    await prisma.loginRequests.deleteMany({
        where: {
            walletAddress: wallet
        }
    })

    // Create login
    await prisma.logins.upsert({
        where: {
            walletAddress: wallet
        },
        update: {
            loginKey: keyToSign,
            loginTimestamp: moment().toDate(),
            loginExpires: moment().add(24, 'hours').toDate()
        },
        create: {
            walletAddress: wallet,
            loginKey: keyToSign,
            loginTimestamp: moment().toDate(),
            loginExpires: moment().add(24, 'hours').toDate()
        }
    })

    // Set Cookie
    const cookie = await generateAuthCookie(wallet, keyToSign, key, signature)
 
    return cookie
}

export async function verifySignature(wallet: string, keyToSign: string, key: string, signature: string) {
    if (!wallet) throw new Error("Missing wallet");
    if (!keyToSign) throw new Error("Missing keyToSign");
    if (!key) throw new Error("Missing key");
    if (!signature) throw new Error("Missing signature");

    const validSignature = await verifyDataSignature(signature, key, keyToSign, wallet)

    return validSignature
}

export async function generateAuthCookie(wallet: string, keyToSign: string, key: string, signature: string) {
    const sessionData = JSON.stringify({
        wallet: wallet,
        keyToSign: keyToSign,
        key: key,
        signature: signature
    })

    const encryptedSessionData = await encrypt(sessionData)
   
    const cookie = {
        name: 'auth',
        value: encryptedSessionData,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
    }

    return cookie
}

export async function authenticateLogin(cookie: string) {
    // Called from middleware

    try {
        const jsonCookie = await decryptCookie(cookie)

        // get login from database
        const login = await prisma.logins.findUnique({
            where: {
                walletAddress: jsonCookie.wallet,
                loginKey: jsonCookie.keyToSign,
                loginExpires: {gt: moment().toDate() },
                loginTimestamp: {gt: moment().subtract(8, 'hours').toDate() }, // Login becomes invalid after 8 hours of inactivity
            },
            select: {
                walletAddress: true,
                loginKey: true
            },
        })
        if (!login) throw new Error("Invalid login")

        const validSignature = await verifySignature(
            login.walletAddress,
            login.loginKey,
            jsonCookie.key,
            jsonCookie.signature
        )
        if (!validSignature) throw new Error("Invalid singature")

        // Update loginTimestamp
        await prisma.logins.update({
            where: {
                walletAddress: jsonCookie.wallet,
                loginKey: jsonCookie.keyToSign,
            },
            data: {
                loginTimestamp: moment().toDate()
            }
        })

        return login.walletAddress;
    } catch (e) {
        console.log(e)

        return false
    }
}

export async function isAuthenticated() {
    const cookieStore = cookies()
    const authCookie = cookieStore.get('auth')?.value || undefined

    if (!authCookie) return false
    return true
}

export async function logout(cookie:string) {
    // authenticateLogin
    const wallet = await authenticateLogin(cookie)
    if (!wallet) return false

    // Delete login
    await prisma.logins.deleteMany({
        where: {
            walletAddress: wallet
        }
    })

    return true
}

export async function initLoginRequest(wallet: string) {
    const keyToSign = uuidv4()
    // Save to database with wallet
    await prisma.loginRequests.create({
        data: {
            walletAddress: wallet,
            key: keyToSign,
            requestStamp: moment().toDate(),
            expires: moment().add(15, 'minutes').toDate()
        }
    })

    return keyToSign
}

export async function decryptCookie(cookie:string) {
    if (!cookie) throw new Error("Missing cookie")

    // If it exists: check if it is valid
    const decryptedCookie = await decrypt(cookie)
    if (!decryptedCookie) throw new Error("Unable to decrypt cookie")

    const jsonCookie = JSON.parse(decryptedCookie)
    if (!jsonCookie) throw new Error("Unable to JSON parse cookie")        

    if (!jsonCookie.wallet
        || !jsonCookie.keyToSign
        || !jsonCookie.key
        || !jsonCookie.signature) throw new Error("Invalid cookie")

    return jsonCookie
}

export async function getUserInfo(authCookie?:string | undefined) {
    try {
        if (!authCookie) {
            const cookieStore = cookies()
            authCookie = cookieStore.get('auth')?.value || ""
        }
        const jsonCookie = await decryptCookie(authCookie)

        // Get paymentAddr + adahandles?

        return {
            isAuthenticated: true,
            stakeAddress: jsonCookie.wallet
        }
    } catch (e) {
        return { isAuthenticated: false }
    }
}

async function encrypt(text: string) {
    const sk = process.env.AUTH_SECRET || ""
    const crypto = new NextCrypto(sk);
    const encrypted = await crypto.encrypt(text);
    return encrypted
};

async function decrypt(encrypted: string) {
    const sk = process.env.AUTH_SECRET || ""
    const crypto = new NextCrypto(sk);
    const decrypted = await crypto.decrypt(encrypted);
    return decrypted
};