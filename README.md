# WiscFlow - UW Madison Course Reviews

A modern course review platform for University of Wisconsin-Madison students.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- **Course Search** - Search and filter 6000+ courses
- **Grade Distributions** - View historical grade data from MadGrades
- **Student Reviews** - Read and write multi-dimensional course reviews
- **Secure Auth** - @wisc.edu email authentication only

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **API**: tRPC (type-safe)
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- PostgreSQL database (or Supabase account)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wiscflow.git
cd wiscflow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and auth secrets
```

4. Set up the database:
```bash
npx prisma db push
npx prisma generate
```

5. (Optional) Seed with sample data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── courses/            # Course listing and detail pages
│   ├── profile/            # User profile pages
│   └── api/                # API routes (tRPC, NextAuth)
├── components/
│   ├── ui/                 # Base UI components (shadcn)
│   ├── layout/             # Layout components
│   ├── course/             # Course-specific components
│   └── review/             # Review-specific components
├── server/
│   ├── db.ts               # Prisma client
│   └── trpc/               # tRPC routers
├── lib/                    # Utilities and configs
└── hooks/                  # Custom React hooks
```

## API Routes

The app uses tRPC for type-safe API calls:

- `trpc.courses.search` - Search courses with filters
- `trpc.courses.getByCode` - Get course details
- `trpc.courses.getPopular` - Get popular courses
- `trpc.reviews.getByCourse` - Get reviews for a course
- `trpc.reviews.create` - Create a review (auth required)
- `trpc.reviews.getMyReviews` - Get user's reviews

## Database Schema

Key models:
- **User** - Authenticated users (@wisc.edu)
- **Course** - Course catalog
- **Review** - Student reviews with ratings
- **GradeDistribution** - Historical grade data
- **Instructor** - Course instructors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Grade data from [MadGrades](https://madgrades.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Built for the UW Madison community

---

**Note**: This is an independent project and is not affiliated with the University of Wisconsin-Madison.
