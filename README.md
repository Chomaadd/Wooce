# Personal Portfolio Website - Choiril Ahmad (iamchomad.my.id)

A personal portfolio website with blog, brand showcase, music collection, and contact functionality. Features an elegant black/white theme toggle and secure admin dashboard for content management. Agent name: **Madrols**.

## Features

### Multi-Language Support
- English (EN) and Indonesian (ID) with toggle in navbar
- Language preference persisted in localStorage
- All public page UI text translated via i18n; dynamic content from DB stays as-is
- Availability status label always translated through i18n (NOT from DB string directly)
- Translation system: `client/src/lib/i18n.ts` + `client/src/hooks/use-language.tsx`
- **i18n keys for availability:** `home.activity.openwork`, `home.activity.curentlybusy` (typo: one 'r'), `home.activity.notavailable`

### Public Pages
- **Home** (`/`) - Landing page with hero avatar, status badge, animated heading, and 3-col blog grid (simple, no complex asymmetric layout)
- **About** (`/about`) - Redesigned: photo panel left (lg:sticky lg:top-24), stats row, text content right with badge/heading/quote card/3 highlight cards; **"Now" section** (Discord Lanyard live status + manual fallback for listening/reading/working/location); Skills section 4 categories; dark CTA section at bottom
- **Blog** (`/blog`) - Full-bleed cinematic featured post with overlay; grid cards with read time badge, tags, date/views footer; search bar; tag filter. Article count NOT shown in header.
- **BlogPost** (`/blog/:slug`) - Cover image contained in max-w-5xl (aspect-video, rounded-2xl); tags before title; excerpt with left accent border; TOC card sidebar (desktop only); large reaction buttons; share buttons
- **Brand** (`/brand`) - Full-bleed cinematic featured card; grid cards below; project count NOT shown in header
- **Music** (`/music`) - Music collection player with auto-play support and queue
- **Resume** (`/resume`) - Card header with photo/name/jobTitle/contact info; timeline for experience/education; skills grid; PDF print page at `/resume/pdf`
- **Contact** (`/contact`) - 2-column layout: contact info cards left, message form right; stacks vertically on mobile
- **Links** (`/links`) - Linktree-style page with:
  - Larger avatar (w-32 h-32)
  - Custom background image support (with dark overlay, NO `background-attachment: fixed` — iOS bug)
  - 5 border styles: `default` (rounded-2xl), `pill` (rounded-full), `sharp` (rounded-md), `dashed` (border-2 dashed), `glow` (shadow, no border)
  - Colors adapt automatically based on whether background image is present
- **Novel & Komik** (`/novel`) - Reading platform for stories with grid cover display, search & category filter
  - Story detail (`/novel/:slug`) - Synopsis, season & chapter accordion list; **view count** (👁) auto-incremented on page load via PATCH endpoint, displayed next to chapter count
  - Reading page (`/novel/:slug/season-:n/bab-:n`) - Clean reading view with prev/next chapter navigation
  - Supports categories: novel, komik, cerpen, puisi, lainnya; statuses: ongoing, completed, hiatus

### Admin Dashboard
- **Secure Authentication** - Session-based login (no public registration)
- **Custom Confirm Dialogs** - All delete confirmations use shadcn AlertDialog via `useConfirm()` hook (prevents "OKE" text in Indonesian Chrome)
- **Dashboard** (`/admin`) - Overview stats; availability status dropdown (bilingual, uses i18n)
- **Analytics** (`/admin/analytics`) - Total/today/week/month views, 30-day bar chart, top pages, device breakdown
- **Blog Management** (`/admin/blog`) - Create, edit, delete blog posts with rich text editor and image uploads
- **Brand Management** (`/admin/brand`) - Manage brand portfolio items; featured toggle; grid/list view
- **Music Management** (`/admin/music`) - Add/manage music tracks with auto-duration detection
- **Resume Management** (`/admin/resume`) - Manage resume items (experience, education, skills) with ordering. Profile Info tab for full name, job title, about, photo, birth date, nationality, phone, address, email, website
- **Links Management** (`/admin/links`) - Add/edit/delete links; Page Profile section with:
  - Avatar upload with circular crop (react-easy-crop)
  - Name and bio fields
  - **Background Image**: upload or paste URL, preview, remove button
  - **Border Style picker**: 5 options (Rounded/Pill/Sharp/Dashed/Glow) with visual previews, auto-saves on click
  - Grid: 3 cols on mobile, 5 cols on sm+
- **Messages** (`/admin/messages`) - View and manage contact form messages
- **Settings** (`/admin/settings`) - Site Identity (title, name, owner name), SEO (meta description, keywords, OG image with preview), Photos (profile/about photos), **"Now" section** (Discord User ID for Lanyard, manual fields: nowListening/nowReading/nowWorking/nowLocation)

## Admin Access

**Login URL:** `/login`

Credentials via environment secrets:
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password

## Technology Stack

### Frontend
- React with TypeScript
- TanStack Query v5 for data fetching
- Wouter for routing
- Framer Motion for animations
- Lucide React + react-icons/si for icons
- Shadcn/ui components
- Tailwind CSS
- react-easy-crop for image cropping

### Backend
- Node.js with Express
- **MongoDB** with Mongoose ODM (strict mode — all new fields MUST be added to `server/db.ts` Mongoose schema)
- Session-based authentication (express-session + connect-mongo)
- Multer for file uploads (stored in MongoDB GridFS)
- music-metadata for audio duration extraction
- RESTful API design

### Data Collections (MongoDB)
- `blogposts` - Blog articles with images
- `contactmessages` - Visitor messages
- `musictracks` - Music collection
- `branditems` - Brand portfolio
- `resumeitems` - Resume/CV items
- `sitesettings` - All site settings (one document)
- `linkitems` - Links page items
- `pageviews` - Analytics data

## Key Files
- `client/src/pages/public/Home.tsx` — Hero + simple 3-col blog grid
- `client/src/pages/public/Blog.tsx` — Featured cinematic post, grid cards with badges
- `client/src/pages/public/BlogPost.tsx` — Reading page, contained image, TOC sidebar
- `client/src/pages/public/About.tsx` — Photo panel left (lg:sticky), skills, dark CTA
- `client/src/pages/public/Brand.tsx` — Full-bleed featured card
- `client/src/pages/public/Contact.tsx` — 2-col layout
- `client/src/pages/public/Resume.tsx` — Card header + timeline
- `client/src/pages/public/Links.tsx` — Background image, 5 border styles, large avatar
- `client/src/pages/admin/ManageLinks.tsx` — Background upload, border picker, avatar crop
- `shared/schema.ts` — Zod schemas including siteSettingsSchema with linksBackgroundUrl, linksBorderStyle
- `server/db.ts` — Mongoose schemas (ALL new fields must be added here)
- `server/routes.ts` — API routes
- `server/storage.ts` — Storage interface + MongoDB implementation

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Get current user

### Blog
- `GET /api/blog` - List all posts
- `GET /api/blog/:slug` - Get post by slug
- `POST /api/blog` - Create post (auth)
- `PUT /api/blog/:id` - Update post (auth)
- `DELETE /api/blog/:id` - Delete post (auth)
- `POST /api/blog/:slug/view` - Increment view count (public)
- `POST /api/blog/:slug/react` - Add reaction `{ type: 'thumbsUp' | 'heart' }` (public, localStorage dedup)

### Novel
- `GET /api/novel/stories` - List published stories
- `GET /api/novel/stories/:slug` - Get story by slug
- `PATCH /api/novel/stories/:slug/view` - Increment view count (public, returns `{ viewCount: number }`)

### Settings
- `GET /api/settings` - Get site settings
- `PUT /api/settings` - Update settings (auth)

### Links
- `GET /api/links` - List link items
- `POST /api/links` - Create link (auth)
- `PUT /api/links/:id` - Update link (auth)
- `DELETE /api/links/:id` - Delete link (auth)

### File Upload
- `POST /api/upload` - Upload file (auth, returns URL + duration for audio)

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `GMAIL_USER` - Gmail address for contact form notifications
- `GMAIL_APP_PASSWORD` - Gmail app password for nodemailer
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password
- `SESSION_SECRET` - Session encryption secret
- `PORT` - Server port (default: 5000)

## Development
- `npm run dev` - Start development server (Express + Vite on port 5000)
- Vite root is project root; public dir is `public/` NOT `client/public/`
- Upload files stored in MongoDB GridFS, served at `/uploads/:filename`

## Critical Implementation Notes
- **Mongoose strict mode**: Any new field in siteSettings MUST be added to `server/db.ts` siteSettingsSchema, otherwise it's silently ignored
- `use-confirm.tsx` hook: `const { confirm: showConfirm, ConfirmDialog } = useConfirm()`
- Avatar/photo crop uses `react-easy-crop` (getCroppedBlob helper)
- All upload fetch calls include `credentials: "include"` for session auth
- Blog posts use slug-based URLs
- MongoDB `_id` mapped to `id` string via `mapId<T>()` helper

## Design Preferences (Mad's preferences)
- Likes full-bleed overlay cards (Blog featured, Brand featured) — cinematic style
- Dislikes overly complex asymmetric layouts on Home — keep simple 3-col grid
- Article/project count numbers NOT shown on page headers
- BlogPost cover image: contained (not full-width), aspect-video, rounded-2xl
- Photo sticky only on desktop (`lg:sticky lg:top-24`), not mobile
- NO `background-attachment: fixed` (iOS Safari bug)

## Blog Update Convention
- Setiap ada pembaruan website, buat **postingan baru terpisah** di blog dengan tag "Update"
- **Tunggu semua pekerjaan satu sesi selesai**, baru rangkum jadi satu postingan — jangan post satu per satu
- **Tunjukkan draf dulu ke Mad** sebelum diposting — jangan langsung posting tanpa review
- Format judul: `Pembaruan Website — [ringkasan singkat]`
- Slug: `pembaruan-[kata-kunci-singkat]`
- Ikuti template postingan sebelumnya: intro paragraph, h2 per section dengan emoji, ul/li untuk detail
- Banner bisa diupload sendiri oleh Mad melalui Admin → Blog
