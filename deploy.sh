#!/bin/bash
# نشر سريع: GitHub + Netlify auto-deploy
# الاستخدام: ./deploy.sh "رسالة الالتزام"

set -e

MSG="${1:-تحديث التطبيق}"

echo "📦 1/3 إضافة التغييرات..."
git add index.html

if git diff --cached --quiet; then
  echo "⚠️ لا توجد تغييرات للنشر"
  exit 0
fi

echo "💾 2/3 إنشاء commit..."
git commit -m "$MSG

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "🚀 3/3 رفع إلى GitHub..."
git push origin master

echo ""
echo "✅ تم الرفع على GitHub بنجاح"
echo "🌐 GitHub Pages سيقوم بالنشر التلقائي خلال 1-2 دقيقة"
echo "🔗 الرابط: https://al76yame-dot.github.io/alyame-visa-system/"
