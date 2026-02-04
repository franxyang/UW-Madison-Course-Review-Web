# WiscFlow

> 威斯康星大学麦迪逊分校课程评价平台

**当前版本**: 0.2.0-dev  
**状态**: 🚧 开发中  
**最后更新**: 2026-02-03

---

## 🎯 项目简介

WiscFlow 是一个专为 UW-Madison 学生设计的现代化课程评价平台，帮助学生做出更明智的选课决策。

### ✨ 核心功能

- 📚 **课程浏览** - 浏览 4,700+ 门课程，按学院、系筛选
- 🔍 **智能搜索** - 快速找到你需要的课程
- ⭐ **课程评价** - 查看和分享真实的学生评价
- 📊 **成绩分布** - 查看历史成绩数据和 GPA 趋势
- 🗺️ **先修关系** - 可视化课程依赖关系
- 👥 **社区互动** - 点赞、评论、讨论

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL（或使用 Neon）
- Google OAuth 应用（用于登录）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/wiscflow.git
   cd wiscflow
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   ```
   
   编辑 `.env.local` 填入：
   - `DATABASE_URL` - PostgreSQL 连接字符串
   - `GOOGLE_CLIENT_ID` - Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
   - `AUTH_SECRET` - NextAuth 密钥（运行 `openssl rand -base64 32` 生成）

4. **数据库设置**
   ```bash
   # 运行 Prisma migrations
   npx prisma migrate dev
   
   # 导入学院数据
   npx tsx scripts/seedSchools.ts
   
   # 导入课程数据
   npx tsx scripts/seedCourses.ts
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   访问 http://localhost:3000

---

## 🛠️ 技术栈

### 核心框架
- **[Next.js 15](https://nextjs.org/)** - React 框架
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全
- **[Tailwind CSS](https://tailwindcss.com/)** - 样式

### 数据库和 ORM
- **[PostgreSQL](https://www.postgresql.org/)** - 关系型数据库
- **[Prisma](https://www.prisma.io/)** - 现代 ORM
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL

### 认证
- **[NextAuth.js](https://next-auth.js.org/)** - 认证解决方案
- **Google OAuth** - 第三方登录

### 计划中
- **[tRPC](https://trpc.io/)** - 端到端类型安全 API ⏳
- **[Redis](https://redis.io/)** - 缓存层 ⏳
- **[React Query](https://tanstack.com/query/)** - 数据获取和缓存 ⏳

---

## 📁 项目结构

```
wiscflow/
├── app/                    # Next.js App Router
│   ├── courses/           # 课程相关页面
│   ├── auth/              # 认证页面
│   ├── api/               # API Routes
│   └── ...
├── components/            # React 组件
├── lib/                   # 工具函数
├── prisma/               # Prisma schema 和 migrations
├── scripts/              # 数据导入脚本
├── docs/                 # 项目文档
│   ├── wiscflow完整设计方案.md
│   ├── TECH_UPGRADE_PLAN.md
│   └── ...
├── .ai-context/          # AI 上下文（开发辅助）
├── PROGRESS.md           # 开发进度追踪
└── CHANGELOG.md          # 变更日志
```

---

## 📊 数据统计

- **学院**: 23 所
- **课程**: 4,787 门
- **Departments**: 待导入
- **代码行数**: ~8,000 lines
- **组件数**: ~15 components

---

## 🗺️ 开发路线图

### ✅ Phase 1: 基础架构 (40% 完成)
- [x] Next.js + TypeScript 项目搭建
- [x] PostgreSQL 数据库迁移
- [x] NextAuth.js 认证系统
- [x] 基础课程浏览功能
- [x] 评价系统
- [ ] tRPC 集成 ⏳
- [ ] 全文搜索 ⏳
- [ ] Redis 缓存 ⏳

### 🔜 Phase 2: 核心功能完善 (30% 完成)
- [x] 基础搜索和筛选
- [ ] 高级筛选（Department, Level, Credits, Gen Ed, Breadth）
- [ ] 教师页面
- [ ] 用户中心
- [ ] 评价管理（编辑、删除、举报）

### 📅 Phase 3: 高级功能
- [ ] AI 课程推荐
- [ ] 选课规划器
- [ ] 先修关系可视化图谱
- [ ] 社区功能（学习小组、讨论区）

### 🚀 Phase 4: 优化部署
- [ ] 性能优化
- [ ] SEO 优化
- [ ] Vercel 部署
- [ ] 监控和分析

详见 [`PROGRESS.md`](./PROGRESS.md) 和 [`docs/PROJECT_ROADMAP.md`](./docs/PROJECT_ROADMAP.md)

---

## 📚 文档

- **[完整设计方案](./docs/wiscflow完整设计方案.md)** - 产品设计和竞品分析
- **[技术架构升级计划](./docs/TECH_UPGRADE_PLAN.md)** - 技术选型和架构设计
- **[迁移指南](./docs/MIGRATION_CHECKLIST.md)** - PostgreSQL + tRPC 迁移步骤
- **[Filter 实现计划](./docs/FILTER_IMPLEMENTATION.md)** - 筛选功能设计
- **[开发进度](./PROGRESS.md)** - 当前进度和待办事项
- **[变更日志](./CHANGELOG.md)** - 版本历史

---

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### Commit Message 规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档变更
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建工具或辅助工具的变动

**示例**:
```bash
feat(filter): add department filter support

- Add Department model
- Implement multi-select department filter
- Update UI with department chips
```

### 开发规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 编写有意义的 commit message
- 更新相关文档（PROGRESS.md, CHANGELOG.md）
- 添加必要的测试

---

## 🔐 隐私和安全

- ✅ 所有用户数据加密存储
- ✅ 使用 UW-Madison 邮箱验证 (@wisc.edu)
- ✅ 评价系统支持匿名
- ✅ 遵守 FERPA 隐私法规
- ✅ 定期安全审计

**注意**: 本项目是学生自发项目，与 UW-Madison 官方无关。

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 团队

- **Franx** ([@franxyixx](https://github.com/franxyixx)) - 项目负责人
- **Claude** (Clawdbot) - AI 开发助手

---

## 📞 联系方式

- **Discord**: [WiscFlow 开发频道](#)
- **Email**: [your-email@wisc.edu]
- **Issues**: [GitHub Issues](https://github.com/yourusername/wiscflow/issues)

---

## 🙏 致谢

- [UW-Madison](https://www.wisc.edu/) - 数据来源
- [MadGrades](https://madgrades.com/) - 成绩数据参考
- [Rate My Professors](https://www.ratemyprofessors.com/) - 灵感来源
- 所有贡献者和测试用户

---

## ⭐ Star History

如果这个项目对你有帮助，请给我们一个 Star！⭐

---

**Built with ❤️ for UW-Madison students by students**

---

## 🚧 项目状态

- **当前版本**: 0.2.0-dev
- **开发阶段**: Alpha
- **预计 Beta 发布**: 2026年3月
- **预计正式发布**: 2026年4月

### 最近更新
- 2026-02-03: PostgreSQL 迁移完成，Department 模型添加
- 2026-02-01: 项目初始化，基础功能实现

查看完整更新日志: [CHANGELOG.md](./CHANGELOG.md)
