# WOOCE Novel Platform

Platform baca novel, komik, dan cerita pendek — dibangun untuk Mad. Agent name: **Madrols**.

## Features

### Multi-Language Support
- Indonesia (ID) sebagai default, English (EN) sebagai opsi toggle
- Language preference persisted in localStorage
- Translation system: `client/src/lib/i18n.ts` + `client/src/hooks/use-language.tsx`

### Public Pages
- **Home** (`/`) — Halaman utama: hero section, featured card, kategori filter, grid cerita
- **Novel Detail** (`/:slug`) — Hero banner blurred, cover card, CTA baca, season accordion
- **Reading** (`/:slug/:seasonSlug/:chapterSlug`) — Clean reading view dengan pengaturan font, mode, scroll progress

### Admin Dashboard
- **Secure Authentication** — Session-based login (no public registration)
- **Admin URL**: `/admin/novel` — Manage stories, seasons, chapters

## Admin Access

**Login URL:** `/login`

Credentials via environment secrets:
- `ADMIN_USERNAME` — Admin username
- `ADMIN_PASSWORD` — Admin password

## Technology Stack

### Frontend
- React + TypeScript
- TanStack Query v5
- Wouter for routing
- Framer Motion for animations
- Lucide React + react-icons/si
- Shadcn/ui + Tailwind CSS

### Backend
- Node.js + Express
- MongoDB + Mongoose ODM
- Session-based authentication (express-session + connect-mongo)
- Multer + GridFS for file uploads
- RESTful API

## Key Files
- `client/src/pages/public/Novel.tsx` — Halaman utama novel list
- `client/src/pages/public/NovelDetail.tsx` — Halaman detail cerita
- `client/src/pages/public/NovelRead.tsx` — Halaman baca chapter
- `client/src/pages/admin/ManageNovel.tsx` — Admin panel
- `client/src/pages/admin/Login.tsx` — Halaman login
- `client/src/components/layout/Navbar.tsx` — Navbar platform
- `client/src/components/layout/Footer.tsx` — Footer (TikTok, Facebook, Instagram, Email)
- `server/db.ts` — MongoDB schemas (DO NOT TOUCH)
- `server/routes.ts` — API routes

## API Endpoints (Novel)
- `GET /api/novel/stories` — List published stories
- `GET /api/novel/stories/:slug` — Get story by slug
- `PATCH /api/novel/stories/:slug/view` — Increment view count
- `GET /api/novel/stories/:storyId/seasons` — Get seasons
- `GET /api/novel/seasons/:seasonId/chapters` — Get chapters
- `GET /api/novel/read/:slug/season-:n/bab-:n` — Get chapter content

## Environment Variables

### WAJIB — App tidak akan berjalan tanpa ini

> Keempat secret ini HARUS diset sebelum menjalankan aplikasi.

| Secret | Keterangan |
|--------|------------|
| `MONGODB_URI` | Connection string MongoDB (contoh: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`) |
| `ADMIN_USERNAME` | Username untuk login ke halaman admin (`/login`) |
| `ADMIN_PASSWORD` | Password untuk login ke halaman admin |
| `CREDENTIALS_SECRET` | Sandi khusus untuk membuka halaman Kredensial di dashboard admin (beda dari `ADMIN_PASSWORD`) |

### Opsional — Fitur tambahan

Secret di bawah bersifat opsional. App tetap berjalan tanpa keduanya, tapi fitur terkait tidak akan aktif.

| Secret | Keterangan |
|--------|------------|
| `SESSION_SECRET` | String acak untuk enkripsi session (disarankan diisi agar lebih aman) |
| `SITE_URL` | URL publik app, contoh: `https://wooce-novel.replit.app` (digunakan di email template) |
| `GOOGLE_CLIENT_ID` | Client ID Google OAuth (untuk login dengan Google) |
| `GOOGLE_CLIENT_SECRET` | Client Secret Google OAuth (pasangan dari `GOOGLE_CLIENT_ID`) |
| `GMAIL_USER` | Alamat Gmail pengirim notifikasi email |
| `GMAIL_APP_PASSWORD` | App Password Gmail (bukan password biasa — generate di Google Account settings) |

## URL Structure
- `/` — Novel list (homepage)
- `/:slug` — Novel detail page
- `/:slug/:seasonSlug/:chapterSlug` — Reading page
- `/login` — Admin login
- `/admin/novel` — Admin dashboard

## Development
- `npm run dev` — Start dev server (Express + Vite on port 5000)

## Design Preferences (Mad's preferences)
- Bahasa Indonesia sebagai default
- Nama brand: **WOOCE Novel** (bukan Choiril Ahmad)
- Footer: TikTok, Facebook, Instagram, Email (tanpa YouTube, GitHub, Telegram)
- URL bersih tanpa prefix `/novel/` di frontend
- Tab browser: "WOOCE Novel"
