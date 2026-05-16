#!/bin/bash
# AdForge - Start Production Server

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║                                              ║"
echo "  ║       AdForge - AI Campaign Generator        ║"
echo "  ║       Starting Production Server...          ║"
echo "  ║                                              ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "[WARN] .env.local not found. Creating from template..."
    cp .env.example .env.local 2>/dev/null
    echo "[WARN] Please edit .env.local and add your API keys."
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install || bun install
    echo ""
fi

# Check if production build exists
if [ ! -f ".next/standalone/server.js" ]; then
    echo "[INFO] Building production bundle..."
    npm run build || bun run build
    echo ""
fi

# Start production server
echo "[INFO] Starting AdForge on http://localhost:3000"
echo "[INFO] Press Ctrl+C to stop."
echo ""
NODE_ENV=production node .next/standalone/server.js
