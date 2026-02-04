# WiscFlow Documentation

**Last Updated**: 2026-02-03

This folder contains all design, planning, and migration documentation for the WiscFlow project.

---

## 📁 Document Categories

### 🎯 Product Design Documents (✅ For GitHub)

| File | Description | GitHub |
|------|-------------|--------|
| `PRODUCT_DESIGN.md` | Complete product design (competitive analysis, features, UI mockups) | ✅ Recommended |
| `PROJECT_ROADMAP.md` | Project roadmap and feature planning | ✅ Recommended |

**Why upload**:
- Helps contributors understand product vision
- Facilitates team collaboration
- Demonstrates planning capability
- **Contains no sensitive information**

---

### 🏗️ Technical Architecture Documents (✅ For GitHub)

| File | Description | GitHub |
|------|-------------|--------|
| `TECH_UPGRADE_PLAN.md` | Technical architecture upgrade plan (Monorepo + tRPC + Redis) | ✅ Recommended |
| `EVALUATION_REPORT.md` | Design vs. implementation evaluation | ✅ Recommended |
| `SUPABASE_VS_NEON.md` | PostgreSQL provider comparison | ✅ Recommended |

**Why upload**:
- Documents technical decision process
- Helps understand architecture choices
- Valuable reference for other developers
- **Contains no sensitive information**

---

### 🔄 Migration Documents (⚠️ Partially Upload)

| File | Description | GitHub |
|------|-------------|--------|
| `MIGRATION_CHECKLIST.md` | PostgreSQL + tRPC migration checklist | ✅ Recommended |
| `MIGRATION_COMPLETED.md` | Migration completion report | ⚠️ **Needs sanitization** |

**MIGRATION_COMPLETED.md should remove**:
- ❌ Database connection strings
- ❌ Neon project specific information
- ✅ Keep migration steps and lessons learned

**Can upload after sanitization** as migration experience sharing.

---

### 📊 Testing and Development Documents (❌ Not Recommended)

| File | Description | GitHub |
|------|-------------|--------|
| `../TEST_REPORT.md` | Test reports | ❌ Local use only |
| `../DEVELOPMENT_PLAN.md` | Development plan | ❌ Outdated |
| `../OAUTH_SETUP.md` | OAuth configuration | ⚠️ **Contains sensitive info** |

**Why not upload**:
- Contains specific configuration details
- May contain sensitive information (Client ID/Secret)
- Temporary documents with no reference value

---

## 🔐 Sensitive Information Checklist

Before uploading to GitHub, ensure removal of:

### ❌ Absolutely Cannot Upload
```bash
# Database connection strings
DATABASE_URL="postgresql://..."

# API keys
GOOGLE_CLIENT_SECRET=GOCSPX-...
AUTH_SECRET=...

# Specific server addresses
ep-jolly-haze-ae0kcj2h-pooler.c-2.us-east-2.aws.neon.tech
```

### ✅ Safe to Upload
```bash
# Generic examples
DATABASE_URL="postgresql://user:password@hostname/database"

# Architecture diagrams, flowcharts
# Technical selection reasoning
# Code structure
```

---

## 📋 Recommended GitHub Documentation Structure

```
wiscflow/
├── README.md                    # Project introduction
├── docs/
│   ├── README.md               # This file
│   ├── DESIGN.md               # Product design (renamed from PRODUCT_DESIGN.md)
│   ├── ARCHITECTURE.md         # Tech architecture (simplified TECH_UPGRADE_PLAN.md)
│   ├── ROADMAP.md              # Roadmap (PROJECT_ROADMAP.md)
│   └── MIGRATION_GUIDE.md      # Migration guide (sanitized MIGRATION_CHECKLIST.md)
└── .gitignore                  # Ensure .env not uploaded
```

---

## 🚀 Pre-upload Checklist

### 1. Check .gitignore
```bash
# Ensure these files are in .gitignore
.env
.env.local
.env*.local
*.db
*.log
node_modules/
.next/
```

### 2. Search for Sensitive Information
```bash
# Search for sensitive info in all .md files
grep -r "postgresql://" docs/
grep -r "GOCSPX-" docs/
grep -r "npg_" docs/  # Neon password prefix
grep -r "ep-.*\.neon\.tech" docs/
```

### 3. Sanitization Example

**Before (contains sensitive info)**:
```md
Connection string:
postgresql://neondb_owner:npg_jWYRpew54frP@ep-jolly-haze-ae0kcj2h-pooler.c-2.us-east-2.aws.neon.tech/neondb
```

**After (sanitized)**:
```md
Connection string format:
postgresql://[username]:[password]@[host]/[database]?sslmode=require

Example:
postgresql://user:pass@your-project.region.aws.neon.tech/dbname
```

---

## 📝 Recommended Workflow

### Step 1: Create Standard Documents
```bash
# Create standardized documentation in docs/
cp PRODUCT_DESIGN.md DESIGN.md
cp PROJECT_ROADMAP.md ROADMAP.md
# ... rename and simplify as needed
```

### Step 2: Sanitization Check
```bash
# Run sanitization check script
npm run docs:check-sensitive
# or
bash scripts/check-sensitive-info.sh
```

### Step 3: Update Main README
```bash
# Create comprehensive README.md in project root
# Include:
# - Project introduction
# - Quick start guide
# - Tech stack
# - Documentation links
```

### Step 4: Commit to GitHub
```bash
git add docs/
git add README.md
git commit -m "docs: add project documentation"
git push
```

---

## 🎓 Documentation Best Practices

### 1. Use Relative Paths
```markdown
# ❌ Don't use absolute paths
/Users/yifanyang/Desktop/wiscflow/...

# ✅ Use relative paths
../scripts/seedCourses.ts
```

### 2. Remove Local Information
```markdown
# ❌ Don't include local directories
Working directory: /Users/yifanyang/Desktop/wiscflow

# ✅ Use generic paths
Working directory: <project-root>
```

### 3. Use Placeholders
```markdown
# ❌ Don't expose real credentials
GOOGLE_CLIENT_ID=843088484088-xxx

# ✅ Use placeholders
GOOGLE_CLIENT_ID=your-client-id
```

---

## 📚 Documentation Maintenance

### Regular Updates
- Update ROADMAP.md after features complete
- Update ARCHITECTURE.md after architectural changes
- Update MIGRATION_GUIDE.md after migrations complete

### Archive Old Documents
```bash
# Move outdated docs to archive/
mkdir -p docs/archive
mv docs/OLD_PLAN.md docs/archive/
```

### Version Control
```markdown
# Mark version at top of documents
**Version**: v1.0.0
**Last Updated**: 2026-02-03
**Status**: ✅ Current / 🔄 In Progress / 📦 Archived
```

---

## ✅ Recommended for GitHub Upload

Final recommendation:

1. ✅ **DESIGN.md** - Product design (sanitized PRODUCT_DESIGN.md)
2. ✅ **ROADMAP.md** - Project roadmap
3. ✅ **ARCHITECTURE.md** - Tech architecture (simplified TECH_UPGRADE_PLAN.md)
4. ✅ **MIGRATION_GUIDE.md** - Migration guide (sanitized)
5. ✅ **CONTRIBUTING.md** - Contribution guidelines (to be created)
6. ✅ **README.md** - Main project documentation (to be improved)

---

**Next Step**: Run sanitization check, then upload to GitHub!
