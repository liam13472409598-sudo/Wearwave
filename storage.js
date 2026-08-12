const REQUIRED_STORAGE_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET'];

export function getStorageConfig(env = process.env) {
  const missing = REQUIRED_STORAGE_VARS.filter(name => !String(env[name] || '').trim());
  return {
    enabled: missing.length === 0,
    missing,
    url: String(env.SUPABASE_URL || '').trim(),
    serviceRoleKey: String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    bucket: String(env.SUPABASE_STORAGE_BUCKET || '').trim()
  };
}

function safePart(value) {
  return /^[a-zA-Z0-9-]+$/.test(value);
}

export function buildAssetPath(userId, assetId, extension) {
  if (!safePart(userId) || !safePart(assetId) || !/^[a-z0-9]+$/.test(extension)) {
    throw new Error('invalid_asset_path');
  }
  return `${userId}/${assetId}.${extension}`;
}

export const storageLimits = {
  maxImageBytes: 6 * 1024 * 1024,
  allowedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
};
