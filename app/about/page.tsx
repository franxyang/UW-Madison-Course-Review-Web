'use client'

import { Header } from '@/components/Header'
import { Logo } from '@/components/Logo'
import { BookOpen, Users, Shield, Heart, Code2, AlertTriangle, Github } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <Header currentPath="/about" />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size={64} />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">About MadSpace</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            A modern course review platform built by and for UW-Madison students.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="mb-10 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Disclaimer:</strong> MadSpace is an independent student project and is not affiliated with, endorsed by, or officially connected to the University of Wisconsin-Madison.
            </p>
          </div>
        </div>

        {/* Mission */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BookOpen className="text-wf-crimson" size={24} />
            Our Mission
          </h2>
          <p className="text-text-secondary leading-relaxed">
            MadSpace helps UW-Madison students share honest course experiences and make informed 
            enrollment decisions. We believe in the power of peer reviews to create a more 
            transparent academic experience for everyone. By combining historical grade data 
            with firsthand student perspectives, we aim to be the most comprehensive course 
            planning resource for Badgers.
          </p>
        </section>

        {/* Features */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users className="text-wf-crimson" size={24} />
            What We Offer
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-2">📚 10,000+ Courses</h3>
              <p className="text-sm text-text-secondary">Browse courses from all UW-Madison schools and departments with detailed information.</p>
            </div>
            <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-2">⭐ Multi-Dimensional Reviews</h3>
              <p className="text-sm text-text-secondary">Rate courses across content, teaching, grading, and workload for a complete picture.</p>
            </div>
            <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-2">📊 Grade Distributions</h3>
              <p className="text-sm text-text-secondary">Historical grade data from MadGrades with per-instructor and per-term breakdowns.</p>
            </div>
            <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-2">👨‍🏫 Instructor Profiles</h3>
              <p className="text-sm text-text-secondary">Teaching portfolios with radar charts, rating trends, and student feedback.</p>
            </div>
            <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-2">🏆 Contributor System</h3>
              <p className="text-sm text-text-secondary">Earn XP and level up by writing reviews and helping fellow students.</p>
            </div>
            <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-2">🔍 Smart Search</h3>
              <p className="text-sm text-text-secondary">Find courses instantly with live search across codes, names, and departments.</p>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="text-wf-crimson" size={24} />
            Privacy & Trust
          </h2>
          <p className="text-text-secondary leading-relaxed">
            MadSpace is exclusively for UW-Madison students. We require <code className="px-1.5 py-0.5 bg-surface-primary border border-surface-tertiary rounded text-sm">@wisc.edu</code> email 
            verification to ensure a trusted community. We never share personal information 
            and all reviews can be posted with pseudonymous display names. Our moderation 
            system keeps content helpful and respectful.
          </p>
        </section>

        {/* Credits */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Heart className="text-wf-crimson" size={24} />
            Acknowledgments
          </h2>
          <ul className="space-y-2 text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-wf-crimson">•</span>
              Grade distribution data from <a href="https://madgrades.com" target="_blank" rel="noopener noreferrer" className="text-wf-crimson hover:underline">MadGrades</a>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-wf-crimson">•</span>
              Course catalog sourced from UW-Madison&apos;s official database
            </li>
            <li className="flex items-start gap-2">
              <span className="text-wf-crimson">•</span>
              Built and maintained by UW-Madison students
            </li>
          </ul>
        </section>

        {/* Tech Stack & Open Source */}
        <section className="space-y-4 mb-10">
          <div className="bg-surface-primary rounded-xl p-6 border border-surface-tertiary">
            <div className="flex items-center gap-4">
              <Code2 size={32} className="text-text-secondary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-text-primary">Built with Modern Technologies</h3>
                <p className="text-text-secondary text-sm mt-1">
                  Next.js, TypeScript, Tailwind CSS, PostgreSQL, Prisma, and tRPC — 
                  designed for performance, accessibility, and a great developer experience.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface-primary rounded-xl p-6 border border-surface-tertiary">
            <div className="flex items-center gap-4">
              <Github size={32} className="text-text-secondary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-text-primary">Open Source</h3>
                <p className="text-text-secondary text-sm mt-1">
                  MadSpace is open source. Contributions, feedback, and bug reports are welcome.{' '}
                  <a 
                    href="https://github.com/franxyang/UW-Madison-Course-Review-Web" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-wf-crimson hover:underline"
                  >
                    View on GitHub →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-tertiary bg-surface-primary py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-text-secondary">
              <Logo size={20} />
              <span className="text-sm">Built with ❤️ for Badgers, by Badgers</span>
            </div>
            <p className="text-xs text-text-tertiary max-w-lg">
              MadSpace is an independent student project and is not affiliated with, endorsed by, or officially connected to the University of Wisconsin-Madison.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
