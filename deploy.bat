@echo off
REM نشر سريع: GitHub + Netlify auto-deploy
REM الاستخدام: deploy.bat "رسالة الالتزام"

setlocal

set "MSG=%~1"
if "%MSG%"=="" set "MSG=تحديث التطبيق"

echo.
echo ============================================
echo   نشر تطبيق اليامي للتأشيرات
echo ============================================
echo.

echo [1/3] اضافة التغييرات...
git add index.html
git diff --cached --quiet
if %ERRORLEVEL%==0 (
  echo.
  echo [!] لا توجد تغييرات للنشر
  exit /b 0
)

echo [2/3] انشاء commit...
git commit -m "%MSG%"
if %ERRORLEVEL% NEQ 0 (
  echo [X] فشل انشاء الـ commit
  exit /b 1
)

echo [3/3] رفع الى GitHub...
git push origin master
if %ERRORLEVEL% NEQ 0 (
  echo [X] فشل الرفع
  exit /b 1
)

echo.
echo ============================================
echo   تم الرفع على GitHub بنجاح
echo   GitHub Pages سينشر تلقائياً خلال 1-2 دقيقة
echo   الرابط: https://al76yame-dot.github.io/alyame-visa-system/
echo ============================================
echo.

endlocal
