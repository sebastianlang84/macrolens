@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM MacroLens Windows Debug Launcher
REM - Opens SSH tunnel to Linux host for the app (local forward)
REM - Opens reverse SSH tunnel for Chrome DevTools (remote debugging)
REM - Starts Chrome/Edge in remote-debug mode with isolated profile
REM
REM Usage:
REM   1) Edit SSH_HOST and SSH_USER below
REM   2) Run this .bat on your Windows machine
REM   3) On Linux host, DevTools/CDP is reachable at:
REM      http://127.0.0.1:%REMOTE_DEVTOOLS_PORT%/json/version
REM ============================================================

REM ---------- CONFIG (EDIT THESE) ----------
set "SSH_HOST=YOUR_LINUX_HOST_OR_IP"
set "SSH_USER=YOUR_SSH_USERNAME"
set "SSH_PORT=22"

REM Linux app port (Next.js dev server usually 3000)
set "REMOTE_APP_PORT=3000"

REM Port on Windows where you want to open the app in browser
set "LOCAL_APP_PORT=3000"

REM Chrome DevTools debug port on Windows browser
set "LOCAL_DEVTOOLS_PORT=9222"

REM Reverse-forwarded port on Linux so MCP/DevTools can reach your browser
set "REMOTE_DEVTOOLS_PORT=9222"

REM Separate browser profile so your normal browser session stays untouched
set "BROWSER_PROFILE_DIR=%LOCALAPPDATA%\MacroLensDebugProfile"

REM ---------- PRECHECKS ----------
where ssh >nul 2>nul
if errorlevel 1 (
  echo [ERROR] ssh.exe not found. Install OpenSSH Client on Windows first.
  pause
  exit /b 1
)

if "%SSH_HOST%"=="YOUR_LINUX_HOST_OR_IP" (
  echo [ERROR] Please edit SSH_HOST in this file.
  pause
  exit /b 1
)

if "%SSH_USER%"=="YOUR_SSH_USERNAME" (
  echo [ERROR] Please edit SSH_USER in this file.
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
  echo         Edit this file and set BROWSER_EXE manually if needed.
  pause
  exit /b 1
)

set "START_URL=http://127.0.0.1:%LOCAL_APP_PORT%/"

echo.
echo [INFO] Starting SSH tunnel in a separate window...
echo [INFO] App URL on Windows: %START_URL%
echo [INFO] DevTools endpoint on Linux (for MCP): http://127.0.0.1:%REMOTE_DEVTOOLS_PORT%/json/version
echo.

start "MacroLens SSH Tunnel" cmd /k ^
ssh -p %SSH_PORT% -NT ^
  -o ExitOnForwardFailure=yes ^
  -o ServerAliveInterval=30 ^
  -o ServerAliveCountMax=3 ^
  -L %LOCAL_APP_PORT%:127.0.0.1:%REMOTE_APP_PORT% ^
  -R 127.0.0.1:%REMOTE_DEVTOOLS_PORT%:127.0.0.1:%LOCAL_DEVTOOLS_PORT% ^
  %SSH_USER%@%SSH_HOST%

REM Give the tunnel a moment to come up before opening the browser
timeout /t 2 /nobreak >nul

echo [INFO] Starting browser in remote-debug mode...
start "MacroLens Browser Debug" "%BROWSER_EXE%" ^
  --remote-debugging-port=%LOCAL_DEVTOOLS_PORT% ^
  --remote-debugging-address=127.0.0.1 ^
  --user-data-dir="%BROWSER_PROFILE_DIR%" ^
  --new-window ^
  "%START_URL%"

echo [INFO] Done. Keep the SSH tunnel window open while debugging.
echo [INFO] If the page does not load, verify the Next.js server is running on the Linux machine.
echo.
pause

