import express from 'express';
import multer from 'multer';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { fileTypeFromBuffer } from 'file-type';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { buildAssetPath, getStorageConfig, summarizeStorageError } from './storage.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 4173);
const isProduction = process.env.NODE_ENV === 'production';
const uploadDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
const storePath = path.join(dataDir, 'store.json');
const databaseUrl = process.env.DATABASE_URL || '';
const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl, max: Number(process.env.DB_POOL_SIZE || 10), ssl: isProduction ? { rejectUnauthorized: false } : undefined }) : null;
const sessionCookie = 'wearwave_session';
const sessionTtlMs = 30 * 24 * 60 * 60 * 1000;
const maxImageBytes = 6 * 1024 * 1024;
const allowedImageTypes = new Set(['jpg', 'png', 'webp', 'heic', 'heif']);
const storageConfig = getStorageConfig(process.env);
const supabase = storageConfig.enabled ? createClient(storageConfig.url, storageConfig.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxImageBytes, files: 1 }
});

const lookCatalog = [
  { id:'street-night', styleKey:'street', styleZh:'街头', styleEn:'STREET', titleZh:'城市夜行。', titleEn:'City after dark.', creator:'@kai.makes', location:'New York, NY', match:94, image:'image-look-one', avatar:'avatar-one' },
  { id:'vintage-history', styleKey:'vintage', styleZh:'复古', styleEn:'VINTAGE', titleZh:'用一点旧时光，重写今天。', titleEn:'Rewrite today with a little history.', creator:'@mila.archive', location:'London, UK', match:91, image:'image-look-two', avatar:'avatar-two' },
  { id:'y2k-rules', styleKey:'y2k', styleZh:'Y2K', styleEn:'Y2K', titleZh:'不按规则穿，才像你。', titleEn:'The rules are not the look.', creator:'@nora.form', location:'Seoul, KR', match:88, image:'image-look-three', avatar:'avatar-three' },
  { id:'minimal-weight', styleKey:'minimal', styleZh:'极简', styleEn:'MINIMAL', titleZh:'少一点，更有重量。', titleEn:'Less, with more weight.', creator:'@soren.studio', location:'Copenhagen, DK', match:84, image:'image-look-four', avatar:'avatar-four' }
];

let storeWriteQueue = Promise.resolve();

async function readStore() {
  if (pool) {
    const result = await pool.query('SELECT data FROM wearwave_store WHERE id = 1');
    if (result.rowCount) return result.rows[0].data;
    const initial = { users: [], sessions: {}, saves: {}, analyses: [], assets: [] };
    await pool.query('INSERT INTO wearwave_store (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING', [JSON.stringify(initial)]);
    return initial;
  }
  if (isProduction && process.env.ALLOW_FILE_STORE !== 'true') throw new Error('production_database_required');
  try {
    const parsed = JSON.parse(await fs.readFile(storePath, 'utf8'));
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      saves: parsed.saves && typeof parsed.saves === 'object' ? parsed.saves : {},
      analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
      assets: Array.isArray(parsed.assets) ? parsed.assets : []
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const initial = { users: [], sessions: {}, saves: {}, analyses: [], assets: [] };
    await fs.writeFile(storePath, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeStore(store) {
  storeWriteQueue = storeWriteQueue.then(async () => {
    if (pool) {
      await pool.query('INSERT INTO wearwave_store (id, data, updated_at) VALUES (1, $1::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()', [JSON.stringify(store)]);
      return;
    }
    if (isProduction && process.env.ALLOW_FILE_STORE !== 'true') throw new Error('production_database_required');
    const temporaryPath = `${storePath}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(store, null, 2));
    await fs.rename(temporaryPath, storePath);
  });
  return storeWriteQueue;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim().split('=')) .filter(([key, value]) => key && value).map(([key, ...value]) => [key, decodeURIComponent(value.join('='))]));
}

function setSessionCookie(res, token) {
  const flags = [`${sessionCookie}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.floor(sessionTtlMs / 1000)}`];
  if (isProduction) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
}

function clearSessionCookie(res) {
  const flags = [`${sessionCookie}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProduction) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
}

async function getCurrentUser(req) {
  const token = parseCookies(req.headers.cookie || '')[sessionCookie];
  if (!token) return null;
  const store = await readStore();
  const session = store.sessions[hashToken(token)];
  if (!session || session.expiresAt < Date.now()) return null;
  return store.users.find(user => user.id === session.userId) || null;
}

function publicUser(user) {
  return user ? { id: user.id, email: user.email, createdAt: user.createdAt } : null;
}

function requireSameOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (origin && origin !== `${req.protocol}://${req.get('host')}`) return res.status(403).json({ ok:false, error:'origin_not_allowed' });
  next();
}

async function requireUser(req, res, next) {
  try {
    req.user = await getCurrentUser(req);
    if (!req.user) return res.status(401).json({ ok:false, error:'authentication_required' });
    next();
  } catch (error) {
    next(error);
  }
}

function saveKey(req) {
  return req.user?.id || String(req.header('x-client-id') || 'anonymous').slice(0, 120);
}

if (isProduction && !databaseUrl && process.env.ALLOW_FILE_STORE !== 'true') throw new Error('DATABASE_URL is required in production');
if (isProduction && !storageConfig.enabled) throw new Error(`Supabase Storage configuration is incomplete: ${storageConfig.missing.join(', ')}`);
if (pool) await pool.query('CREATE TABLE IF NOT EXISTS wearwave_store (id INTEGER PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(dataDir, { recursive: true });
await readStore();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, { index: 'index.html', maxAge: isProduction ? '1h' : 0 }));
app.use('/uploads', express.static(uploadDir, { maxAge: isProduction ? '1d' : 0 }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
app.use('/api', apiLimiter);

app.get('/api/health', async (_req, res) => {
  let database = 'file';
  if (pool) {
    try { await pool.query('SELECT 1'); database = 'postgres'; }
    catch (_) { return res.status(503).json({ ok:false, service:'wearwave', error:'database_unavailable' }); }
  }
  let storage = storageConfig.enabled ? 'supabase' : 'local';
  if (supabase) {
    const { error } = await supabase.storage.getBucket(storageConfig.bucket);
    if (error) storage = 'supabase_misconfigured';
  }
  res.json({ ok:true, service:'wearwave', mode:isProduction ? 'production-adapter' : 'local-backend', database, storage });
});

app.post('/api/auth/register', authLimiter, requireSameOrigin, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok:false, error:'invalid_email' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ ok:false, error:'password_length' });
    const store = await readStore();
    if (store.users.some(user => user.email === email)) return res.status(409).json({ ok:false, error:'email_in_use' });
    const user = { id:crypto.randomUUID(), email, passwordHash:await bcrypt.hash(password, 12), createdAt:new Date().toISOString() };
    store.users.push(user);
    const token = crypto.randomBytes(32).toString('hex');
    store.sessions[hashToken(token)] = { userId:user.id, expiresAt:Date.now() + sessionTtlMs };
    await writeStore(store);
    setSessionCookie(res, token);
    res.status(201).json({ ok:true, user:publicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', authLimiter, requireSameOrigin, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const store = await readStore();
    const user = store.users.find(candidate => candidate.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ ok:false, error:'invalid_credentials' });
    const token = crypto.randomBytes(32).toString('hex');
    store.sessions[hashToken(token)] = { userId:user.id, expiresAt:Date.now() + sessionTtlMs };
    await writeStore(store);
    setSessionCookie(res, token);
    res.json({ ok:true, user:publicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', requireSameOrigin, async (req, res, next) => {
  try {
    const token = parseCookies(req.headers.cookie || '')[sessionCookie];
    const store = await readStore();
    if (token) delete store.sessions[hashToken(token)];
    await writeStore(store);
    clearSessionCookie(res);
    res.json({ ok:true });
  } catch (error) { next(error); }
});

app.use('/api', async (req, _res, next) => {
  try {
    req.user = req.user || await getCurrentUser(req);
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', async (req, res, next) => {
  try { res.json({ ok:true, user:publicUser(await getCurrentUser(req)) }); } catch (error) { next(error); }
});

app.post('/api/uploads', uploadLimiter, requireSameOrigin, requireUser, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok:false, error:'image_required' });
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !allowedImageTypes.has(detected.ext)) return res.status(415).json({ ok:false, error:'unsupported_image_type' });
    if (!supabase) return res.status(503).json({ ok:false, error:'storage_unavailable' });
    const assetId = crypto.randomUUID();
    const storagePath = buildAssetPath(req.user.id, assetId, detected.ext);
    const { error: uploadError } = await supabase.storage.from(storageConfig.bucket).upload(storagePath, req.file.buffer, { contentType: detected.mime, upsert: false });
    if (uploadError) {
      console.error('[storage-upload]', JSON.stringify({ ...summarizeStorageError(uploadError), bucket:storageConfig.bucket }));
      return res.status(502).json({ ok:false, error:'storage_upload_failed' });
    }
    const { data: signed, error: signedError } = await supabase.storage.from(storageConfig.bucket).createSignedUrl(storagePath, 900);
    if (signedError) {
      await supabase.storage.from(storageConfig.bucket).remove([storagePath]);
      return res.status(502).json({ ok:false, error:'storage_url_failed' });
    }
    const store = await readStore();
    store.assets = Array.isArray(store.assets) ? store.assets : [];
    store.assets.push({ id:assetId, userId:req.user.id, storagePath, originalName:req.file.originalname, mimeType:detected.mime, size:req.file.size, createdAt:new Date().toISOString() });
    try {
      await writeStore(store);
    } catch (error) {
      await supabase.storage.from(storageConfig.bucket).remove([storagePath]);
      throw error;
    }
    res.status(201).json({ ok:true, asset:{ id:assetId, url:signed.signedUrl, originalName:req.file.originalname, mimeType:detected.mime, size:req.file.size } });
  } catch (error) { next(error); }
});

app.get('/api/assets/:assetId', requireUser, async (req, res, next) => {
  try {
    const store = await readStore();
    const asset = (store.assets || []).find(item => item.id === req.params.assetId && item.userId === req.user.id && !item.deletedAt);
    if (!asset) return res.status(404).json({ ok:false, error:'asset_not_found' });
    const { data, error } = await supabase.storage.from(storageConfig.bucket).createSignedUrl(asset.storagePath, 900);
    if (error) return res.status(502).json({ ok:false, error:'storage_url_failed' });
    res.json({ ok:true, asset:{ id:asset.id, url:data.signedUrl, originalName:asset.originalName, mimeType:asset.mimeType, size:asset.size, createdAt:asset.createdAt } });
  } catch (error) { next(error); }
});

app.delete('/api/assets/:assetId', requireUser, requireSameOrigin, async (req, res, next) => {
  try {
    if (!supabase) return res.status(503).json({ ok:false, error:'storage_unavailable' });
    const store = await readStore();
    const asset = (store.assets || []).find(item => item.id === req.params.assetId && item.userId === req.user.id && !item.deletedAt);
    if (!asset) return res.status(404).json({ ok:false, error:'asset_not_found' });
    const { error } = await supabase.storage.from(storageConfig.bucket).remove([asset.storagePath]);
    if (error) return res.status(502).json({ ok:false, error:'storage_delete_failed' });
    asset.deletedAt = new Date().toISOString();
    await writeStore(store);
    res.json({ ok:true, deleted:true });
  } catch (error) { next(error); }
});

app.post('/api/analyze', requireSameOrigin, async (req, res, next) => {
  try {
    const tags = req.body?.tags || {};
    const analysis = { id:crypto.randomUUID(), createdAt:new Date().toISOString(), userId:req.user?.id || null, assetId:req.body?.assetId || null, tags:{ color:tags.color || '黑色', material:tags.material || '牛仔', fit:tags.fit || '宽腿', type:tags.type || '裤子' }, lookIds:lookCatalog.map(look => look.id) };
    const store = await readStore();
    store.analyses.push(analysis);
    await writeStore(store);
    res.json({ ok:true, status:'completed', source:process.env.AI_PROVIDER || 'local-recognition-adapter', ...analysis });
  } catch (error) { next(error); }
});

app.get('/api/looks', (req, res) => {
  const style = req.query.style;
  res.json({ ok:true, source:'local-catalog', looks:style ? lookCatalog.filter(look => look.styleKey === style) : lookCatalog });
});

app.get('/api/saves', requireUser, async (req, res, next) => {
  try { const store = await readStore(); res.json({ ok:true, lookIds:store.saves[saveKey(req)] || [] }); } catch (error) { next(error); }
});

app.post('/api/saves/:lookId', requireUser, requireSameOrigin, async (req, res, next) => {
  try {
    if (!lookCatalog.some(look => look.id === req.params.lookId)) return res.status(404).json({ ok:false, error:'look_not_found' });
    const store = await readStore();
    const current = new Set(store.saves[saveKey(req)] || []);
    current.add(req.params.lookId);
    store.saves[saveKey(req)] = [...current];
    await writeStore(store);
    res.status(201).json({ ok:true, lookIds:store.saves[saveKey(req)] });
  } catch (error) { next(error); }
});

app.delete('/api/saves/:lookId', requireUser, requireSameOrigin, async (req, res, next) => {
  try {
    const store = await readStore();
    store.saves[saveKey(req)] = (store.saves[saveKey(req)] || []).filter(id => id !== req.params.lookId);
    await writeStore(store);
    res.json({ ok:true, lookIds:store.saves[saveKey(req)] });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ ok:false, error:error.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : error.code });
  if (error) return res.status(500).json({ ok:false, error:'server_error' });
  res.status(500).json({ ok:false, error:'unknown_error' });
});

app.listen(port, () => console.log(`WEARWAVE backend listening on http://127.0.0.1:${port}`));
