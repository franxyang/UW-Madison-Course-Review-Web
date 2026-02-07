import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold text-text-primary mt-6 mb-4">Terms of Service</h1>
        <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-6 space-y-4 text-sm text-text-secondary leading-6">
          <p>MadSpace is a student community platform for course feedback at UW-Madison.</p>
          <p>By using this site, you agree to post truthful, respectful, and course-relevant content.</p>
          <p>Harassment, spam, and intentionally misleading content may be removed.</p>
          <p>This project is independent and is not officially affiliated with UW-Madison.</p>
        </div>
      </main>
    </div>
  )
}
