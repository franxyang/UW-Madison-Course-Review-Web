# MadSpace Future Roadmap

**Last Updated**: 2026-02-07  
**Current Status**: See [PROGRESS.md](../PROGRESS.md) for current completion status

---

## 🎯 Project Vision

A modern course review platform designed for UW-Madison students to make informed course selection decisions. MadSpace combines grade distributions, student reviews, and smart filtering to help Badgers navigate 10,000+ courses.

---

## 🔐 Phase 4: Admin Portal (上线前必需)

**优先级**: 🚨 **高** - 内容治理是社区平台的生命线  
**原因**: 没有审核系统就上线 = 垃圾内容泛滥 + 法律风险

### 1. 内容审核系统 (P0)
- [ ] **Review 举报队列** - 显示所有待处理举报
  - 举报详情展示 (原因、举报者、时间)
  - 快速操作 (批准删除/驳回/标记)
  - 批量处理功能
- [ ] **Review 管理** - Admin 直接管理所有 review
  - 搜索/筛选功能
  - 删除 + 级联清理 (votes/comments)
  - 编辑功能 (修正不当内容)
- [ ] **用户举报历史** - 查看用户举报记录
  - 识别恶意举报者
  - 举报准确率统计

### 2. 用户管理系统 (P1)
- [ ] **用户列表** - 搜索、筛选、排序
  - 按贡献度、注册时间、活跃度
  - 标记问题用户
- [ ] **封禁系统** - 临时/永久封禁
  - 封禁原因记录
  - 自动解封定时器
  - 封禁历史日志
- [ ] **权限管理** - 角色系统 (Admin/Moderator/User)
  - 细粒度权限控制
  - Moderator 审核权限下放
- [ ] **用户详情页** - 完整用户画像
  - 所有 reviews/comments/votes
  - 行为时间线
  - 违规记录

### 3. 系统监控 (P2)
- [ ] **活动日志** - 关键操作审计
  - Admin 操作记录
  - 用户异常行为检测
  - 登录/IP 追踪
- [ ] **实时统计** - Dashboard 总览
  - 今日新增 users/reviews/reports
  - 待处理举报数量
  - 系统健康指标
- [ ] **数据分析** - 趋势图表
  - 用户增长曲线
  - Review 提交趋势
  - 热门课程 Top 10

### 4. 数据管理工具 (P3)
- [ ] **课程批量导入** - CSV 上传
  - 字段映射界面
  - 重复检测 + 合并策略
  - 导入预览 + 回滚
- [ ] **学期同步** - 自动拉取新学期课程
  - 对接 UW Course Guide API
  - Diff 检测 + 变更确认
  - 定时任务配置
- [ ] **Instructor 信息更新** - 批量编辑
  - 别名管理
  - 头像上传
  - 个人主页链接

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
| 4 | **Admin Portal** | 🚨 **高** | **2-3 周** | **Phase 3 完成** |
| 5 | Advanced Features | ⭐ 中 | 1-2 月 | 500+ reviews, 100+ 活跃用户 |
| 6 | GPA Prediction | 💡 低 | 探索阶段 | 大量历史数据 |

**Phase 调整说明 (2026-02-07)**:
- Phase 4 和 5 **互换顺序**
- **原因**: Admin Portal 是上线前必需功能，Advanced Features 需要数据基础
- **影响**: 更合理的开发路径，降低上线风险

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
