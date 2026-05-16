@echo off
title AdForge - Development Mode
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║                                              ║
echo  ║    AdForge - Development Mode                ║
echo  ║    Hot reload enabled                        ║
echo  ║                                              ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo.
)

:: Start dev server
echo [INFO] Starting AdForge Dev Server on http://localhost:3000
echo [INFO] Press Ctrl+C to stop.
echo.
start http://localhost:3000
call npm run dev
pause
