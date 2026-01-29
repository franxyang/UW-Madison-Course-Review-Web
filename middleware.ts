import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  const session = await auth()

  // Protect review submission routes
  if (request.nextUrl.pathname.startsWith('/api/reviews')) {
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Double-check @wisc.edu email
    if (!session.user.email?.endsWith('@wisc.edu')) {
      return NextResponse.json({ error: 'Only @wisc.edu emails are allowed' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/reviews/:path*']
}