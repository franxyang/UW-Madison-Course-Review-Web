import { NextResponse } from 'next/server'

// P0 Security Fix: Disable debug endpoint in production
// This endpoint should ONLY be used during development
export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available' },
      { status: 404 }
    )
  }

  // In development, return minimal health check (no sensitive data)
  return NextResponse.json({
    status: 'ok',
    environment: 'development',
    timestamp: new Date().toISOString(),
  })
}
