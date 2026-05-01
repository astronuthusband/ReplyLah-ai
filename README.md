# ReplyKaki — AI WhatsApp Reply Assistant 🇲🇾

> Generate natural Malaysian-style WhatsApp replies for your business in seconds.

---

## 🧩 What It Does

ReplyKaki is a **copy-paste AI reply assistant** for Malaysian small businesses. Users paste a customer WhatsApp message → AI generates 2–3 natural Manglish replies → user copies and sends on WhatsApp.

**Key differentiator**: Replies sound like a real Malaysian WhatsApp business admin — casual, warm, natural Manglish — not like a corporate chatbot.

---

## 🏗️ Project Architecture

```
wa-reply-assistant/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate/
│   │   │       └── route.ts     ← Backend API (POST /api/generate)
│   │   ├── globals.css          ← WhatsApp-inspired styles
│   │   ├── layout.tsx           ← Root layout + metadata
│   │   └── page.tsx             ← Main UI page
│   ├── components/
│   │   ├── ReplyCard.tsx        ← Individual reply bubble + copy button
│   │   └── TypingIndicator.tsx  ← Loading state
│   └── lib/
│       └── prompts.ts           ← ⭐ CORE: AI prompt engineering module
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## ⚡ Quick Start (Local)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your API key from: https://console.anthropic.com/

### 3. Run development server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🚀 Deploy to Vercel (Recommended)

### Option A: Vercel CLI
```bash
npm install -g vercel
vercel deploy
```

### Option B: GitHub → Vercel (recommended for teams)
1. Push this repo to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variable: `ANTHROPIC_API_KEY`
5. Click Deploy

### Environment Variables on Vercel
Go to: Project Settings → Environment Variables
- `ANTHROPIC_API_KEY` = your key (mark as Secret)

---

## 🧠 AI Prompt Design

The core prompt engineering is in `src/lib/prompts.ts`. Key design decisions:

### System Prompt Architecture
1. **Role definition** — tells Claude it's a Malaysian WhatsApp admin, not a generic chatbot
2. **Business context injection** — different context per business type changes the reply style
3. **Tone guide** — 3 distinct tones with example energy and language rules
4. **Manglish vocabulary** — explicit list of natural Malay-English mixing patterns
5. **Hard rules** — prevents robotic language, forces short replies, requires CTA
6. **Output format** — forces JSON for reliable parsing

### Why JSON output?
Forces the model to produce structured, parseable replies. The `detectedIntent` field is a bonus UX feature.

### Tuning the prompts
Edit `src/lib/prompts.ts`:
- `buildSystemPrompt()` — main system prompt
- `EXAMPLE_MESSAGES` — quick-fill examples on the UI
- Add new business types in `businessContext` map

---

## 🔧 Customisation Guide

### Add a new business type
In `src/lib/prompts.ts`, add to `businessContext`:
```ts
petshop: "pet shop / veterinary services. Common requests: grooming, vet appointments, pet food availability.",
```

Add to `BUSINESS_TYPES` in `src/app/page.tsx`:
```ts
{ value: "petshop", label: "Pet Shop", emoji: "🐾" },
```

### Add a new tone
In `src/lib/prompts.ts`, add to `toneGuide`:
```ts
humorous: `
- Light-hearted, use wordplay
- Still professional but add a joke or pun
- ...
`,
```

### Enable password gate (basic auth)
Set in `.env.local`:
```env
ENABLE_PASSWORD_GATE=true
APP_PASSWORD=yourpassword123
```

Then add middleware (`src/middleware.ts`) to check the password cookie.

---

## 💸 Cost Estimation

Using Claude Sonnet:
- ~800 input tokens + ~300 output tokens per generation
- ≈ $0.003 per request
- 1,000 requests/month ≈ **$3/month**

---

## 🗺️ Roadmap (Post-MVP)

| Feature | Priority | Notes |
|---|---|---|
| Usage analytics | High | Track popular business types, tones |
| Save reply history | High | LocalStorage first, then DB |
| Custom tone builder | Medium | Let users define their own style |
| WhatsApp Web extension | Medium | Auto-detect message, fill reply |
| Multi-language | Low | Add BM-only / Tamil options |
| Team accounts | Low | Shared business context |
| WhatsApp Business API | Future | Full automation |

---

## 📦 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, easy deploy |
| Styling | Tailwind CSS | Fast, responsive |
| AI | Anthropic Claude Sonnet | Best Malaysian cultural understanding |
| Deployment | Vercel | Zero-config Next.js |
| Rate limiting | In-memory (Map) | MVP — upgrade to Redis/Upstash for scale |

---

## ⚠️ Known MVP Limitations

- Rate limiting is in-memory (resets on server restart — use Upstash for prod)
- No user accounts or history
- No WhatsApp integration (copy-paste only)
- No analytics

These are all intentional for MVP scope. Build them as you validate the market.

---

## 🇲🇾 Made for Malaysian businesses. Built with ReplyKaki.
