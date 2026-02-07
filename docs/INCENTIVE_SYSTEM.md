# User Incentive System Design

**Date**: 2026-02-04  
**Status**: Proposed (Phase 2)  
**Priority**: 🔥 Critical — solves the cold-start content problem

---

## Problem

No reviews → no users → no reviews. We need a mechanism to:
1. **Motivate** users to write their first review
2. **Reward** active contributors
3. **Create value** even for read-only visitors (so they convert)

---

## Mechanism 1: Review-Gated Access (Frosted Glass)

### How It Works

| User State | What They See |
|-----------|---------------|
| **Not logged in** | Course info + 1 preview review (full) + remaining reviews frosted/blurred |
| **Logged in, 0 reviews** | Same as above, but with a clear CTA: "Write your first review to unlock all reviews" |
| **Logged in, 1+ reviews** | Full access to all reviews on all courses |

### UX Details

**Frosted reviews** (CSS `backdrop-filter: blur(8px)`):
- Show the review card layout (rating badges, comment length) but blur the text
- Show a count: "🔒 12 more reviews — Write a review to unlock"
- The single visible review should be the **highest-voted** one (best quality preview)

**Unlock CTA**:
```
┌─────────────────────────────────────────────┐
│  🔓 Unlock All Reviews                      │
│                                              │
│  Share your experience with one course and   │
│  get full access to reviews across the       │
│  entire platform.                            │
│                                              │
│  [Write a Review →]                          │
└─────────────────────────────────────────────┘
```

### Edge Cases
- User deletes their only review → access reverts to gated
- User writes a low-quality review (< 20 chars per dimension) → still counts, but flagged for moderation later
- Minimum review quality threshold (optional, later): require at least 50 characters total across all comment fields

### Implementation

```typescript
// In course.byId router or middleware
const userReviewCount = session?.user?.id 
  ? await prisma.review.count({ where: { authorId: session.user.id } })
  : 0

const hasFullAccess = userReviewCount >= 1

return {
  ...course,
  reviews: hasFullAccess 
    ? course.reviews 
    : [course.reviews[0]],  // Only best review
  totalReviews: course.reviews.length,
  isGated: !hasFullAccess,
}
```

**Frontend** (`CourseDetail.tsx`):
```tsx
{review.isGated ? (
  <div className="relative">
    <div className="blur-sm pointer-events-none">{renderReview(review)}</div>
    <div className="absolute inset-0 flex items-center justify-center">
      <UnlockCTA />
    </div>
  </div>
) : (
  renderReview(review)
)}
```

---

## Mechanism 2: Contributor Levels & Titles

### Level System

| Level | Title | Requirement | Badge |
|-------|-------|-------------|-------|
| 0 | Reader | Registered | — |
| 1 | **Contributor** | 1 review | 🟢 |
| 2 | **Active Reviewer** | 5 reviews | 🔵 |
| 3 | **Trusted Reviewer** | 15 reviews + 10 upvotes received | 🟣 |
| 4 | **Expert Reviewer** | 30 reviews + 50 upvotes received | 🟡 |
| 5 | **MadSpace Legend** | 50 reviews + 100 upvotes received | 🔴 |

### Perks by Level

| Level | Perk |
|-------|------|
| 1+ | Full review access (unlocked) |
| 2+ | "Active Reviewer" badge on profile + reviews |
| 3+ | "Trusted" badge, reviews shown higher in default sort |
| 4+ | Access to early features / beta features |
| 5+ | Name on contributors page, special profile flair |

### XP System (Optional, for gamification)

Actions earn XP:
| Action | XP |
|--------|-----|
| Write a review | +50 |
| Receive an upvote | +10 |
| Write a comment | +5 |
| First review on a course with 0 reviews | +100 (bonus!) |
| Review during enrollment season (Nov, Apr) | +25 (seasonal bonus) |

XP thresholds for levels: 0 → 50 → 300 → 1000 → 2500 → 5000

### Implementation

**Database** — Add to User model:
```prisma
model User {
  // ... existing fields
  level       Int     @default(0)
  xp          Int     @default(0)
  title       String? // Custom title override (admin-granted)
}
```

**Calculation** — Can be computed on-the-fly or cached:
```typescript
function computeUserLevel(reviewCount: number, upvotesReceived: number): number {
  if (reviewCount >= 50 && upvotesReceived >= 100) return 5
  if (reviewCount >= 30 && upvotesReceived >= 50) return 4
  if (reviewCount >= 15 && upvotesReceived >= 10) return 3
  if (reviewCount >= 5) return 2
  if (reviewCount >= 1) return 1
  return 0
}
```

---

## Mechanism 3: Seasonal Engagement Boosts

### Enrollment Season Campaigns
UW-Madison enrollment periods (November for Spring, April for Fall) are peak demand. During these windows:

- **Homepage banner**: "Enrollment season! Help fellow Badgers — share your reviews"
- **XP bonus**: 1.5x XP for reviews written during enrollment windows
- **Email reminder**: "Enrollment starts next week — your reviews help others"
- **Leaderboard**: Top contributors this enrollment season

### First-Review Nudge
After a student completes their first semester, prompt:
- "You just finished Fall 2026! Rate the courses you took 📝"
- Show their enrolled courses (if they've entered course history) with a "Review" button

---

## Visual Mockup — Frosted Glass

```
┌─ COMP SCI 577: Introduction to Algorithms ──────────────┐
│                                                          │
│  ⭐ Review by BadgerCS (🔵 Active Reviewer)              │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Content: A  Teaching: B  Grading: B  Workload: A │    │
│  │ "Great course for algorithm fundamentals. The     │    │
│  │  problem sets are challenging but fair..."        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│  ░░░░░░░░░░░░░░░░ BLURRED REVIEW ░░░░░░░░░░░░░░░░░░    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│                                                          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│  ░░░░░░░░░░░░░░░░ BLURRED REVIEW ░░░░░░░░░░░░░░░░░░    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  🔓 12 more reviews available                     │    │
│  │                                                    │    │
│  │  Write a review for any course to unlock full     │    │
│  │  access across the entire platform.               │    │
│  │                                                    │    │
│  │           [ Write My First Review → ]             │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Rollout Plan

### Phase 2A — MVP Incentives
1. **Review-gated access** (frosted glass) — highest impact, low effort
2. **User level field** in DB (computed, not XP-based yet)
3. **Contributor badge** displayed on reviews

### Phase 2B — Gamification  
4. **XP system** with level progression
5. **Level perks** (badges, sort priority)
6. **Profile page** showing level, reviews, upvotes

### Phase 3 — Engagement
7. **Seasonal campaigns** (enrollment period boosts)
8. **Leaderboard** (top contributors)
9. **First-review nudge** after semester ends

---

## Open Questions

1. **Should we allow anonymous reviews?** — USTSPACE doesn't. We could allow anonymous display but require auth.
2. **Minimum review quality?** — Require X characters? Or let community downvote bad reviews?
3. **Should "frosted" reviews show partial text (first sentence)?** — Creates more FOMO vs. full blur.

---

## Summary

The incentive system has three pillars:

| Pillar | Mechanism | Goal |
|--------|-----------|------|
| **Gate** | Frosted glass, 1-review unlock | Force first contribution |
| **Reward** | Levels, badges, sort priority | Sustain continued contributions |
| **Timing** | Seasonal boosts, nudges | Maximize content during peak demand |

Priority: **Gate (frosted glass) first** — it's the single highest-impact change for solving cold-start.
