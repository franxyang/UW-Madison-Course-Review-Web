# MadSpace Future Roadmap

**Last Updated**: 2026-02-07 03:30 CST  
**Current Status**: See [PROGRESS.md](../PROGRESS.md) for current completion status

---

## 🎯 Project Vision

A modern course review platform designed for UW-Madison students to make informed course selection decisions. MadSpace combines grade distributions, student reviews, and smart filtering to help Badgers navigate 10,000+ courses.

---

## 🚀 Deployment Strategy (2026-02-07 决议)

### 架构
```
GitHub (private repo)
  │
  ├── main 分支 ──→ Vercel 生产环境 (零停机原子部署)
  ├── dev 分支  ──→ Vercel 预览环境 (开发测试)
  └── feature/* ──→ PR 预览链接 (功能测试)
```

### 数据库分支
- **生产 DB**: Neon main branch (仅 main 分支部署写入)
- **开发 DB**: Neon dev branch (dev/feature 分支使用)
- **迁移策略**: Prisma migrate 在 Vercel 构建时自动执行

### 上线流程
1. dev 分支开发 + 测试
2. 确认无误后 merge 到 main
3. Vercel 自动构建部署 (3-5秒流量切换, 用户无感)
4. 构建失败 → 旧版本继续服务

### 成本 (初期全免费层)
| 服务 | 免费额度 | 状态 |
|------|---------|------|
| Vercel | 100GB 带宽/月 | ✅ 够用 |
| Neon PostgreSQL | 0.5GB 存储 + 分支 | ✅ 够用 |
| Upstash Redis | 10K cmd/天 | ✅ 够用 |

### GitHub 仓库
- 上线后转为 **private repo** (Vercel 通过 GitHub App 授权, 不受影响)
- 代码整理完成后可考虑重新开源

---

## 🔐 Phase 4: Admin Portal (上线前必需)

**优先级**: 🚨 **高** - 内容治理是社区平台的生命线  
**原因**: 没有审核系统就上线 = 垃圾内容泛滥 + 法律风险  
**执行范围**: 4A + 4B + 4C (4D 数据管理工具后置)

### Schema 变更

```prisma
// 1. 扩展角色
enum UserRole { STUDENT, MODERATOR, ADMIN }

// 2. 审计日志
model AuditLog {
  id, action, targetType, targetId, details (Json), actorId, createdAt
  @@index([actorId]) @@index([targetType, targetId]) @@index([createdAt])
}

// 3. 封禁记录
model UserBan {
  id, userId, reason, bannedBy, expiresAt?, active, createdAt
  @@index([userId, active])
}

// 4. Report 扩展字段
//    resolvedBy, resolvedAt, resolution ("approved"|"rejected"|"escalated")
```

### 4A: 内容审核系统 (P0) — 3-4 天
> adminProcedure middleware + 举报队列 + Review 管理

- [ ] **adminProcedure** — tRPC middleware (role === ADMIN || MODERATOR)
- [ ] **Admin Layout** — `/admin/*` 路由 + 侧边导航 + 权限守卫
- [ ] **举报队列** `/admin/reports`
  - 待处理举报列表 (排序: 时间/举报数)
  - 举报详情 (原因、举报者、原文预览)
  - 快速操作: 批准删除 / 驳回 / 标记
  - 批量处理 (全选/多选操作)
- [ ] **Review 管理** `/admin/reviews`
  - 搜索/筛选 (课程、作者、时间、评分)
  - 删除 + 级联清理 (votes/comments/reports)
  - 编辑 (修正不当内容, 保留原始记录)
- [ ] **用户举报历史**
  - 按用户聚合举报记录
  - 恶意举报者识别 (举报驳回率)

### 4B: 用户管理系统 (P1) — 2-3 天
> 封禁 + 角色 + 用户画像

- [ ] **用户列表** `/admin/users`
  - 搜索 (nickname/email)、筛选 (角色/状态)、排序 (注册时间/贡献度)
  - 快速标记问题用户
- [ ] **封禁系统**
  - 临时封禁 (自选时长) / 永久封禁
  - 封禁原因 + 历史日志
  - 自动解封 (expiresAt 检查)
  - 被封用户登录时拦截 + 提示
- [ ] **角色管理**
  - STUDENT → MODERATOR → ADMIN 三级
  - Moderator: 可审核举报, 不可封人/改角色
  - Admin: 完全权限
- [ ] **用户详情页** `/admin/users/[id]`
  - 用户画像: reviews/comments/votes/reports 汇总
  - 行为时间线
  - 封禁/角色操作入口

### 4C: 系统监控 (P2) — 2 天
> Dashboard + 操作日志

- [ ] **AuditLog 自动记录** — 所有 admin 操作写入审计日志
- [ ] **Dashboard** `/admin`
  - 今日统计: 新用户 / 新 reviews / 待处理举报
  - 7 天趋势迷你图
  - 快捷入口 (待处理举报数 badge)
- [ ] **操作日志** `/admin/logs`
  - Admin 操作历史 (谁在什么时候做了什么)
  - 按操作类型/操作者筛选
  - 操作详情展开 (删除了什么内容等)

### 4D: 数据管理工具 (P3) — 上线后迭代
> 课程导入 / 学期同步 / Instructor 管理 (暂不实施)

- [ ] 课程批量导入 (CSV)
- [ ] 学期同步 (UW Course Guide API)
- [ ] Instructor 信息批量编辑

---

## 🚀 Phase 5: Advanced Features (增值功能)

**优先级**: ⭐ **中** - 需要足够的数据量和用户基础才有意义  
**前置条件**: 至少 500+ reviews, 100+ 活跃用户

### 1. AI-Powered Features
- [ ] **AI Review Summaries** - Auto-generate course summaries from reviews
  - 需要: 至少 10+ reviews/course
  - 技术栈: OpenAI API / Claude API
  - 成本考虑: Rate limiting + 缓存
- [ ] **Smart Course Recommendations** - Based on major, interests, and history
  - 需要: 用户历史数据 + collaborative filtering
  - 冷启动策略: 基于 major + level 的规则推荐
- [ ] **Schedule Conflict Detection** - Integrate with timetable planning
  - 需要: Course schedule data
  - 对接 UW Course Search API
- [ ] **Credit Planning Assistant** - Track graduation requirements
  - 需要: Major requirement data
  - Breadth/Depth 追踪

### 2. Community Features
- [ ] **User Follow System** - Follow reviewers you trust
  - Feed 流生成
  - 通知集成
- [ ] **Study Group Creation** - Connect with classmates
  - 匹配算法 (same courses)
  - Chat 功能
- [ ] **Course Discussion Forums** - Threaded discussions per course
  - 嵌套评论支持
  - 实时更新 (WebSocket)
- [ ] **Direct Messaging** - Private communication
  - End-to-end encryption 考虑
  - 垃圾消息过滤

### 3. Data Analytics (用户端)
- [ ] **Course Popularity Rankings** - Trending courses
  - 基于 pageviews + reviews + saves
  - 周/月/学期榜单
- [ ] **Instructor Rating Rankings** - Top-rated instructors
  - 综合评分算法
  - 最低 review 数门槛
- [ ] **Semester Trend Analysis** - Grade trends over time
  - 历史 GPA 曲线图
  - Difficulty 趋势
- [ ] **Major Course Statistics** - Department-level insights
  - 各系热门课程
  - 平均难度分布

### 4. Notification System
- [ ] **New Review Notifications** - For saved courses
  - Email + Push
  - 订阅偏好设置
- [ ] **Comment Reply Notifications** - Engagement alerts
  - 实时 + 每日摘要
- [ ] **Course Update Notifications** - Syllabus/instructor changes
  - 对接官方 API 检测变更
- [ ] **Email Subscription** - Weekly digests
  - 个性化推荐课程
  - 社区动态摘要

---

## 📋 Phase 优先级总结

| Phase | 名称 | 优先级 | 预计工期 | 前置条件 |
|-------|------|--------|----------|----------|
| 3 | UX Optimization | 🚨 高 | 1-2 周 | Phase 2 完成 |
| **部署** | **Vercel + CI/CD** | 🚨 **高** | **0.5 天** | **Phase 3 基本完成** |
| 4A | Admin: 内容审核 | 🚨 高 | 3-4 天 | 部署完成 |
| 4B | Admin: 用户管理 | 🚨 高 | 2-3 天 | 4A 完成 |
| 4C | Admin: 系统监控 | ⚠️ 建议 | 2 天 | 4B 完成 |
| 4D | Admin: 数据管理 | 💡 后置 | 3-5 天 | 上线后迭代 |
| 5 | Advanced Features | ⭐ 中 | 1-2 月 | 500+ reviews, 100+ 活跃用户 |
| 6 | GPA Prediction | 💡 低 | 探索阶段 | 大量历史数据 |

**上线时间线 (2026-02-07 决议)**:
- 目标: **~12 天后上线** (Phase 3 收尾 + 部署 + 4A-4C)
- 策略: **边开发边上线** — 先部署现有版本, Admin 功能逐步 merge
- GitHub: 上线后转 **private repo**, 整理后可重新开源
- 部署后开发流程: dev 分支开发 → merge main → Vercel 自动零停机部署

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
