#!/bin/bash

# 检查文档中的敏感信息

echo "🔍 Checking for sensitive information in documentation..."
echo ""

FOUND=0

# 检查数据库连接字符串
echo "📊 Checking for database URLs..."
if grep -r "postgresql://.*@.*\.neon\.tech" docs/ 2>/dev/null; then
  echo "  ❌ Found Neon connection string!"
  FOUND=1
else
  echo "  ✅ No database URLs found"
fi

# 检查 API 密钥
echo ""
echo "🔑 Checking for API keys..."
if grep -r "GOCSPX-" docs/ 2>/dev/null; then
  echo "  ❌ Found Google Client Secret!"
  FOUND=1
elif grep -r "npg_" docs/ 2>/dev/null; then
  echo "  ❌ Found Neon password!"
  FOUND=1
else
  echo "  ✅ No API keys found"
fi

# 检查绝对路径
echo ""
echo "📁 Checking for absolute paths..."
if grep -r "/Users/yifanyang" docs/ 2>/dev/null | grep -v "check-sensitive-info" | head -5; then
  echo "  ⚠️  Found absolute paths (should use relative paths)"
  FOUND=1
else
  echo "  ✅ No absolute paths found"
fi

# 检查具体的服务器地址
echo ""
echo "🌐 Checking for specific server addresses..."
if grep -r "ep-.*\.aws\.neon\.tech" docs/ 2>/dev/null; then
  echo "  ❌ Found Neon server address!"
  FOUND=1
else
  echo "  ✅ No server addresses found"
fi

echo ""
echo "================================"
if [ $FOUND -eq 0 ]; then
  echo "✅ All clear! Safe to upload to GitHub."
  exit 0
else
  echo "❌ Found sensitive information! Please review and remove before uploading."
  exit 1
fi
