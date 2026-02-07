import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mt-6 mb-4">Privacy Policy</h1>
        <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-6 space-y-4 text-sm text-text-secondary leading-6">
          <p>WiscFlow uses UW Google sign-in to verify student identity and access.</p>
          <p>We store account basics, reviews, votes, and comments needed to operate the platform.</p>
          <p>We do not sell personal data. Data is used only for product functionality and moderation.</p>
          <p>If you need account/content removal, contact the project maintainer.</p>
        </div>
      </main>
    </div>
  )
}
