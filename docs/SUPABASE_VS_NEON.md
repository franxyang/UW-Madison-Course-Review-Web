# Supabase vs Neon - PostgreSQL 服务对比

**更新时间**: 2026-02-03

---

## 📊 快速对比表

| 特性 | **Supabase** | **Neon** |
|------|-------------|----------|
| **免费额度** | 500MB 存储 | 0.5GB 存储 |
| | 2GB 带宽/月 | 无限流量 ✅ |
| | 50,000 月活用户 | 无限请求 ✅ |
| **启动速度** | 常驻数据库（快） | Serverless（冷启动） |
| **冷启动时间** | 无 ✅ | ~1-2秒（首次请求） |
| **附加功能** | Auth, Storage, Realtime ✅ | 仅数据库 |
| **价格（付费）** | $25/月起 | $19/月起 ✅ |
| **自动扩展** | 需升级套餐 | Serverless 自动 ✅ |
| **Branching** | ❌ | ✅ Git-like 分支 |
| **适合场景** | 全栈应用 | 纯数据库 |

---

## 🎯 详细对比

### 1. Supabase 优势

#### ✅ 一站式后端服务
```typescript
// Supabase 提供的额外功能：
- 🔐 Authentication (内置 Auth)
- 📦 Storage (文件存储)
- 🔄 Realtime (实时订阅)
- 🛡️ Row Level Security (行级安全)
- 📊 Dashboard (可视化管理)
```

**示例 - 文件上传**:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// 上传课程资料
await supabase.storage
  .from('course-materials')
  .upload('CS577/notes.pdf', file)
```

**示例 - Realtime**:
```typescript
// 实时监听新评价
supabase
  .channel('reviews')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'Review' },
    (payload) => {
      console.log('New review!', payload)
      // 更新 UI
    }
  )
  .subscribe()
```

#### ✅ 无冷启动
- 数据库常驻运行
- 响应时间稳定
- 适合高频访问

#### ✅ 更大的免费存储
- 500MB vs 0.5GB (Neon)
- 如果数据量大，Supabase 更合适

---

### 2. Neon 优势

#### ✅ Serverless 架构
```
优点：
- 自动休眠（不用时不计费）
- 自动扩展（流量大时自动加资源）
- 无限流量（Supabase 免费版只有 2GB/月）
```

#### ✅ Branching（数据库分支）
```bash
# 类似 Git 分支，可以为开发/测试创建数据库副本
neon branches create --name dev
neon branches create --name staging

# 每个分支独立，互不影响
DATABASE_URL_DEV="postgres://...@dev-branch"
DATABASE_URL_STAGING="postgres://...@staging-branch"
```

**用途**:
- 测试迁移不影响生产数据
- 为每个 PR 创建临时数据库
- 开发环境完全隔离

#### ✅ 更便宜的付费计划
- Neon Pro: $19/月
- Supabase Pro: $25/月

#### ✅ 更好的 Vercel 集成
```bash
# Vercel CLI 内置支持
vercel env add DATABASE_URL
# 自动从 Neon 拉取连接字符串
```

---

### 3. 冷启动问题（Neon 的主要缺点）

**什么是冷启动？**
```
场景：数据库闲置 5 分钟后会休眠
用户访问 → 数据库唤醒 → 等待 1-2 秒 → 返回数据
               ↑ 这就是冷启动延迟
```

**影响**:
- 首次请求慢（~1-2 秒）
- 后续请求正常（~50ms）
- 如果网站流量低，经常会遇到

**解决方案**:
```typescript
// 方案 1: Keep-alive（定时 ping）
// Vercel Cron Job 每 4 分钟 ping 一次
export async function GET() {
  await prisma.$queryRaw`SELECT 1`
  return Response.json({ ok: true })
}

// 方案 2: 付费升级 Neon Pro
// - 永不休眠
// - 无冷启动
```

---

### 4. 存储空间对比

**Supabase 免费版**: 500MB
```
估算容量：
- 10,000 门课程 × 2KB = 20MB
- 50,000 条评价 × 1KB = 50MB
- 总计 ~100MB
✅ 足够用很久
```

**Neon 免费版**: 0.5GB (512MB)
```
与 Supabase 差不多，但：
- Neon 压缩更好
- 实际可用空间类似
✅ 也够用
```

---

### 5. 流量限制对比

**Supabase 免费版**: 2GB/月
```
估算流量：
- 10,000 次页面访问 × 100KB = 1GB
- 如果网站火了，可能不够
⚠️ 超出后会被限流
```

**Neon 免费版**: 无限流量 ✅
```
不限制带宽使用
适合流量不稳定的新项目
```

---

## 🎯 推荐方案

### 推荐 Neon，如果你：
- ✅ **只需要数据库**（不需要 Auth/Storage）
- ✅ 使用 Next.js + tRPC（已有认证方案）
- ✅ 预算有限（付费后更便宜）
- ✅ 想要 Branching 功能（开发/测试分支）
- ✅ 流量可能会大（无限流量）

### 推荐 Supabase，如果你：
- ✅ 需要**文件存储**（课程资料、头像）
- ✅ 需要**内置认证**（省去 NextAuth 配置）
- ✅ 需要**实时功能**（评价实时更新）
- ✅ 希望**无冷启动**（稳定响应时间）
- ✅ 想要一站式后端

---

## 💡 针对 MadSpace 的建议

### 当前需求分析
```typescript
MadSpace 需要的功能：
✅ PostgreSQL 数据库 - 都有
✅ 全文搜索 - 都支持
✅ 认证系统 - 已有 NextAuth（不需要 Supabase Auth）
❓ 文件存储 - 目前没用到（评价中的 resourceLink 是外部链接）
❓ 实时功能 - 不是必须（可以用 React Query 轮询）
```

### 建议：**选择 Neon** 🎯

**理由**:
1. **更符合当前架构**
   - 你已经用 NextAuth.js 做认证
   - 不需要 Supabase 的额外功能
   - tRPC + Prisma 已经够用

2. **成本更低**
   - 免费版更慷慨（无限流量）
   - 付费后更便宜（$19 vs $25）

3. **开发体验更好**
   - Branching 功能很实用
   - 与 Vercel 深度集成
   - Prisma 支持更好

4. **冷启动可以解决**
   - 用 Vercel Cron 定时 ping
   - 或者等流量大了付费升级

---

## 🚀 快速决策流程图

```
需要文件存储（课程资料上传）？
├─ 是 → Supabase
└─ 否 ↓

需要实时功能（评价实时推送）？
├─ 是 → Supabase
└─ 否 ↓

网站会有持续流量（不会长时间闲置）？
├─ 否（测试阶段）→ Neon
└─ 是 ↓

预算充足（愿意付费避免冷启动）？
├─ 是 → Supabase 或 Neon Pro
└─ 否 → Neon 免费版 + Keep-alive
```

---

## 📋 实际设置对比

### Neon 设置（5 分钟）
```bash
1. 访问 https://console.neon.tech
2. GitHub 登录
3. 创建项目 "madspace"
4. 复制连接字符串
5. 完成 ✅

# .env.local
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Supabase 设置（5 分钟）
```bash
1. 访问 https://supabase.com
2. GitHub 登录
3. 创建项目 "madspace"
4. 等待 1-2 分钟（创建数据库）
5. 复制连接字符串
6. 完成 ✅

# .env.local
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

**设置难度**: 差不多 ⚖️

---

## 🎓 最终建议

### 阶段 1: 现在 → 3 个月
**选择 Neon 免费版**
- 开发阶段，流量小
- 冷启动影响不大
- 省钱 💰

### 阶段 2: 3-6 个月（如果用户增长）
**评估是否需要升级**:
```typescript
if (月活用户 > 1000 && 经常遇到冷启动) {
  选择：
  - Neon Pro ($19/月) - 无冷启动
  或
  - Supabase Pro ($25/月) - 更多功能
}
```

### 阶段 3: 6 个月+（如果需要新功能）
**如果需要文件上传**:
```typescript
if (需要上传课程笔记/作业样本) {
  // 方案 A: 迁移到 Supabase（一站式）
  // 方案 B: Neon + Cloudflare R2（分离式，更灵活）
}
```

---

## ✅ 我的最终推荐

**为 MadSpace 选择 Neon**，因为：

1. ✅ 你已经有 NextAuth（不需要 Supabase Auth）
2. ✅ 暂时不需要文件存储
3. ✅ Branching 对开发很有用
4. ✅ 无限流量（Supabase 只有 2GB/月）
5. ✅ 更便宜
6. ⚠️ 冷启动可以接受（开发阶段）

**如果你需要：**
- 文件上传（课程笔记）→ 考虑 Supabase
- 实时评价推送 → 考虑 Supabase
- 无冷启动 → 等流量大了再付费

---

**下一步**: 告诉我你的选择，我们立即开始迁移！🚀
