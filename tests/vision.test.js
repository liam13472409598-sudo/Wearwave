import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisionConfig, normalizeVisionResult, analyzeImage } from '../vision.js';

test('requires an OpenAI vision key in production', () => {
  const result = getVisionConfig({ NODE_ENV: 'production', OPENAI_API_KEY: 'secret' });
  assert.equal(result.enabled, true);
  assert.equal(result.model, 'gpt-4o-mini');
  assert.deepEqual(result.missing, []);
});

test('reports missing vision configuration', () => {
  const result = getVisionConfig({ NODE_ENV: 'production' });
  assert.equal(result.enabled, false);
  assert.deepEqual(result.missing, ['OPENAI_API_KEY']);
});

test('normalizes and bounds a valid vision result', () => {
  const result = normalizeVisionResult({
    isClothing: true,
    confidence: 1.4,
    itemType: 'wide-leg jeans',
    color: 'black',
    material: 'denim',
    fit: 'wide-leg',
    styleTags: ['street', 'minimal', 'vintage', 'y2k', 'outdoor', 'extra'],
    notes: 'A pair of black jeans.'
  });
  assert.deepEqual(result, {
    isClothing: true,
    confidence: 1,
    itemType: 'wide-leg jeans',
    color: 'black',
    material: 'denim',
    fit: 'wide-leg',
    styleTags: ['street', 'minimal', 'vintage', 'y2k', 'outdoor'],
    notes: 'A pair of black jeans.'
  });
});

test('rejects non-object or incomplete vision output', () => {
  assert.throws(() => normalizeVisionResult({ isClothing: true }), /invalid_vision_result/);
  assert.throws(() => normalizeVisionResult(null), /invalid_vision_result/);
});

test('sends the private signed image URL to the vision provider', async () => {
  let request;
  const fakeFetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      output_text: JSON.stringify({
        isClothing: true,
        confidence: 0.94,
        itemType: 'jeans',
        color: 'black',
        material: 'denim',
        fit: 'wide-leg',
        styleTags: ['street'],
        notes: 'Black denim jeans.'
      })
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const result = await analyzeImage({
    apiKey: 'secret',
    model: 'gpt-4o-mini',
    imageUrl: 'https://example.supabase.co/signed-image?token=redacted',
    userTags: { type: 'pants' },
    fetchImpl: fakeFetch
  });

  assert.equal(result.itemType, 'jeans');
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.options.headers.Authorization, 'Bearer secret');
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, 'gpt-4o-mini');
  assert.equal(body.input[0].content[1].image_url, 'https://example.supabase.co/signed-image?token=redacted');
});

test('turns provider failures into a stable error', async () => {
  await assert.rejects(() => analyzeImage({
    apiKey: 'secret',
    model: 'gpt-4o-mini',
    imageUrl: 'https://example.com/image.jpg',
    fetchImpl: async () => new Response('{"error":"bad"}', { status: 401 })
  }), /vision_provider_failed/);
});
