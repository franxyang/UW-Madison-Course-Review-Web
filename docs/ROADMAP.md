# WiscFlow Future Roadmap

**Last Updated**: 2026-02-06  
**Current Status**: See [PROGRESS.md](../PROGRESS.md) for current completion status

---

## 🎯 Project Vision

A modern course review platform designed for UW-Madison students to make informed course selection decisions. WiscFlow combines grade distributions, student reviews, and smart filtering to help Badgers navigate 10,000+ courses.

---

## 🚀 Phase 4: Advanced Features

### 1. AI-Powered Features
- [ ] **AI Review Summaries** - Auto-generate course summaries from reviews
- [ ] **Smart Course Recommendations** - Based on major, interests, and history
- [ ] **Schedule Conflict Detection** - Integrate with timetable planning
- [ ] **Credit Planning Assistant** - Track graduation requirements

### 2. Community Features
- [ ] **User Follow System** - Follow reviewers you trust
- [ ] **Study Group Creation** - Connect with classmates
- [ ] **Course Discussion Forums** - Threaded discussions per course
- [ ] **Direct Messaging** - Private communication

### 3. Data Analytics
- [ ] **Course Popularity Rankings** - Trending courses
- [ ] **Instructor Rating Rankings** - Top-rated instructors
- [ ] **Semester Trend Analysis** - Grade trends over time
- [ ] **Major Course Statistics** - Department-level insights

### 4. Notification System
- [ ] **New Review Notifications** - For saved courses
- [ ] **Comment Reply Notifications** - Engagement alerts
- [ ] **Course Update Notifications** - Syllabus/instructor changes
- [ ] **Email Subscription** - Weekly digests

---

## 🔐 Phase 5: Admin Portal

### 1. Admin Features
- [ ] **User Management** - Ban, permissions, roles
- [ ] **Review Moderation** - Flag/remove inappropriate content
- [ ] **Course Data Management** - CRUD for courses
- [ ] **Report Handling** - Process user reports
- [ ] **System Log Viewer** - Activity monitoring

### 2. Data Import Tools
- [ ] **CSV Batch Import Interface** - Bulk course updates
- [ ] **Semester Course Auto-sync** - Automatic catalog refresh
- [ ] **Instructor Info Updates** - Profile management
- [ ] **Grade Distribution Import** - MadGrades integration

---

## 🤖 Phase 6: GPA Prediction (Experimental)

### ML Pipeline
1. **Transcript Parser**
   - PDF upload and OCR extraction
   - Data validation and normalization
   - Privacy-first design

2. **Prediction Model**
   - Feature engineering (past GPA, course difficulty, instructor)
   - Model training (scikit-learn or TensorFlow)
   - API endpoint for predictions

3. **UI Integration**
   - "Predict My Grade" badge on course pages
   - Confidence intervals display
   - Explanation tooltips

---

## 📊 Data Requirements

### Current Data Status
| Data | Status |
|------|--------|
| School data | ✅ 23 schools imported |
| Course catalog | ✅ 10,174 courses |
| Departments | ✅ 209 departments |
| Grade distributions | ✅ MadGrades integrated |
| Instructor data | ✅ 20,607 instructors |
| Cross-listed courses | ✅ 1,368 groups |
| Prerequisites | ⚠️ Partial |

### Data Acquisition Plan

#### Official Sources
- **UW-Madison Course Guide API** - Primary catalog source
- **MadGrades.com** - Historical grade distributions
- **RateMyProfessors** - Reference only (not imported)

#### User-Generated Content
- Student-submitted reviews
- Course resource sharing
- Notes and study materials

---

## 📝 Commit Strategy

### Commit Template
```
[Phase] Feature: Short description

- Bullet point changes
- More details

Relates to: #issue_number (if applicable)
```

### Commit Prefixes
| Prefix | Usage |
|--------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Code restructuring |
| `perf` | Performance |
| `test` | Tests |
| `chore` | Maintenance |

### Examples
```bash
feat(ai): add review summary generation
fix(search): correct alias matching for COMP SCI
docs: update ROADMAP with Phase 6 planning
perf(query): optimize course list pagination
```

---

## 📚 Related Documentation

- [PROGRESS.md](../PROGRESS.md) - Current development status
- [PHASE3_PROGRESS.md](./PHASE3_PROGRESS.md) - Phase 3 UX details
- [COLOR_SYSTEM.md](./COLOR_SYSTEM.md) - Design system
- [INCENTIVE_SYSTEM.md](./INCENTIVE_SYSTEM.md) - User engagement system

---

## 📝 Notes

- All features require user testing before release
- Prioritize data security and privacy
- Comply with UW-Madison policies
- Regularly collect user feedback and iterate
- Consider accessibility (WCAG 2.1 AA) for all new features

---

**Maintainer**: dev-agent  
**Next Review**: After Phase 4 planning begins
