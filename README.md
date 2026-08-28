# KadoshAI - Social Media Management Platform

<div align="center">
<img src="./public/logo.png" alt="KadoshAI Logo" width="120" />

**AI-Powered Social Media Management for Facebook & Instagram**

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![n8n](https://img.shields.io/badge/n8n-Automation-orange?logo=n8n)](https://n8n.io/)

</div>

---

## 🚀 Overview

KadoshAI is a comprehensive social media management platform that uses AI to help you:

- **Automate comment replies** with AI-suggested responses
- **Repurpose content** into images, videos, and summaries
- **Schedule posts** to Facebook and Instagram
- **Manage leads** from social media DMs
- **Connect with n8n** for workflow automation

## 📋 Features

### 1. Content Vault
Upload and manage your content assets (videos, audio, PDFs, text). Repurpose them into:
- **Summaries** - Extract key insights with captions
- **Images** - Generate AI visuals (DALL-E 3)
- **Videos** - Create AI videos (Sora 2)

### 2. Calendar
Visual calendar for scheduling and managing posts:
- View scheduled and published posts
- Create AI-generated posts
- Drag-and-drop scheduling
- Multi-platform support (Facebook & Instagram)

### 3. Social Inbox
Manage comments from Facebook and Instagram:
- **AI suggestions** - Automatic reply recommendations
- **Copy-paste workflow** - Copy replies to respond manually
- **Regenerate** - Request new AI suggestions
- Real-time updates via Supabase

### 4. Leads & Pipeline
Manage leads from social media DMs:
- Chat interface with Instagram DM integration
- AI-powered response recommendations
- Lead qualification and tracking
- Microsite generation for prospects

### 5. AI Studio
Advanced content processing workspace:
- Multi-model AI processing (GPT-4o, DALL-E 3, Sora)
- Progress tracking with stage indicators
- Content optimization for each platform

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | Frontend UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool & dev server |
| **Tailwind CSS 4** | Styling |
| **Supabase** | Database, Auth, Real-time |
| **n8n** | Workflow automation |
| **OpenAI API** | AI features (GPT, DALL-E, Sora) |
| **Lucide React** | Icons |

---

## 📦 Project Structure

```
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Main app layout with sidebar
│   ├── CommentCard.tsx  # Social inbox comment cards
│   ├── RepurposeModal.tsx # Content repurposing UI
│   └── ...
├── pages/               # Main application pages
│   ├── ContentVault.tsx # Asset management
│   ├── Calendar.tsx     # Post scheduling
│   ├── SocialInbox.tsx  # Comment management
│   ├── LeadsPipeline.tsx # Lead management
│   └── Login.tsx        # Authentication
├── services/            # Backend service integrations
│   ├── authService.ts   # Supabase authentication
│   ├── socialCommentsService.ts # Comments CRUD
│   ├── scheduledPostsService.ts # Posts CRUD
│   ├── repurposeService.ts # AI content processing
│   ├── n8nService.ts    # n8n webhook triggers
│   └── supabaseClient.ts # Supabase client
├── n8n_workflows/       # n8n workflow JSON exports
│   ├── 1_ingest_comments.json
│   ├── 2_ai_suggest_reply.json
│   ├── 3_send_reply.json
│   ├── 4_ai_create_post.json
│   ├── 5_scheduler.json
│   ├── 6_publish_post.json
│   ├── 7_fetch_social_dms.json
│   └── 8_send_social_dm.json
├── supabase_migration.sql # Database schema
└── types.ts             # TypeScript type definitions
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- n8n instance (self-hosted or cloud)
- OpenAI API key
- Facebook/Instagram Business accounts

### 1. Clone & Install

```bash
git clone <repository-url>
cd kadoshai
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```env
# OpenAI API Key (required for AI features)
VITE_OPENAI_API_KEY=sk-your-key

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# n8n Configuration
VITE_N8N_BASE_URL=https://your-n8n-instance
VITE_N8N_CREATE_POST_WEBHOOK=/webhook/create-post
VITE_N8N_FETCH_DMS_WEBHOOK=/webhook/fetch-dms
VITE_N8N_SEND_DM_WEBHOOK=/webhook/send-dm
```

### 3. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```bash
# Copy contents of supabase_migration.sql to Supabase SQL Editor
```

This creates the following tables:
- `profiles` - User profiles
- `social_comments` - Facebook/Instagram comments
- `scheduled_posts` - Scheduled social posts
- `activity_logs` - Audit trail

### 4. n8n Workflow Setup

Import the workflow JSON files from `n8n_workflows/` into your n8n instance:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| 1. Ingest Comments | Every 5 min | Fetch FB/IG comments → Supabase |
| 2. AI Suggest Reply | Every 1 min | Generate AI reply suggestions |
| 3. Send Reply | Webhook | Send approved replies |
| 4. AI Create Post | Webhook | Generate AI post content |
| 5. Scheduler | Every 1 min | Check for due posts |
| 6. Publish Post | Sub-workflow | Post to FB/IG |
| 7. Fetch Social DMs | Webhook | Get Instagram DMs |
| 8. Send Social DM | Webhook | Send Instagram DMs |

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Authentication

The app uses Supabase Auth with email/password login. Users are created manually in Supabase:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password

---

## 📊 Data Flows

### Comment Reply Flow
```
Facebook/Instagram → n8n (Ingest) → Supabase → App (Inbox) 
→ AI Suggestion → User Approval → Copy to Clipboard → Manual Reply
```

### Post Publishing Flow
```
App (Calendar) → Supabase → n8n (Scheduler) → Facebook/Instagram
```

### Content Repurposing Flow
```
Upload Asset → Select Type → AI Processing → Generate Captions → Schedule Post
```

---

## 🔧 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

---

## 📝 License

Private project - All rights reserved.

---

<div align="center">
Made with ❤️ by the KadoshAI Team
</div>
