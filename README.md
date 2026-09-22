# AdForge

AI-powered advertisement campaign generator. Full-stack application that produces complete, platform-ready ad campaigns — headlines, taglines, body copy, CTAs, audience targeting, and platform-specific variants.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS, shadcn/ui, Radix Primitives
- **AI:** DeepSeek V4 Flash, Gemini 2.0 Flash, GLM 4 Flash
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js
- **Payments:** Stripe

## Quick Start

```bash
# Clone and install
git clone https://github.com/f2025408135-cyber/adforge.git
cd adforge
npm install

# Configure environment
cp .env.example .env.local
# Add at least one API key (DeepSeek recommended)

# Initialize database
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Development
npm run dev
# → http://localhost:3000

# Production build
npm run build
NODE_ENV=production node .next/standalone/server.js
```

## Features

| Capability | Details |
|---|---|
| Campaign generation | Full multi-section campaigns from a single product description |
| Section regeneration | Independently regenerate any campaign section |
| Brand kits | Persistent brand voice, colors, and tone profiles |
| Multi-platform output | Facebook, Instagram, X, LinkedIn, TikTok, YouTube, Google Ads, Pinterest, Email, WhatsApp |
| 12 tone profiles | Professional, luxury, casual, urgent, humorous, inspirational, playful, minimalist, bold, empathetic, technical, storytelling |
| Version history | Every iteration preserved with diff comparison |
| AI description enhancer | Refine product descriptions before generation |
| Duplicate & remix | Clone existing campaigns as starting points |
| Rating & favorites | Mark and filter best-performing campaigns |
| Export | Markdown, plain text, or structured JSON |

## Project Structure

```
adforge/
├── src/
│   ├── app/                    # App Router pages & API routes
│   │   ├── page.tsx            # Main SPA (5 tabs)
│   │   ├── layout.tsx          # Root layout + fonts
│   │   ├── globals.css         # Design system
│   │   └── api/                # 14 API endpoints
│   ├── components/             # React components
│   ├── lib/                    # Utilities, AI clients, auth
│   └── types/                  # TypeScript definitions
├── prisma/
│   ├── schema.prisma           # 8-model schema
│   └── seed.ts                 # Sample data
├── public/                     # Static assets
├── components.json             # shadcn/ui config
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## API Overview

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/generate` | POST | Full campaign generation |
| `/api/regenerate` | POST | Single-section regeneration |
| `/api/enhance-description` | POST | AI description enhancement |
| `/api/campaigns` | GET, POST | Campaign list & creation |
| `/api/campaigns/[id]` | GET, PATCH, DELETE | Campaign detail, update, delete |
| `/api/brand-kits` | GET, POST | Brand kit list & creation |
| `/api/templates` | GET, POST | Template list & creation |

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DEEPSEEK_API_KEY` | Yes* | Primary AI provider |
| `GEMINI_API_KEY` | No | Fallback provider |
| `GLM_API_KEY` | No | Fallback provider |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Session encryption |
| `STRIPE_SECRET_KEY` | No | For billing features |

*At least one AI provider key required.

## License

MIT
