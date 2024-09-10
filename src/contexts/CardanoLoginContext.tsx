"use client"

import { createContext, useContext, useState } from 'react'

interface userinfo {
    stakeAddress?: string;
    isAuthenticated?: boolean;
}
interface context {
    userInfo?: userinfo
    setUserInfo: React.Dispatch<React.SetStateAction<userinfo>>;
}

const Context = createContext<context>({
    userInfo: undefined,
    setUserInfo: () => {},
  })


export function CardanoLoginContext({ children, options }: {
    children: React.ReactNode,
    options: userinfo
}) {
    const [userInfo, setUserInfo] = useState(options)
    
    return (
        <Context.Provider value={{
            userInfo,
            setUserInfo
            }}>
            {children}
        </Context.Provider>
    )
}

export function useCardanoLoginContext() {
    return useContext(Context)
}

export function updateCardanoLoginContext() {

}