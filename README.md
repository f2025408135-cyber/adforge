# AdForge — AI-Powered Advertisement Campaign Generator

> Professional full-stack application that generates complete, ready-to-publish ad campaigns using AI.

---

## 🚀 Quick Start (Windows)

### Option 1: One-Click Start (Recommended)
```batch
:: Double-click this file:
start-windows.bat
```

### Option 2: Manual Setup
```batch
:: 1. Install dependencies
npm install

:: 2. Set up environment
copy .env.example .env.local
:: Edit .env.local and add at least one API key

:: 3. Set up database
npx prisma generate
npx prisma db push

:: 4. Seed sample data
npx tsx prisma/seed.ts

:: 5. Build for production
npm run build

:: 6. Start the server
set NODE_ENV=production
node .next\standalone\server.js
```

### Option 3: Development Mode (Hot Reload)
```batch
:: Double-click this file:
dev-windows.bat

:: Or manually:
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 📁 Project Structure

```
adforge/
├── start-windows.bat          ← One-click production start
├── dev-windows.bat             ← One-click development start
├── build-windows.bat           ← One-click build
├── setup-db-windows.bat        ← One-click database setup
├── start.sh                    ← Mac/Linux start script
├── .env.example                ← Environment template
├── .env.local                  ← Your actual API keys (gitignored)
│
├── prisma/
│   ├── schema.prisma           ← Database schema (8 models)
│   └── seed.ts                 ← Sample data seeder
│
├── src/
│   ├── app/
│   │   ├── page.tsx            ← Main SPA (5 tabs)
│   │   ├── layout.tsx          ← Root layout + fonts
│   │   └── globals.css         ← Design system + animations
│   │
│   ├── app/api/                ← 14 API endpoints
│   │   ├── generate/           ← Full campaign generation
│   │   ├── regenerate/         ← Single section regeneration
│   │   ├── enhance-description/ ← AI description enhancer
│   │   ├── campaigns/          ← CRUD + favorite/rate/duplicate/versions
│   │   ├── brand-kits/         ← Brand kit CRUD
│   │   ├── templates/          ← Template CRUD
│   │   ├── analytics/          ← Usage analytics
│   │   └── health/             ← Health check
│   │
│   ├── stores/
│   │   ├── campaign-store.ts   ← Zustand: form + result state
│   │   └── ui-store.ts         ← Zustand: UI state
│   │
│   ├── hooks/
│   │   ├── use-campaigns.ts    ← React Query: campaigns CRUD
│   │   ├── use-templates.ts    ← React Query: templates
│   │   ├── use-brand-kits.ts   ← React Query: brand kits
│   │   ├── use-analytics.ts    ← React Query: analytics
│   │   └── use-debounce.ts     ← Debounce hook
│   │
│   ├── lib/
│   │   ├── ai-providers.ts     ← AI provider configs (Gemini/DeepSeek/GLM)
│   │   ├── prompt-templates.ts ← Prompt engineering + tone maps
│   │   ├── validations.ts      ← Zod schemas for API validation
│   │   ├── db.ts               ← Prisma client singleton
│   │   └── providers.tsx       ← React Query provider
│   │
│   └── components/ui/          ← 40+ shadcn/ui components
│
├── db/
│   └── dev.db                  ← SQLite database file
│
└── package.json
```

---

## 🔑 API Keys Setup

You need **at least one** AI provider API key. Get them here:

| Provider | Get Key | Model Used | Best For |
|----------|---------|------------|----------|
| **Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | gemini-1.5-flash | Social media & short-form copy |
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) | deepseek-chat | Long-form & analytical copy |
| **GLM** | [open.bigmodel.cn](https://open.bigmodel.cn/usercenter/apikeys) | glm-4 | Multilingual & structured output |

Add keys to `.env.local`:
```
GEMINI_API_KEY=your-key-here
DEEPSEEK_API_KEY=your-key-here
GLM_API_KEY=your-key-here
```

> **Security**: API keys are stored server-side only. They are never sent to the client browser.

---

## ✨ Features

### Tab 1: Generate (Main)
- **3 AI Providers**: Gemini, DeepSeek, GLM — switch with one click
- **12 Campaign Tones**: Professional, Luxury, Casual, Urgent, Humorous, Inspirational, Playful, Minimalist, Bold, Empathetic, Technical, Storytelling
- **9 Platforms**: Instagram, Facebook, Twitter/X, LinkedIn, TikTok, YouTube, Billboard, Email, Google Ads
- **9 Languages**: English, Spanish, French, German, Chinese, Japanese, Arabic, Portuguese, Hindi
- **Creativity Slider**: Conservative → Balanced → Creative
- **AI Description Enhancer**: One-click to improve your product description
- **7-Section Campaign Output**:
  - Headline (with word count)
  - Tagline (with word count)
  - Ad Copy (with word count)
  - Call to Action (with word count)
  - Target Audience
  - Key Benefits (bulleted)
  - Platform Adaptations (per-platform)
- **Per-Section Regeneration**: Refresh any individual section
- **One-Click Copy**: Copy any section or all content
- **Export**: Markdown, TXT, PDF (print), JSON
- **Save to Dashboard**: Persist campaigns to database
- **Template System**: Pre-built templates for Product Launch, Flash Sale, etc.
- **Brand Kit Integration**: Apply saved brand voice/colors to campaigns

### Tab 2: Campaigns
- Search with instant debounce
- Filter by Tone, Provider, Status
- Favorite and rate campaigns
- Duplicate campaigns
- Expandable cards with snippet preview
- Pagination

### Tab 3: Templates
- 10 built-in campaign templates
- Category filters (Product, Service, Event, SaaS, E-Commerce)
- One-click "Use Template" applies to generation form
- Create custom templates

### Tab 4: Brand Kits
- Save brand voice, colors, and guidelines
- Color picker for primary/secondary colors
- One-click "Use in Campaign" applies brand voice
- Create and manage multiple brand kits

### Tab 5: Analytics
- Total campaigns, this month, favorites, average rating
- Provider distribution chart
- Tone distribution chart
- Recent activity feed

---

## 🗄️ Database

**SQLite** — zero configuration, file-based database.

Models:
- `User` — User accounts
- `Campaign` — Generated campaigns with full content
- `CampaignVersion` — Version history for each campaign
- `BrandKit` — Brand voice/color/guidelines
- `Template` — Campaign templates
- `Export` — Export history
- `ApiUsage` — Token usage tracking
- `TeamMember` — Team collaboration (future)

Reset database:
```batch
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

---

## 🎨 Design System

- **Background**: Warm cream (#faf8f5)
- **Primary Accent**: Terracotta (#c8602a)
- **Cards**: White with subtle border
- **Headings**: Playfair Display (serif)
- **Body**: DM Sans (sans-serif)
- **No dark mode** — Professional light theme only

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | Full-stack framework |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| shadcn/ui | Component library |
| Prisma | Database ORM |
| SQLite | Database |
| Zustand | Client state |
| React Query | Server state |
| Framer Motion | Animations |
| Zod | API validation |
| Sonner | Toast notifications |

---

## 📋 Available Scripts

```batch
npm run dev         :: Start development server (port 3000)
npm run build       :: Build for production
npm run start       :: Start production server
npm run lint        :: Run ESLint
npm run db:push     :: Sync database schema
npm run db:generate :: Generate Prisma client
npm run prisma:seed :: Seed sample data
```

---

## 🔧 Troubleshooting

### "No API key configured for [provider]"
Add your API key to `.env.local` and restart the server.

### "Port 3000 already in use"
Change the port: `set PORT=3001 && npm run dev`

### Database errors
Reset and reseed: `npx prisma db push --force-reset && npx tsx prisma/seed.ts`

### Build fails
Clear cache: `rmdir /s /q .next && npm run build`

---

## 📦 Deployment

### Local/Windows
Just run `start-windows.bat` — it handles everything.

### Netlify / Vercel
1. Push code to GitHub
2. Connect repo to Netlify/Vercel
3. Set environment variables (API keys)
4. Build command: `npm run build`
5. Output directory: `.next`

### Docker (Linux)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx prisma db push
RUN npm run build
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
```

---

Built with ❤️ using Next.js, React, and AI.
