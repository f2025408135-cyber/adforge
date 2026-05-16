@echo off
title AdForge - Build for Production
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║                                              ║
echo  ║    AdForge - Building Production Bundle      ║
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

:: Install dependencies if needed
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

:: Generate Prisma client
echo [INFO] Generating Prisma client...
call npx prisma generate
echo.

:: Push database schema
echo [INFO] Setting up database...
call npx prisma db push
echo.

:: Seed database
echo [INFO] Seeding database with sample data...
call npx tsx prisma/seed.ts 2>nul || call npx bun prisma/seed.ts 2>nul
echo.

:: Build
echo [INFO] Building production bundle (this may take a minute)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║                                              ║
echo  ║    Build successful!                          ║
echo  ║                                              ║
echo  ║    To start the server, run:                  ║
echo  ║      start-windows.bat                        ║
echo  ║                                              ║
echo  ╚══════════════════════════════════════════════╝
echo.
pause
