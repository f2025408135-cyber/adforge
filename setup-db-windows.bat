@echo off
title AdForge - Setup Database
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║                                              ║
echo  ║    AdForge - Database Setup                  ║
echo  ║                                              ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    pause
    exit /b 1
)

:: Generate Prisma client
echo [1/3] Generating Prisma client...
call npx prisma generate
echo.

:: Push schema to database
echo [2/3] Creating database tables...
call npx prisma db push
echo.

:: Seed sample data
echo [3/3] Seeding sample data...
call npx tsx prisma/seed.ts 2>nul || call npx bun prisma/seed.ts 2>nul
echo.

echo [DONE] Database setup complete!
echo.
pause
