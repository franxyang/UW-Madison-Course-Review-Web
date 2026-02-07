'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft, BookOpen, Users, Shield, Heart, Github } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <header className="border-b border-surface-tertiary bg-surface-secondary">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            href="/courses" 
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Courses
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size={64} />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">About WiscFlow</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            A modern course review platform built by and for UW-Madison students.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BookOpen className="text-wf-crimson" size={24} />
            Our Mission
          </h2>
          <p className="text-text-secondary leading-relaxed">
            WiscFlow helps UW-Madison students share honest course experiences and make informed 
            enrollment decisions. We believe in the power of peer reviews to create a more 
            transparent academic experience for everyone.
          </p>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users className="text-wf-crimson" size={24} />
            What We Offer
          </h2>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-start gap-3">
              <span className="text-wf-crimson font-bold">•</span>
              <span><strong>10,000+ courses</strong> from all UW-Madison schools and departments</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-wf-crimson font-bold">•</span>
              <span><strong>Multi-dimensional reviews</strong> covering content, teaching, grading, and workload</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-wf-crimson font-bold">•</span>
              <span><strong>Historical grade data</strong> from MadGrades with per-instructor breakdowns</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-wf-crimson font-bold">•</span>
              <span><strong>Instructor profiles</strong> with teaching portfolios and rating trends</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-wf-crimson font-bold">•</span>
              <span><strong>Contributor system</strong> that rewards active community members</span>
            </li>
          </ul>
        </section>

        {/* Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="text-wf-crimson" size={24} />
            Privacy & Security
          </h2>
          <p className="text-text-secondary leading-relaxed">
            WiscFlow is exclusively for UW-Madison students. We require @wisc.edu email 
            verification to ensure a trusted community. We never share personal information 
            and all reviews can be posted anonymously.
          </p>
        </section>

        {/* Credits */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Heart className="text-wf-crimson" size={24} />
            Acknowledgments
          </h2>
          <ul className="space-y-2 text-text-secondary">
            <li>• Grade distribution data from <a href="https://madgrades.com" target="_blank" rel="noopener noreferrer" className="text-wf-crimson hover:underline">MadGrades</a></li>
            <li>• Course catalog from UW-Madison's official database</li>
            <li>• Built with Next.js, TypeScript, and PostgreSQL</li>
          </ul>
        </section>

        {/* Open Source */}
        <section className="bg-surface-secondary rounded-xl p-6 border border-surface-tertiary">
          <div className="flex items-center gap-4">
            <Github size={32} className="text-text-secondary" />
            <div>
              <h3 className="font-semibold text-text-primary">Open Source</h3>
              <p className="text-text-secondary text-sm">
                WiscFlow is open source.{' '}
                <a 
                  href="https://github.com/franxyang/UW-Madison-Course-Review-Web" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-wf-crimson hover:underline"
                >
                  View on GitHub
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-tertiary py-6 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-text-tertiary">
          Built with ❤️ for Badgers, by Badgers
        </div>
      </footer>
    </div>
  )
}
