# UW Courses API vs Madgrades 数据对比分析

## 数据结构对比

### UW Courses API (static.uwcourses.com)

```
Course
├── course_reference (subjects, number)
├── course_title
├── description
├── prerequisites
├── cumulative_grade_data (所有学期汇总)
└── term_data
    └── {term_code}  (如 "1252")
        └── grade_data
            ├── a, ab, b, bc, c, d, f (整个学期的汇总)
            ├── total
            └── instructors: ["GARY DAHL", "MOUNA AYARI"]  ← 只是列表！
```

**问题**: 成绩是 term 级别汇总，无法知道 GARY DAHL 的学生 vs MOUNA AYARI 的学生分别得了什么成绩。

### Madgrades (UW Registrar PDF 提取)

```
courses
└── course_offerings (per term)
    └── sections (per section)
        ├── grade_distributions  ← 成绩是 per-section 的！
        │   ├── a_count, ab_count, ...
        │   ├── section_number
        │   └── gpa
        └── teachings
            └── instructor_id  ← 可以关联到具体教师！
```

**优势**: 可以通过 section → teaching → instructor 链接，得到每个教师的成绩分布。

## 详细对比表

| 维度 | UW Courses | Madgrades |
|------|------------|-----------|
| **数据来源** | UW Courses 网站 API | UW Registrar 官方 PDF |
| **更新频率** | 每周自动更新 | 需要手动运行提取 |
| **获取方式** | HTTP API (简单) | Java PDF 提取 (复杂) |
| **成绩粒度** | Term 级别汇总 | **Section 级别** ✅ |
| **Instructor-GPA 关联** | ❌ 无 | ✅ 可通过 Section 关联 |
| **课程描述** | ✅ 有 | ❌ 无 |
| **先修课要求** | ✅ 有 | ❌ 无 |
| **历史数据** | 较全 (~2010+) | 较全 (~2006+) |
| **数据格式** | JSON | CSV/SQL |

## 数据关系图

### UW Courses (扁平结构)
```
Course ──┬── Term 1 ── [GPA汇总, Instructor列表]
         ├── Term 2 ── [GPA汇总, Instructor列表]
         └── Term 3 ── [GPA汇总, Instructor列表]
```

### Madgrades (关系型结构)
```
Course ─── CourseOffering (Term) ─┬─ Section 001 ─┬─ GradeDistribution
                                  │               └─ Teaching → Instructor A
                                  ├─ Section 002 ─┬─ GradeDistribution
                                  │               └─ Teaching → Instructor A
                                  └─ Section 003 ─┬─ GradeDistribution
                                                  └─ Teaching → Instructor B
```

## 合并方案

### 方案 A: Madgrades 为主，UW Courses 补充

```
优先级:
1. Madgrades - 成绩数据 (per-instructor)
2. UW Courses - 课程元数据 (描述、先修课)

数据库结构:
Course
├── code, name, description (from UW Courses)
├── prerequisites (from UW Courses)
└── gradeDistributions
    └── SectionGrade (from Madgrades)
        ├── term
        ├── sectionNumber
        ├── instructor ← 可以关联！
        ├── aCount, bCount, ...
        └── gpa
```

**优点**:
- 可以按 instructor 过滤 GPA
- 数据最精确

**缺点**:
- Madgrades 需要手动提取，可能不够新
- 需要更复杂的数据库 schema

### 方案 B: 双数据源共存

```
数据库:
GradeDistribution
├── source: "uwcourses" | "madgrades"
├── granularity: "term" | "section"
├── term
├── instructor (nullable - only for madgrades)
├── aCount, bCount, ...
└── gpa

UI 逻辑:
- 有 section 数据 → 显示 per-instructor GPA
- 只有 term 数据 → 显示 term 汇总 + 说明
```

**优点**:
- 两个数据源互补
- UW Courses 保持最新
- Madgrades 提供精确的历史数据

**缺点**:
- UI 需要处理两种情况
- 数据可能有微小差异

### 方案 C: 智能合并 (推荐)

```
逻辑:
1. 首先用 UW Courses 填充基础数据
2. 运行 Madgrades 提取器获取 section 级数据
3. 合并时:
   - 如果 Madgrades 有该 term 的数据 → 用 section 级数据替换
   - 如果 Madgrades 没有 → 保留 UW Courses 的 term 汇总

好处:
- 最新数据: UW Courses (每周更新)
- 历史精确数据: Madgrades (per-instructor)
- 自动降级处理
```

## 实施步骤

1. **更新 Prisma Schema** - 添加 section 级字段
2. **提取 Madgrades 数据** - 运行 Java 提取器
3. **编写合并导入脚本** - 智能合并两个数据源
4. **更新 UI** - 支持按 instructor 过滤

## 数据量预估

| 数据 | UW Courses | Madgrades |
|------|------------|-----------|
| 课程数 | ~7,700 | ~10,000+ |
| 学期数 | ~40 | ~50+ |
| GradeDistribution | ~95,000 (term级) | ~500,000+ (section级) |
| Instructor | ~17,700 | ~20,000+ |
