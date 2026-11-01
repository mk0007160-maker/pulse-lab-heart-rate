@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ----------------------------------------------
echo Pulse Lab - Run on computer and mobile
 echo ----------------------------------------------
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install from https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\" (
  echo Installing dependencies (first run only)...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)
echo.
echo Find your computer IPv4 on your active Wi-Fi network:
ipconfig | findstr /I "IPv4"
echo.
echo On the same Wi-Fi, open http://YOUR-COMPUTER-IP:5173 on your phone.
echo Replace YOUR-COMPUTER-IP with the shown Wi-Fi IPv4 address.
echo Keep this window running while using the website.
echo.
call npm run dev -- --host 0.0.0.0
pause
