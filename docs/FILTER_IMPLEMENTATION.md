# 课程筛选功能实现计划

**创建时间**: 2026-02-03  
**状态**: 🔄 规划中

---

## 🎯 目标

实现完整的多维度课程筛选系统，让学生快速找到符合需求的课程。

---

## 📊 当前状态

### ✅ 已实现
- [x] 按学院筛选 (`schoolId`)
- [x] 按课程代码/名称搜索 (`search`)
- [x] 基础课程列表展示

### ❌ 缺少的筛选功能
- [ ] 按 Department 筛选
- [ ] 按课程等级筛选 (100, 200, 300, 400, 500+)
- [ ] 按学分筛选 (1-6 学分)
- [ ] 按 Gen Ed 要求筛选
- [ ] 按 Breadth 要求筛选
- [ ] 按评分筛选 (最低评分)
- [ ] 按 GPA 筛选 (最低平均 GPA)
- [ ] 按评价数量筛选
- [ ] 多种排序选项

---

## 🏗️ 数据模型更新

### ✅ 已完成
```prisma
model Department {
  id        String   @id @default(cuid())
  code      String   @unique // "COMP SCI", "MATH"
  name      String   // "Computer Sciences", "Mathematics"
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])
  courses   CourseDepartment[]
}

model CourseDepartment {
  courseId     String
  course       Course     @relation(fields: [courseId], references: [id])
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id])
  @@id([courseId, departmentId])
}
```

### 待优化
```prisma
model Course {
  // 当前：JSON 字符串存储
  breadths  String? // ["Physical Science", ...]
  genEds    String? // ["Comm A", ...]
  
  // 建议：使用 PostgreSQL 数组
  breadths  String[] // 支持数组查询
  genEds    String[]
}
```

---

## 🎨 UI 设计

### 筛选器布局
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search: [_____________________] [Search]                │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Clear All]                                        │
│                                                             │
│ 🏫 School                                                   │
│ ☐ Letters & Science                                        │
│ ☐ Engineering                                              │
│ ☐ Computer, Data & Information Sciences                    │
│ [Show more...]                                             │
│                                                             │
│ 📚 Department                                               │
│ ☐ Computer Sciences                                        │
│ ☐ Mathematics                                              │
│ ☐ Statistics                                               │
│ [Show more...]                                             │
│                                                             │
│ 📊 Level                                                    │
│ ☐ 100-level (Elementary)                                   │
│ ☐ 200-level (Intermediate)                                 │
│ ☐ 300-level (Advanced)                                     │
│ ☐ 400-level (Advanced)                                     │
│ ☐ 500+ (Graduate)                                          │
│                                                             │
│ 💳 Credits                                                  │
│ Min: [1] ────────── Max: [6]                               │
│                                                             │
│ 📜 Requirements                                             │
│ Gen Ed:                                                     │
│ ☐ Comm A  ☐ Comm B  ☐ Quant A  ☐ Quant B                  │
│                                                             │
│ Breadth:                                                    │
│ ☐ Natural Science  ☐ Social Science  ☐ Humanities         │
│ ☐ Biological Science  ☐ Physical Science                   │
│                                                             │
│ ⭐ Quality                                                  │
│ Min Rating: [A] [B] [C] [D] [F]                            │
│ Min Reviews: [5▼]                                          │
│ Min Avg GPA: [2.0] ──────────── [4.0]                     │
│                                                             │
│ 📋 Sort By: [Relevance ▼]                                  │
│   • Relevance                                              │
│   • Highest Rated                                          │
│   • Highest GPA                                            │
│   • Most Reviews                                           │
│   • Recently Offered                                       │
│   • Course Code (A-Z)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 技术实现

### 1. TypeScript 类型定义
```typescript
// types/filters.ts
export interface CourseFilters {
  // 基本搜索
  search?: string
  
  // 分类筛选
  schools?: string[]        // School IDs
  departments?: string[]    // Department IDs
  levels?: CourseLevelFilter[]
  
  // 学分筛选
  minCredits?: number       // 1-6
  maxCredits?: number       // 1-6
  
  // 要求筛选
  genEds?: string[]         // ["Comm A", "Quant B"]
  breadths?: string[]       // ["Natural Science"]
  
  // 质量筛选
  minRating?: number        // 0-4 (F-A)
  minReviews?: number       // 最少评价数
  minAvgGPA?: number        // 0.0-4.0
  maxAvgGPA?: number        // 0.0-4.0
  
  // 排序
  sortBy?: CourseSortOption
  sortOrder?: 'asc' | 'desc'
  
  // 分页
  page?: number
  limit?: number
}

export type CourseLevelFilter = 
  | '100' 
  | '200' 
  | '300' 
  | '400' 
  | '500+'

export type CourseSortOption =
  | 'relevance'
  | 'rating'
  | 'gpa'
  | 'reviews'
  | 'recent'
  | 'code'
```

### 2. Prisma 查询构建
```typescript
// lib/courseQueries.ts
import { Prisma } from '@prisma/client'
import type { CourseFilters } from '@/types/filters'

export function buildCourseWhereClause(filters: CourseFilters): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = {}
  
  // 搜索
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  
  // 学院
  if (filters.schools && filters.schools.length > 0) {
    where.schoolId = { in: filters.schools }
  }
  
  // Department
  if (filters.departments && filters.departments.length > 0) {
    where.departments = {
      some: {
        departmentId: { in: filters.departments }
      }
    }
  }
  
  // 课程等级
  if (filters.levels && filters.levels.length > 0) {
    const levelConditions = filters.levels.map(level => {
      if (level === '500+') {
        // 研究生课程 >= 500
        return { code: { gte: 'A 500', lte: 'Z 999' } } // 简化示例
      } else {
        // 本科课程范围
        const start = parseInt(level)
        const end = start + 99
        // 需要更复杂的逻辑来匹配课程代码
      }
    })
    // where.OR = levelConditions
  }
  
  // 学分
  if (filters.minCredits) {
    where.credits = { ...where.credits, gte: filters.minCredits }
  }
  if (filters.maxCredits) {
    where.credits = { ...where.credits, lte: filters.maxCredits }
  }
  
  // Gen Ed (JSON 数组查询)
  if (filters.genEds && filters.genEds.length > 0) {
    // 需要使用原生 SQL 或 JSON 操作符
    // PostgreSQL: genEds @> '["Comm A"]'
  }
  
  // 评分
  if (filters.minAvgGPA) {
    where.avgGPA = { ...where.avgGPA, gte: filters.minAvgGPA }
  }
  if (filters.maxAvgGPA) {
    where.avgGPA = { ...where.avgGPA, lte: filters.maxAvgGPA }
  }
  
  // 评价数量
  if (filters.minReviews) {
    where.reviews = {
      _count: { gte: filters.minReviews }
    }
  }
  
  return where
}

export function buildCourseOrderBy(filters: CourseFilters): Prisma.CourseOrderByWithRelationInput {
  const order = filters.sortOrder || 'desc'
  
  switch (filters.sortBy) {
    case 'rating':
      return { avgRating: order }
    case 'gpa':
      return { avgGPA: order }
    case 'reviews':
      return { reviews: { _count: order } }
    case 'recent':
      return { lastOffered: order }
    case 'code':
      return { code: 'asc' }
    default:
      return { code: 'asc' }
  }
}
```

### 3. tRPC API 实现
```typescript
// server/api/routers/course.ts
export const courseRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        schools: z.array(z.string()).optional(),
        departments: z.array(z.string()).optional(),
        levels: z.array(z.enum(['100', '200', '300', '400', '500+'])).optional(),
        minCredits: z.number().min(0).max(6).optional(),
        maxCredits: z.number().min(0).max(6).optional(),
        genEds: z.array(z.string()).optional(),
        breadths: z.array(z.string()).optional(),
        minAvgGPA: z.number().min(0).max(4).optional(),
        maxAvgGPA: z.number().min(0).max(4).optional(),
        minReviews: z.number().min(0).optional(),
        sortBy: z.enum(['relevance', 'rating', 'gpa', 'reviews', 'recent', 'code']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = buildCourseWhereClause(input)
      const orderBy = buildCourseOrderBy(input)
      
      const [courses, total] = await Promise.all([
        ctx.prisma.course.findMany({
          where,
          orderBy,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            school: true,
            departments: {
              include: {
                department: true
              }
            },
            _count: {
              select: { reviews: true }
            }
          }
        }),
        ctx.prisma.course.count({ where })
      ])
      
      return {
        courses,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit)
      }
    }),
  
  // 获取所有 departments
  getDepartments: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.department.findMany({
      include: {
        school: true,
        _count: {
          select: { courses: true }
        }
      },
      orderBy: { name: 'asc' }
    })
  }),
})
```

### 4. 前端 Filter 组件
```typescript
// components/CourseFilters.tsx
'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { CourseFilters } from '@/types/filters'

export function CourseFilters({ 
  onFilterChange 
}: { 
  onFilterChange: (filters: CourseFilters) => void 
}) {
  const [filters, setFilters] = useState<CourseFilters>({})
  
  const { data: schools } = trpc.course.getSchools.useQuery()
  const { data: departments } = trpc.course.getDepartments.useQuery()
  
  const updateFilter = (key: keyof CourseFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  return (
    <div className="space-y-6 p-4 bg-white rounded-lg border">
      {/* School Filter */}
      <div>
        <h3 className="font-semibold mb-2">School</h3>
        <div className="space-y-2">
          {schools?.map(school => (
            <label key={school.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.schools?.includes(school.id)}
                onChange={(e) => {
                  const current = filters.schools || []
                  const updated = e.target.checked
                    ? [...current, school.id]
                    : current.filter(id => id !== school.id)
                  updateFilter('schools', updated)
                }}
              />
              <span className="text-sm">{school.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Department Filter */}
      <div>
        <h3 className="font-semibold mb-2">Department</h3>
        <div className="space-y-2">
          {departments?.slice(0, 10).map(dept => (
            <label key={dept.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.departments?.includes(dept.id)}
                onChange={(e) => {
                  const current = filters.departments || []
                  const updated = e.target.checked
                    ? [...current, dept.id]
                    : current.filter(id => id !== dept.id)
                  updateFilter('departments', updated)
                }}
              />
              <span className="text-sm">
                {dept.name} ({dept._count.courses})
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Level Filter */}
      <div>
        <h3 className="font-semibold mb-2">Course Level</h3>
        <div className="space-y-2">
          {['100', '200', '300', '400', '500+'].map(level => (
            <label key={level} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.levels?.includes(level as any)}
                onChange={(e) => {
                  const current = filters.levels || []
                  const updated = e.target.checked
                    ? [...current, level as any]
                    : current.filter(l => l !== level)
                  updateFilter('levels', updated)
                }}
              />
              <span className="text-sm">{level}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Credits Filter */}
      <div>
        <h3 className="font-semibold mb-2">Credits</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="0"
            max="6"
            value={filters.minCredits || 0}
            onChange={(e) => updateFilter('minCredits', parseInt(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
          />
          <span>to</span>
          <input
            type="number"
            min="0"
            max="6"
            value={filters.maxCredits || 6}
            onChange={(e) => updateFilter('maxCredits', parseInt(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
          />
        </div>
      </div>
      
      {/* Sort Options */}
      <div>
        <h3 className="font-semibold mb-2">Sort By</h3>
        <select
          value={filters.sortBy || 'code'}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="code">Course Code</option>
          <option value="rating">Highest Rated</option>
          <option value="gpa">Highest GPA</option>
          <option value="reviews">Most Reviews</option>
          <option value="recent">Recently Offered</option>
        </select>
      </div>
      
      {/* Clear All */}
      <button
        onClick={() => {
          setFilters({})
          onFilterChange({})
        }}
        className="w-full px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border rounded"
      >
        Clear All Filters
      </button>
    </div>
  )
}
```

---

## 📅 实施计划

### Phase 1: 数据准备 (1-2 天)
- [ ] 导入 Department 数据
- [ ] 建立 Course-Department 关系
- [ ] 将 breadths/genEds 从 JSON string 转为 PostgreSQL 数组

### Phase 2: 后端 API (2-3 天)
- [ ] 实现 `buildCourseWhereClause`
- [ ] 实现 `buildCourseOrderBy`
- [ ] 更新 tRPC `course.list` 支持所有筛选选项
- [ ] 添加 `course.getDepartments` API

### Phase 3: 前端 UI (3-4 天)
- [ ] 创建 `CourseFilters` 组件
- [ ] 集成到课程列表页
- [ ] 添加 URL 参数同步（可分享链接）
- [ ] 添加加载状态和错误处理

### Phase 4: 优化 (1-2 天)
- [ ] 添加筛选结果缓存
- [ ] 优化数据库查询性能
- [ ] 添加筛选器折叠/展开
- [ ] 移动端响应式优化

---

## 🎯 成功指标

- [ ] 支持 10+ 种筛选维度
- [ ] 筛选响应时间 < 200ms
- [ ] 筛选结果准确率 100%
- [ ] 移动端体验良好
- [ ] URL 可分享（包含筛选状态）

---

**下一步**: 先导入 Department 数据，然后实现 tRPC API
