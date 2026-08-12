import test from 'node:test';
import assert from 'node:assert/strict';
import { getStorageConfig, buildAssetPath } from '../storage.js';

test('requires all Supabase storage settings in production', () => {
  const result = getStorageConfig({
    NODE_ENV: 'production',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'secret',
    SUPABASE_STORAGE_BUCKET: 'wearwave-user-assets'
  });
  assert.equal(result.enabled, true);
  assert.deepEqual(result.missing, []);
});

test('reports missing Supabase storage settings', () => {
  const result = getStorageConfig({ NODE_ENV: 'production', SUPABASE_URL: 'https://example.supabase.co' });
  assert.equal(result.enabled, false);
  assert.deepEqual(result.missing, ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET']);
});

test('builds an isolated user asset path', () => {
  assert.equal(buildAssetPath('user-123', 'asset-456', 'jpg'), 'user-123/asset-456.jpg');
});

test('rejects unsafe asset path components', () => {
  assert.throws(() => buildAssetPath('../user', 'asset-456', 'jpg'), /invalid_asset_path/);
});
