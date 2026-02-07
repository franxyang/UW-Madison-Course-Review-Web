import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight middleware — no Prisma/heavy imports to stay under Edge 1MB limit.
// Auth checks are handled by tRPC's protectedProcedure (server-side).
// This middleware handles only non-auth concerns (headers, redirects, etc.)

export default function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  // Only match routes that need middleware processing
  // Auth is enforced at the tRPC layer (protectedProcedure)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}