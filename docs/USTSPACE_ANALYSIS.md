# USTSPACE Analysis & Lessons for WiscFlow

**Date**: 2026-02-04  
**Source**: [ust.space](https://ust.space) — HKUST's student-built course review platform (since ~2015)

---

## 1. What USTSPACE Does Well

### 1.1 Integrated Ecosystem (Not Just Reviews)
USTSPACE isn't a single-purpose review site — it's a **student toolkit**:
- **Course Review** — Rate and review courses
- **Timetable Planner** — Visual weekly schedule builder with conflict detection
- **Book Marketplace** — Buy/sell textbooks between students
- **Personalized Experience** — Analyzes your course history to show remaining requirements

**Takeaway**: The timetable planner + review system combo is extremely sticky. Students come for scheduling, stay for reviews, and vice versa. This creates a natural flywheel.

### 1.2 School-Email-Only Registration
- Uses `@connect.ust.hk` verification
- Keeps the community exclusive and trusted
- Students feel safer posting honest reviews

**We already do this** ✅ — `@wisc.edu` via Google OAuth.

### 1.3 Data from Official Sources
- Course catalog, schedule, and Common Core data fetched from official HKUST systems
- Not user-submitted course info — only reviews are user-generated

**We already do this** ✅ — 10,174 courses from UW catalog + MadGrades.

### 1.4 Longevity & Trust
- Running since 2015, 3.2K Facebook followers
- A decade of accumulated reviews = massive value moat
- Students trust it because it's been around and maintained

**Takeaway**: Consistency matters. Ship early, iterate, and keep it alive. Accumulated reviews compound in value.

---

## 2. What We Can Borrow (Adapted, Not Copied)

### 2.1 ⭐ Timetable Planner → "Schedule Preview"
**USTSPACE version**: Full timetable builder with drag-and-drop, time clash detection, import/export.

**WiscFlow adaptation** (Phase 4):
- **NOT** a full planner (that's a huge scope) 
- Instead: **Schedule Preview widget** on course detail page
  - "If you add this course, here's how it fits your current schedule"
  - Simple visual: Mon-Fri time blocks showing conflicts
  - Requires: user saves their current courses (we already have `SavedCourse` model)
- Later: upgrade to full planner if demand exists

### 2.2 ⭐ Personalized Requirements Tracking
**USTSPACE version**: Analyzes course history to show which requirements you still need.

**WiscFlow adaptation** (Phase 4):
- We already have `StudentCourseHistory` model in Prisma schema
- MVP: Show breadth/gen-ed progress based on completed courses
- "You still need: Communication B, 3 more Humanities breadth credits"
- This leverages our existing `breadths` and `genEds` fields on Course

### 2.3 Book Marketplace → Resource Sharing
**USTSPACE version**: Full buy/sell textbook marketplace.

**WiscFlow adaptation** (lighter):
- We already have `resourceLink` field on Review
- Expand to: **Course Resources section** on course detail page
  - Shared study guides, past exams links, textbook recommendations
  - Curated by community votes (reuse vote system)
  - No need for a full marketplace — just links + recommendations

### 2.4 Clean Navigation Structure
**USTSPACE**: HOME | REVIEW | PLANNER | MARKETPLACE | TOOLS  

**WiscFlow** (current): Courses | Reviews | About  

**Suggested nav expansion** (as features ship):
```
Courses | Reviews | Planner | Profile
```

---

## 3. Where We Should Differentiate

### 3.1 Grade Distribution Data (Our Advantage)
USTSPACE doesn't show grade distributions. We have **MadGrades data** — historical GPA trends per course per semester. This is a unique and powerful feature. Lean into it:
- Grade trend charts on course detail
- "This professor gives higher GPAs in Fall vs Spring"
- GPA-based filtering and sorting (already implemented ✅)

### 3.2 Multi-dimensional Review System (Already Better)
USTSPACE likely uses a simpler rating system. Our **4-dimension rating** (content, teaching, grading, workload) with separate text comments per dimension is already more structured and useful.

### 3.3 Cross-listed Course Handling
We properly handle cross-listed courses (1,368 groups) — students can find "COMP SCI / MATH 240" from either department. This is a data quality advantage.

### 3.4 Modern Tech Stack
USTSPACE was built ~2015 (likely jQuery/PHP era). Our stack (Next.js 15, tRPC, React Query, Tailwind) gives us:
- Better performance (SSR, streaming, caching)
- Better DX for rapid iteration
- Better mobile experience out of the box

### 3.5 AI Features (Future Differentiator)
USTSPACE has no AI. Our Phase 4 plans for AI review summaries, smart recommendations, and GPA prediction will be unique.

---

## 4. What NOT to Do

| USTSPACE Pattern | Why We Skip It |
|-----------------|----------------|
| Full Marketplace | Scope creep — Facebook Marketplace already works fine |
| NetPrint tool | HKUST-specific, irrelevant |
| Facebook integration | Dated; Discord/social are better for UW students |
| Username/password auth | We use Google OAuth — simpler, more secure |

---

## 5. Priority Integration into Roadmap

| Feature | Phase | Effort | Impact |
|---------|-------|--------|--------|
| **User Incentive System** (review-gating + levels) | 2 | Medium | 🔥 Critical for content generation |
| **Saved Courses / My Schedule** | 2 | Low | High — foundation for planner |
| **Course Resources section** | 2 | Low | Medium |
| **Schedule Preview widget** | 4 | Medium | High — sticky feature |
| **Requirements Tracker** | 4 | High | Very High — killer feature |
| **AI Review Summaries** | 4 | Medium | High — differentiator |

---

## Summary

USTSPACE's strength is being an **integrated student toolkit**, not just a review site. For WiscFlow:

1. **Short-term**: Focus on review quality + user incentives (the cold-start problem is #1 priority)
2. **Mid-term**: Add saved courses + schedule preview to create stickiness
3. **Long-term**: Requirements tracker + AI features for differentiation

The biggest lesson: **make it indispensable during enrollment season**, and students will keep coming back.
