# WiscFlow 项目文档

**最后更新**: 2026-02-03

本文件夹包含 WiscFlow 项目的所有设计、规划和迁移文档。

---

## 📁 文档分类

### 🎯 产品设计文档 (✅ 应上传 GitHub)

| 文件 | 描述 | GitHub |
|------|------|--------|
| `wiscflow完整设计方案.md` | 完整产品设计方案（竞品分析、功能设计、UI原型） | ✅ 推荐上传 |
| `PROJECT_ROADMAP.md` | 项目路线图和功能规划 | ✅ 推荐上传 |

**为什么上传**:
- 帮助贡献者理解产品愿景
- 方便团队协作
- 展示项目规划能力
- **不包含敏感信息**

---

### 🏗️ 技术架构文档 (✅ 应上传 GitHub)

| 文件 | 描述 | GitHub |
|------|------|--------|
| `TECH_UPGRADE_PLAN.md` | 技术架构升级计划（Monorepo + tRPC + Redis） | ✅ 推荐上传 |
| `EVALUATION_REPORT.md` | 设计方案 vs 现有代码对比评估 | ✅ 推荐上传 |
| `SUPABASE_VS_NEON.md` | PostgreSQL 服务商对比分析 | ✅ 推荐上传 |

**为什么上传**:
- 记录技术决策过程
- 帮助理解架构选型
- 其他开发者可以参考
- **不包含敏感信息**

---

### 🔄 迁移文档 (⚠️ 部分上传)

| 文件 | 描述 | GitHub |
|------|------|--------|
| `MIGRATION_CHECKLIST.md` | PostgreSQL + tRPC 迁移执行清单 | ✅ 推荐上传 |
| `MIGRATION_COMPLETED.md` | 迁移完成报告 | ⚠️ **需要脱敏** |

**MIGRATION_COMPLETED.md 需要移除**:
- ❌ 数据库连接字符串
- ❌ Neon 项目具体信息
- ✅ 保留迁移步骤和经验总结

**脱敏后可上传**，作为迁移经验分享。

---

### 📊 测试和开发文档 (❌ 不建议上传)

| 文件 | 描述 | GitHub |
|------|------|--------|
| `../TEST_REPORT.md` | 测试报告 | ❌ 本地使用 |
| `../DEVELOPMENT_PLAN.md` | 开发计划 | ❌ 过时 |
| `../OAUTH_SETUP.md` | OAuth 配置说明 | ⚠️ **包含敏感信息** |

**为什么不上传**:
- 包含具体配置细节
- 可能包含敏感信息（Client ID/Secret）
- 临时性文档，不具参考价值

---

## 🔐 敏感信息检查清单

上传到 GitHub 前，确保移除：

### ❌ 绝对不能上传的信息
```bash
# 数据库连接字符串
DATABASE_URL="postgresql://..."

# API 密钥
GOOGLE_CLIENT_SECRET=GOCSPX-...
AUTH_SECRET=...

# 具体的服务器地址
ep-jolly-haze-ae0kcj2h-pooler.c-2.us-east-2.aws.neon.tech
```

### ✅ 可以上传的信息
```bash
# 泛化的示例
DATABASE_URL="postgresql://user:password@hostname/database"

# 架构图、流程图
# 技术选型理由
# 代码结构
```

---

## 📋 推荐的 GitHub 文档结构

```
wiscflow/
├── README.md                    # 项目介绍
├── docs/
│   ├── README.md               # 本文件
│   ├── DESIGN.md               # 产品设计 (wiscflow完整设计方案.md 重命名)
│   ├── ARCHITECTURE.md         # 技术架构 (TECH_UPGRADE_PLAN.md 精简版)
│   ├── ROADMAP.md              # 路线图 (PROJECT_ROADMAP.md)
│   └── MIGRATION_GUIDE.md      # 迁移指南 (MIGRATION_CHECKLIST.md 脱敏版)
└── .gitignore                  # 确保 .env 不上传
```

---

## 🚀 上传前检查

### 1. 检查 .gitignore
```bash
# 确保这些文件在 .gitignore 中
.env
.env.local
.env*.local
*.db
*.log
node_modules/
.next/
```

### 2. 搜索敏感信息
```bash
# 在所有 .md 文件中搜索敏感信息
grep -r "postgresql://" docs/
grep -r "GOCSPX-" docs/
grep -r "npg_" docs/  # Neon 密码前缀
grep -r "ep-.*\.neon\.tech" docs/
```

### 3. 脱敏示例

**之前（包含敏感信息）**:
```md
连接字符串：
postgresql://neondb_owner:npg_jWYRpew54frP@ep-jolly-haze-ae0kcj2h-pooler.c-2.us-east-2.aws.neon.tech/neondb
```

**之后（脱敏）**:
```md
连接字符串格式：
postgresql://[username]:[password]@[host]/[database]?sslmode=require

示例：
postgresql://user:pass@your-project.region.aws.neon.tech/dbname
```

---

## 📝 建议的操作流程

### Step 1: 创建标准文档
```bash
# 在 docs/ 中创建标准化文档
cp wiscflow完整设计方案.md DESIGN.md
cp PROJECT_ROADMAP.md ROADMAP.md
# ... 根据需要重命名和精简
```

### Step 2: 脱敏检查
```bash
# 运行脱敏检查脚本（待创建）
npm run docs:check-sensitive
```

### Step 3: 更新主 README
```bash
# 在项目根目录创建完善的 README.md
# 包含：
# - 项目介绍
# - 快速开始
# - 技术栈
# - 文档链接
```

### Step 4: 提交到 GitHub
```bash
git add docs/
git add README.md
git commit -m "docs: add project documentation"
git push
```

---

## 🎓 文档编写最佳实践

### 1. 使用相对路径
```markdown
# ❌ 不要用绝对路径
/Users/yifanyang/Desktop/wiscflow/...

# ✅ 使用相对路径
../scripts/seedCourses.ts
```

### 2. 移除本地信息
```markdown
# ❌ 不要包含本地目录
Working directory: /Users/yifanyang/Desktop/wiscflow

# ✅ 使用泛化路径
Working directory: <project-root>
```

### 3. 使用占位符
```markdown
# ❌ 不要暴露真实凭证
GOOGLE_CLIENT_ID=843088484088-xxx

# ✅ 使用占位符
GOOGLE_CLIENT_ID=your-client-id
```

---

## 📚 文档维护

### 定期更新
- 功能完成后更新 ROADMAP.md
- 架构变更后更新 ARCHITECTURE.md
- 迁移完成后更新 MIGRATION_GUIDE.md

### 归档旧文档
```bash
# 将过时文档移到 archive/
mkdir -p docs/archive
mv docs/OLD_PLAN.md docs/archive/
```

### 版本控制
```markdown
# 在文档顶部标注版本
**版本**: v1.0.0
**最后更新**: 2026-02-03
**状态**: ✅ 当前 / 🔄 进行中 / 📦 已归档
```

---

## ✅ 推荐上传到 GitHub 的文档

最终推荐上传：

1. ✅ **DESIGN.md** - 产品设计（脱敏后的 wiscflow完整设计方案.md）
2. ✅ **ROADMAP.md** - 项目路线图
3. ✅ **ARCHITECTURE.md** - 技术架构（精简版 TECH_UPGRADE_PLAN.md）
4. ✅ **MIGRATION_GUIDE.md** - 迁移指南（脱敏版）
5. ✅ **CONTRIBUTING.md** - 贡献指南（待创建）
6. ✅ **README.md** - 项目主文档（待完善）

---

**下一步**: 运行脱敏检查，然后上传到 GitHub！
