# 🔴 WiscFlow

**A modern course review platform built by and for UW-Madison students.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)](https://neon.tech/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Make smarter course decisions with real reviews from fellow Badgers 🦡

---

## What is WiscFlow?

WiscFlow helps UW-Madison students share honest course experiences and make informed enrollment decisions. Browse **10,000+ courses**, read student reviews with multi-dimensional ratings, and filter by school, department, level, or credits — all in one place.

### Key Features

- 🔍 **Full-text Search** — Find courses by code, name, or keyword with PostgreSQL-powered search and alias support (e.g. `CS 577` ↔ `COMP SCI 577`)
- 🏫 **Smart Filtering** — Filter by school, department (209 depts), course level, credits, GPA range, and instructor
- ⭐ **Multi-dimensional Reviews** — Rate courses on content, teaching, grading, and workload
- 📊 **Grade Distributions** — Historical GPA data from MadGrades with per-instructor filtering
- 👨‍🏫 **Instructor Profiles** — Teaching portfolio with radar charts, timelines, and aggregated ratings
- 🏆 **Contributor System** — 6-tier progression (Reader → Legend) with XP and badges
- 💬 **Community** — Upvote helpful reviews and discuss in comment threads
- 🔗 **Cross-listed Courses** — 1,368 cross-listed course groups properly linked across departments
- 🌙 **Dark Mode** — System-aware theme switching
- 🔐 **@wisc.edu Only** — Verified UW-Madison student community via Google OAuth

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15, React, TypeScript |
| **Styling** | Tailwind CSS, Lucide Icons |
| **API** | tRPC (end-to-end type safety) |
| **Database** | PostgreSQL (Neon Serverless) + Prisma ORM |
| **Search** | PostgreSQL tsvector + GIN index |
| **Caching** | Upstash Redis (graceful degradation) |
| **Auth** | NextAuth.js v5 + Google OAuth |
| **Data Fetching** | React Query (TanStack Query) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or a [Neon](https://neon.tech/) account)
- Google OAuth credentials ([setup guide](docs/OAUTH_SETUP.md))

### Installation

```bash
# Clone the repo
git clone https://github.com/franxyang/UW-Madison-Course-Review-Web.git
cd wiscflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
AUTH_SECRET="..."  # Run: openssl rand -base64 32
```

```bash
# Run database migrations
npx prisma migrate dev

# Seed data (schools, courses, departments)
npx tsx scripts/seedSchools.ts
npx tsx scripts/seedCourses.ts
npx tsx scripts/seedDepartments.ts

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
wiscflow/
├── app/                      # Next.js App Router
│   ├── courses/              # Course browse & detail pages
│   ├── auth/                 # Sign in / Sign up
│   ├── profile/              # User profile
│   └── api/                  # tRPC + NextAuth routes
├── server/api/               # tRPC routers
│   └── routers/              # course, review, comment
├── components/               # React components
│   ├── FilterPanel.tsx       # Left sidebar filters
│   ├── ReviewForm.tsx        # Multi-dimensional review form
│   ├── VoteButton.tsx        # Optimistic vote UI
│   └── CommentSection.tsx    # Threaded comments
├── lib/                      # Utilities
│   ├── courseAliases.ts      # Course code alias mapping (60+ groups)
│   ├── redis.ts              # Redis cache wrapper
│   └── trpc/                 # tRPC client setup
├── prisma/                   # Schema & migrations
├── scripts/                  # Data seeding scripts
└── docs/                     # Documentation
```

---

## Database

| Entity | Count |
|--------|-------|
| Schools | 23 |
| Departments | 209 |
| Courses | 10,174 |
| Instructors | 20,607 |
| Grade Distributions | 247,234 |
| Cross-listed Groups | 1,368 |

Data sourced from UW-Madison's official course catalog and [MadGrades](https://madgrades.com/).

---

## Development Roadmap

### ✅ Phase 1 — Infrastructure (Complete)
PostgreSQL migration, tRPC integration, full-text search, Redis caching, department import, course alias search, left sidebar filters, pagination.

### ✅ Phase 2 — Core Features (Complete)
Advanced search, instructor pages, user dashboard, review management (edit/delete/report), user incentive system (contributor levels + XP), mobile responsiveness.

### 🔄 Phase 3 — UX & Visualization (80% Complete)
- ✅ Color system overhaul (UW crimson + soft gradients)
- ✅ Course detail page 3-column layout
- ✅ Instructor Teaching Portfolio (radar chart + timeline)
- ✅ Dark mode support
- ✅ Real-time search preview
- 🔨 Component unification, performance optimization

### 📅 Phase 4 — Advanced Features (Planned)
AI review summaries, course recommendations, community features, notification system.

### 🔐 Phase 5 — Admin (Planned)
Moderation tools, data management, analytics dashboard.

**Documentation:**
- [PROGRESS.md](PROGRESS.md) — Current status & statistics
- [docs/ROADMAP.md](docs/ROADMAP.md) — Future planning (Phase 4-6)

---

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes ([Conventional Commits](https://www.conventionalcommits.org/))
4. Push and open a Pull Request

### Commit Convention

```
feat(scope): add new feature
fix(scope): fix bug
docs: update documentation
refactor: code restructuring
perf: performance improvement
```

---

## Privacy & Security

- ✅ @wisc.edu email verification required
- ✅ Credentials encrypted in transit and at rest
- ✅ No personal academic data collected without consent
- ✅ Independent project — not affiliated with UW-Madison

---

## Acknowledgments

- [UW-Madison](https://www.wisc.edu/) — Course catalog data
- [MadGrades](https://madgrades.com/) — Historical grade distributions
- [Neon](https://neon.tech/) — Serverless PostgreSQL
- [Vercel](https://vercel.com/) — Deployment platform

---

## License

[MIT](LICENSE)

---

**Built with ❤️ for Badgers, by Badgers**
