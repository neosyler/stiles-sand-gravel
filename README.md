# Stiles Sand & Gravel Website

Production-ready monorepo for `stilessandgravel.com` with:

- `apps/web`: Angular standalone app with SSR build support, lazy routes, SEO metadata, LocalBusiness schema, and media-driven pages.
- `apps/api`: Node.js + Express + TypeScript API with security middleware, media indexing from root `/media`, SQLite quote storage, and optional SMTP notifications.

## Project Structure

- `apps/web` Angular SSR-ready frontend
- `apps/api` Express backend + API + SSR host
- `media` root-level business owner photos/videos (auto-indexed)
- `dist` build output (generated)
- `data/quotes.db` SQLite file (generated at runtime)

## Setup

1. Install dependencies:

```bash
npm install
```

2. (Optional) Create env file:

```bash
cp .env.example .env
```

3. Run development mode:

```bash
npm run dev
```

- Angular dev server: `http://localhost:4200`
- API server: `http://localhost:3000`

## Build + Start (Production)

```bash
npm run build
npm run start
```

This runs one Node process (`apps/api`) that serves:

- API routes under `/api`
- static `/media` files from repo root
- Angular SSR/static output from `dist/apps/web`

## API Endpoints

- `GET /api/health`
- `GET /api/media`
- `POST /api/quote-request`

Quote request payload:

- `name` (required)
- `phone` (required)
- `email` (optional)
- `address` (optional)
- `city` (optional)
- `materialNeeded` (optional)
- `quantityYards` (optional)
- `preferredDeliveryDate` (optional)
- `notes` (optional)

## Media Management

Drop files directly into root `media/`:

- supported image formats: `.jpg`, `.jpeg`, `.png`, `.webp`
- supported video formats: `.mp4`

The backend auto-categorizes by filename keywords:

- hero: `truck`, `dump`, `delivery`, `hauler`, `load`, `trailer`
- services: `grading`, `grapple`, `brush`, `wood`, `clearing`, `skid`, etc.
- materials: `sand`, `gravel`, `stone`, `topsoil`, etc.
- everything else falls into gallery

No manual asset imports are needed. Restart server or call `POST /api/media/refresh` to force refresh.

## Environment Variables

See `.env.example`.

Important variables:

- `PORT` (default `3000`)
- `MEDIA_DIR` (defaults to `<repo>/media`)
- `SQLITE_PATH` (defaults to `<repo>/data/quotes.db`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `NOTIFY_EMAIL`
- `TURNSTILE_SECRET` (Cloudflare Turnstile secret key for form verification)

## Bot Protection

- Quote endpoint uses server-side rate limiting.
- Hidden honeypot field blocks basic bot form submissions.
- Optional Cloudflare Turnstile validation is enforced when `TURNSTILE_SECRET` is configured.
- Frontend site key is set in `apps/web/src/app/config/business.config.ts` at `security.turnstileSiteKey`.

## Deployment (Ubuntu + pm2 + nginx + SSL)

1. Install Node LTS + npm.
2. Clone repo and run `npm install`.
3. Build app: `npm run build`.
4. Start with pm2:

```bash
pm2 start npm --name stilessandgravel -- start
pm2 save
pm2 startup
```

5. Configure nginx reverse proxy:

```nginx
server {
  server_name stilessandgravel.com www.stilessandgravel.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

6. Enable SSL:

```bash
sudo certbot --nginx -d stilessandgravel.com -d www.stilessandgravel.com
```

## SEO Features Included

- SSR route rendering support
- unique title/description + canonical per route
- JSON-LD `LocalBusiness` schema
- `robots.txt` and `sitemap.xml`
- descriptive alt text and explicit image dimensions
- route lazy-loading + deferred map loading
