import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Email from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email provider (disabled in dev until EMAIL_SERVER is configured)
    // Email({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM || 'noreply@wiscflow.com',
    // }),
    
    // Google OAuth (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
                hd: 'wisc.edu' // Restrict to @wisc.edu domain
              }
            }
          })
        ]
      : [])
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Strictly enforce @wisc.edu emails only
      if (user.email && !user.email.endsWith('@wisc.edu')) {
        return false
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database'
  }
}