@echo off
rem Doppelklick startet den Reel-Agenten (Windows) und oeffnet ihn im Browser.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte einmalig von https://nodejs.org installieren ^(LTS^) und dann erneut doppelklicken.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Erster Start: benoetigte Bausteine werden installiert ^(dauert ca. 1 Minute^) ...
  call npm install --omit=dev
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
if "%PORT%"=="" set PORT=3000
start "" cmd /c "timeout /t 2 >nul & start http://localhost:%PORT%"
echo Reel-Agent laeuft. Dieses Fenster offen lassen - schliessen beendet den Agenten.
node src\server.js
pause
