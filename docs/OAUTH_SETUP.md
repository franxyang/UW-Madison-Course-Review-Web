# OAuth Setup Guide - 修复 "Can't Sign Up" 问题

## 🔴 **当前问题**

OAuth登录按钮点击后返回 **400 Bad Request**，原因是 **Google Cloud Console 中的 Redirect URI 与当前端口不匹配**。

---

## ✅ **解决方案**

### **步骤 1: 访问 Google Cloud Console**

1. 打开 https://console.cloud.google.com/
2. 选择项目 **MadSpace**
3. 侧边栏：**APIs & Services** → **Credentials**

---

### **步骤 2: 编辑 OAuth 客户端**

1. 找到 **MadSpace Web Client** OAuth 2.0 客户端
2. 点击编辑按钮（✏️ 图标）

---

### **步骤 3: 添加新的 Redirect URI**

在 **Authorized redirect URIs** 部分，添加：

```
http://localhost:3002/api/auth/callback/google
```

**当前已配置的URIs** (保留这些):
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
```

**完整列表应该包括:**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
http://localhost:3002/api/auth/callback/google
http://localhost:3003/api/auth/callback/google
```

---

### **步骤 4: 保存配置**

1. 点击 **SAVE** 按钮
2. 等待几秒钟让配置生效（通常是即时的）

---

### **步骤 5: 测试登录**

1. 访问 http://localhost:3002/auth/signin
2. 点击 "Sign in with Google"
3. 应该会重定向到 Google 登录页面
4. 使用 @wisc.edu 邮箱登录
5. 授权后会返回应用

---

## 🐛 **常见问题排查**

### **问题 1: 还是返回 400 Bad Request**

**原因**: 配置未生效  
**解决**:
- 等待1-2分钟
- 清除浏览器缓存
- 尝试无痕模式

### **问题 2: "redirect_uri_mismatch" 错误**

**原因**: URI 拼写错误或端口不匹配  
**解决**:
1. 检查当前运行的端口 (查看终端输出)
2. 确保 `.env` 中的 `NEXTAUTH_URL` 与端口一致
3. 确保 Google Console 中的 URI 与端口一致

### **问题 3: "Access blocked: This app's request is invalid"**

**原因**: OAuth 同意屏幕配置问题  
**解决**:
1. 返回 **OAuth consent screen**
2. 确保状态为 **Testing**
3. 添加你的 @wisc.edu 邮箱到 **Test users**

### **问题 4: "Only @wisc.edu emails are allowed"**

**原因**: 工作正常！这是预期行为  
**解决**:
- 必须使用 @wisc.edu 邮箱登录
- hd=wisc.edu 参数限制了域名

---

## 🔍 **调试方法**

### **检查当前端口**

运行中的开发服务器会显示：
```
- Local:        http://localhost:3002
```

### **检查 .env 配置**

```bash
cat .env | grep NEXTAUTH_URL
# 应该输出: NEXTAUTH_URL="http://localhost:3002"
```

### **检查 OAuth 端点**

```bash
curl -I http://localhost:3002/api/auth/signin/google
```

- **200 OK** → 重定向正常 ✅
- **400 Bad Request** → Redirect URI 不匹配 ❌
- **404 Not Found** → NextAuth 配置错误 ❌

### **查看服务器日志**

在运行 `npm run dev` 的终端中查看错误信息：
```
[auth][error] OAuthCallbackError: ...
```

---

## 📝 **当前配置状态**

### **环境变量** (`.env`)
```bash
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="<your-generated-secret>"
GOOGLE_CLIENT_ID="<your-client-id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<your-client-secret>"
```

### **应用地址**
- 开发服务器: http://localhost:3002
- 登录页面: http://localhost:3002/auth/signin
- OAuth 回调: http://localhost:3002/api/auth/callback/google

---

## ✅ **完成后测试清单**

- [ ] 能访问 http://localhost:3002/auth/signin
- [ ] 点击 "Sign in with Google" 不报错
- [ ] 重定向到 Google 登录页面
- [ ] 登录后返回应用
- [ ] 右上角显示用户头像/名字
- [ ] 点击头像显示下拉菜单
- [ ] "Sign Out" 按钮正常工作

---

## 🚀 **测试用例**

### **成功场景**
1. 使用 @wisc.edu 邮箱登录 → ✅ 成功
2. 用户信息保存到数据库 → ✅ User 表新增记录
3. Session 持久化 → ✅ 刷新页面仍保持登录
4. 提交评论 → ✅ 关联到用户

### **失败场景** (预期行为)
1. 使用 @gmail.com 登录 → ❌ Google 拒绝（hd=wisc.edu）
2. 未登录提交评论 → ❌ Server Action 拒绝
3. 未登录投票 → ❌ Toast 提示 "Please sign in"

---

## 📞 **还有问题？**

如果按照上述步骤操作后仍然无法登录，请提供：
1. 浏览器控制台的错误信息
2. 服务器终端的日志输出
3. 截图（如果有错误页面）

---

**最后更新**: 2026-02-04  
**当前端口**: 3002  
**状态**: ⚠️ 需要在 Google Console 添加 redirect URI
