import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'admin'
    const isOnAdminPanel = req.nextUrl.pathname.startsWith('/admin')

    // If trying to access admin panel but not admin, redirect to home
    if (isOnAdminPanel && !isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without auth
        if (req.nextUrl.pathname.startsWith('/login')) {
          return true
        }

        // Require auth for /admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token
        }

        // Allow all other routes
        return true
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal/:path*',
  ],
}
