# CareerAI – AI-Powered Career Assistant Platform

A production-ready SaaS platform built with Next.js 15, Supabase, and Google Gemini AI.

## Features

- **Resume Upload & Analysis** – Upload PDF resumes; AI evaluates ATS compatibility, strengths, weaknesses, and recommendations
- **ATS Score** – Detailed ATS compatibility scoring with keyword analysis and PDF export
- **Job Match** – Match your resume against target roles with percentage score and skill gap breakdown
- **Skill Gap Analysis** – Compare your skills to target job requirements with learning resources
- **AI Roadmap Generator** – Personalized weekly/monthly learning roadmaps with project suggestions
- **AI Mock Interview** – Generate interview questions, submit answers, get AI-scored feedback
- **Cover Letter Generator** – Professional cover letters tailored to any job in 4 tones
- **LinkedIn Summary Generator** – Optimized headlines, about sections, and recruiter keywords
- **AI Career Chatbot** – Streaming Gemini-powered career advisor with persistent chat history
- **Admin Panel** – User management, platform analytics, and action logging
- **Dark/Light Mode** – Full theme support with system preference detection
- **Google OAuth** – One-click sign-in with Google

## Tech Stack

- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion, Recharts
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth (Email + Google OAuth)
- **AI**: Google Gemini 1.5 Flash/Pro
- **Deployment**: Vercel

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd career-ai-platform
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase/schema.sql`
3. Run `supabase/policies.sql`
4. Enable Google OAuth in Authentication → Providers
5. Set Site URL to your domain in Authentication → URL Configuration
6. Set Redirect URL to `https://yourdomain.com/auth/callback`

### 3. Get API Keys

**Supabase:** Project Settings → API
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Gemini:** [Google AI Studio](https://aistudio.google.com) → Get API Key
- `GEMINI_API_KEY`

### 4. Configure environment

Copy `.env.local` and fill in all values:

```bash
cp .env.local .env.local.example
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Add all environment variables in Vercel project settings
5. Deploy

### Environment Variables on Vercel

Go to Project → Settings → Environment Variables and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `NEXTAUTH_SECRET` | Random 32+ character string |
| `NEXTAUTH_URL` | Your Vercel deployment URL |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |

## Create Admin Account

After deploying, sign up with your email, then in Supabase SQL Editor run:

```sql
UPDATE public.users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

## Project Structure

```
career-ai-platform/
├── app/
│   ├── (auth)/          # Login, Register, Reset Password pages
│   ├── (dashboard)/     # All dashboard feature pages
│   │   ├── dashboard/   # Analytics overview
│   │   ├── resume-upload/
│   │   ├── resume-analysis/
│   │   ├── ats-score/
│   │   ├── job-match/
│   │   ├── skill-gap/
│   │   ├── roadmap/
│   │   ├── mock-interview/
│   │   ├── cover-letter/
│   │   ├── linkedin-summary/
│   │   ├── ai-chat/
│   │   ├── profile/
│   │   └── admin/
│   ├── api/             # All API routes
│   └── auth/callback/   # OAuth callback handler
├── components/
│   ├── dashboard/       # Sidebar, Navbar
│   ├── providers/       # Theme provider
│   └── ui/              # ShadCN UI components
├── lib/
│   ├── gemini/          # Gemini AI client, prompts, service
│   ├── supabase/        # Supabase clients (browser, server, admin)
│   ├── utils.ts
│   ├── validations.ts
│   └── rate-limit.ts
├── store/               # Zustand state stores
├── types/               # TypeScript type definitions
├── supabase/
│   ├── schema.sql       # Database schema
│   ├── policies.sql     # RLS policies
│   └── seed.sql         # Sample data
├── middleware.ts         # Auth middleware
└── vercel.json          # Vercel configuration
```

## License

MIT
