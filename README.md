# WEARWAVE

WEARWAVE is a desktop-first outfit discovery prototype with a local Express backend.

## Run

```bash
cd /Users/liamkim/wearwave
npm install
npm run start
```

Open http://127.0.0.1:4173.

## Backend endpoints

- `GET /api/health` — service health
- `POST /api/uploads` — multipart image upload, max 10 MB
- `POST /api/analyze` — local recognition adapter; persists an analysis record
- `GET /api/looks` — outfit catalog, optionally `?style=street`
- `GET /api/saves` — saved look IDs for the `x-client-id` header
- `POST /api/saves/:lookId` — save a look
- `DELETE /api/saves/:lookId` — remove a saved look

## Current boundary

The backend is a working local MVP. Uploads are stored under `uploads/`; analysis records and saves use `data/store.json`. The recognition route is an adapter seam with deterministic demo output, not a production computer-vision model. Replace that adapter with an authenticated vision provider and replace the JSON store with a database before deployment.

The prototype uses public Unsplash image URLs for visual reference. Replace them with licensed, stable assets for production.
