import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers' 

// 1. Specify protected and public routes
const publicRoutes = ['/login', '/']
 
export default async function middleware(req: NextRequest) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value || ""

  const isAuth = await authenticateLogin(authCookie)
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)
  const isLoginRoute = ['/login'].includes(path)
 
  // Clear cookie if its not valid
  if (!isAuth && !!authCookie) {
    const res = NextResponse.redirect(req.nextUrl)
    res.cookies.set('auth', '', { maxAge: 0 });
    return res
  }

  // User is not allowed
  if (!isPublicRoute && !isAuth)
    return NextResponse.redirect(new URL('/', req.nextUrl))
  
  // Dont allow /login when already authenticated
  if (isLoginRoute && isAuth)
    return NextResponse.redirect(new URL('/', req.nextUrl))
 
  return NextResponse.next()
}
 
// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}

async function authenticateLogin(authCookie:string) {
  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE+'/api/account/login/auth',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
        body: JSON.stringify({
        authCookie: authCookie
      })
    }
  )
  const json = await res.json()
  return json.isAuth
}