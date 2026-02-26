@echo off
setlocal EnableExtensions

REM ============================================================
REM MacroLens Windows Debug Launcher (double-click)
REM - Starts SSH tunnel to Linux host (this machine): wasti@192.168.0.188
REM - Starts Chrome/Edge in remote-debug mode
REM - Exposes Windows browser DevTools back to Linux via reverse tunnel
REM ============================================================

REM ---------- FIXED CONFIG ----------
set "SSH_HOST=192.168.0.188"
set "SSH_USER=wasti"
set "SSH_PORT=22"

set "REMOTE_APP_PORT=3001"
set "LOCAL_APP_PORT=3000"

set "LOCAL_DEVTOOLS_PORT=9333"
set "REMOTE_DEVTOOLS_PORT=9333"

set "BROWSER_PROFILE_DIR=%LOCALAPPDATA%\MacroLensDebugProfile"
set "START_URL=http://127.0.0.1:%LOCAL_APP_PORT%/"

REM ---------- PRECHECKS ----------
where ssh >nul 2>nul
if errorlevel 1 (
  echo [ERROR] ssh.exe not found. Install OpenSSH Client on Windows first.
  pause
  exit /b 1
)

REM ---------- BROWSER DETECTION ----------
set "BROWSER_EXE="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "BROWSER_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)
if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "BROWSER_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)
if not defined BROWSER_EXE if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  set "BROWSER_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)
if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  set "BROWSER_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
)

if not defined BROWSER_EXE (
  echo [ERROR] Could not find Chrome or Edge.
  pause
  exit /b 1
)

echo.
echo [INFO] Preparing browser debug + SSH tunnel to %SSH_USER%@%SSH_HOST% ...
echo [INFO] Windows app URL: %START_URL%
echo [INFO] Linux DevTools endpoint (for MCP): http://127.0.0.1:%REMOTE_DEVTOOLS_PORT%/json/version
echo.

echo [INFO] Starting browser in remote-debug mode...
start "MacroLens Browser Debug" "%BROWSER_EXE%" ^
  --remote-debugging-port=%LOCAL_DEVTOOLS_PORT% ^
  --remote-debugging-address=127.0.0.1 ^
  --no-first-run ^
  --no-default-browser-check ^
  --user-data-dir="%BROWSER_PROFILE_DIR%" ^
  --new-window ^
  "%START_URL%"

timeout /t 1 /nobreak >nul

echo.
echo [INFO] Starting SSH tunnel in THIS window (only one black window).
echo [INFO] Keep this window open while debugging.
echo [INFO] Linux app should be running (recommended): docker compose up -d --build
echo.

ssh -p %SSH_PORT% -NT ^
  -o ExitOnForwardFailure=yes ^
  -o ServerAliveInterval=30 ^
  -o ServerAliveCountMax=3 ^
  -L %LOCAL_APP_PORT%:127.0.0.1:%REMOTE_APP_PORT% ^
  -R 127.0.0.1:%REMOTE_DEVTOOLS_PORT%:127.0.0.1:%LOCAL_DEVTOOLS_PORT% ^
  %SSH_USER%@%SSH_HOST%

echo.
echo [INFO] SSH tunnel closed.
pause
