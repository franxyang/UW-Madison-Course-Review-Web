import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      nickname?: string | null
      role?: 'STUDENT' | 'MODERATOR' | 'ADMIN'
      loginHandle?: string | null
      eligibilityStatus?: 'UNVERIFIED' | 'STUDENT_VERIFIED' | 'ALUMNI_VERIFIED'
      requiresRecoverySetup?: boolean
    }
  }
}
