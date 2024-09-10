"use client"

import dynamic from 'next/dynamic'

export default function Home() {
  return (<CardanoWalletLoginButton />)
}

const CardanoWalletLoginButton = dynamic(() => import('@/components/CardanoWalletLoginButton'), {
  ssr: false
})