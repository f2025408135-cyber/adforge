@echo off
title AdForge - AI Campaign Generator
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║                                              ║
echo  ║         AdForge - AI Campaign Generator      ║
echo  ║         Starting Production Server...         ║
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

:: Check if .env.local exists
if not exist ".env.local" (
    echo [WARN] .env.local not found. Creating from template...
    copy ".env.example" ".env.local" >nul 2>nul
    echo [WARN] Please edit .env.local and add your API keys before using AI features.
    echo.
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

:: Check if .next/standalone exists (production build)
if not exist ".next\standalone\server.js" (
    echo [INFO] Building production bundle...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Build failed. Trying development mode instead...
        echo.
        echo [INFO] Starting in development mode...
        call npm run dev
        goto :end
    )
    echo.
)

:: Start production server
echo [INFO] Starting AdForge on http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server.
echo.
start http://localhost:3000
set NODE_ENV=production
node .next\standalone\server.js

:end
pause
