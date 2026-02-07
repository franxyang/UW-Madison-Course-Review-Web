import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Ban } from 'lucide-react'
import { Logo } from '@/components/Logo'
import Link from 'next/link'

export default async function BannedPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Check for active ban
  const activeBan = await prisma.userBan.findFirst({
    where: {
      userId: session.user.id,
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      bannedBy: { select: { nickname: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!activeBan) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Ban size={32} className="text-red-600" />
        </div>
        
        <Link href="/" className="inline-block mb-4">
          <Logo size={32} />
        </Link>
        
        <h1 className="text-xl font-bold text-slate-900 mb-2">Account Suspended</h1>
        <p className="text-sm text-slate-600 mb-6">
          Your account has been suspended from MadSpace.
        </p>

        <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-medium text-red-800 mb-1">Reason:</p>
          <p className="text-sm text-red-700">{activeBan.reason}</p>
          
          {activeBan.expiresAt && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs text-red-600">
                Ban expires: {new Date(activeBan.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          )}

          {!activeBan.expiresAt && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs text-red-600">This is a permanent suspension.</p>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-6">
          If you believe this is a mistake, please contact the admin team.
        </p>

        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/' })
          }}
        >
          <button
            type="submit"
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
