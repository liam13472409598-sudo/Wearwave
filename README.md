# WEARWAVE

WEARWAVE is a desktop-first outfit discovery web app with an Express backend.

## Local run

```bash
cd /Users/liamkim/wearwave
npm install
npm run start
```

Open http://127.0.0.1:4173.

## Implemented product behavior

- Real browser camera permission flow with a fallback to image upload
- Multipart image upload with a 10 MB limit and file-signature validation
- Email/password registration, login, logout, and HttpOnly session cookies
- Password hashing with bcrypt
- Persistent user-specific saves
- Analysis records associated with the signed-in user and uploaded asset
- Security headers through Helmet, compression, API/auth/upload rate limits, origin checks, and atomic file writes
- Bilingual UI and responsive editorial layout

## API

- `GET /api/health` — service health
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — create session
- `POST /api/auth/logout` — clear session
- `GET /api/auth/me` — current session
- `POST /api/uploads` — multipart image upload, max 10 MB
- `POST /api/analyze` — recognition adapter; persists an analysis record
- `GET /api/looks` — outfit catalog, optionally `?style=street`
- `GET /api/saves` — signed-in user's saved look IDs
- `POST /api/saves/:lookId` — save a look
- `DELETE /api/saves/:lookId` — remove a look

All save routes require a signed-in session. Anonymous client IDs are no longer accepted for persistence.

## Production configuration

Copy `.env.example` to `.env` only for local configuration. Never commit secrets.

Required for production:

```text
NODE_ENV=production
DATABASE_URL=postgres://...
# UPLOAD_DIR=/persistent/path/uploads
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=server-only-secret
# SUPABASE_STORAGE_BUCKET=wearwave-user-assets
```

The server refuses to start in production without `DATABASE_URL` unless `ALLOW_FILE_STORE=true` is explicitly set. The JSON file store is only a local fallback and is not appropriate for a multi-instance deployment.

Production uploads use a private Supabase Storage bucket configured with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`. The server keeps only image metadata in the Postgres-backed store and returns short-lived signed URLs. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the browser.

The recognition route currently uses a deterministic local adapter. Replace it with an authenticated vision provider behind `/api/analyze`; keep provider keys server-side in environment variables.

The current look images are public Unsplash references. Replace them with licensed, stable, production-hosted assets before public launch.

## Deployment

For Render/Railway:

- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Add `NODE_ENV=production` and `DATABASE_URL`
- Add a persistent volume for `UPLOAD_DIR`, or implement object storage before relying on user uploads
- Use HTTPS and a custom domain in the platform settings

## Checks

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

The app intentionally does not claim that the local recognition adapter is real AI or that public reference imagery is licensed for commercial use; both are explicit replacement boundaries.
