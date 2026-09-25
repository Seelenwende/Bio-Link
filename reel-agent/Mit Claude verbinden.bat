@echo off
rem Doppelklick traegt den Reel-Agenten in Claude Desktop ein (Windows).
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte einmalig von https://nodejs.org installieren ^(LTS^) und dann erneut doppelklicken.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Benoetigte Bausteine werden installiert ^(dauert ca. 1 Minute^) ...
  call npm install --omit=dev
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
node src\install-claude.js
pause
