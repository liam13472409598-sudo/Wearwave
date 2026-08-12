import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisionConfig, normalizeVisionResult, analyzeImage, summarizeVisionProviderError, visionSystemPrompt, buildVisionUserPrompt } from '../vision.js';

test('provides safe system and user prompts for clothing analysis', () => {
  assert.match(visionSystemPrompt, /never identify, describe, or infer the person's identity/i);
  assert.match(visionSystemPrompt, /Return only the JSON object/i);
  assert.match(buildVisionUserPrompt({ type: 'pants' }), /User-provided hints may be wrong/i);
  assert.match(buildVisionUserPrompt({ type: 'pants' }), /multiple garments/i);
});

test('summarizes provider errors without exposing credentials', () => {
  assert.deepEqual(summarizeVisionProviderError({ error: { code: 'invalid_api_key', message: 'Incorrect API key provided' } }, 401), {
    status: 401,
    code: 'invalid_api_key',
    message: 'Incorrect API key provided'
  });
});

test('requires an OpenAI vision key in production', () => {
  const result = getVisionConfig({ NODE_ENV: 'production', OPENAI_API_KEY: 'secret' });
  assert.equal(result.enabled, true);
  assert.equal(result.model, 'gpt-4o-mini');
  assert.equal(result.baseUrl, 'https://api.openai.com/v1');
  assert.deepEqual(result.missing, []);
});

test('supports Nous Portal credentials and selects a low-cost vision model', () => {
  const result = getVisionConfig({ NOUS_PORTAL_API_KEY: 'portal-secret', OPENAI_BASE_URL: 'inference-api.nousresearch.com/v1' });
  assert.equal(result.enabled, true);
  assert.equal(result.apiKey, 'portal-secret');
  assert.equal(result.model, 'qwen/qwen3.7-flash');
  assert.equal(result.baseUrl, 'https://inference-api.nousresearch.com/v1');
});

test('reports missing vision configuration', () => {
  const result = getVisionConfig({ NODE_ENV: 'production' });
  assert.equal(result.enabled, false);
  assert.deepEqual(result.missing, ['OPENAI_API_KEY or NOUS_PORTAL_API_KEY']);
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
    baseUrl: 'https://inference-api.nousresearch.com/v1',
    imageUrl: 'https://example.supabase.co/signed-image?token=redacted',
    userTags: { type: 'pants' },
    fetchImpl: fakeFetch
  });

  assert.equal(result.itemType, 'jeans');
  assert.equal(request.url, 'https://inference-api.nousresearch.com/v1/chat/completions');
  assert.equal(request.options.headers.Authorization, 'Bearer secret');
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, 'gpt-4o-mini');
  assert.equal(body.messages[0].role, 'system');
  assert.equal(body.messages[0].content, visionSystemPrompt);
  assert.equal(body.messages[1].role, 'user');
  assert.equal(body.messages[1].content[0].text, buildVisionUserPrompt({ type: 'pants' }));
  assert.equal(body.messages[1].content[1].image_url.url, 'https://example.supabase.co/signed-image?token=redacted');
  assert.equal(body.messages[1].content[0].type, 'text');
  assert.equal(body.include_reasoning, false);
  assert.equal(body.response_format, undefined);
  assert.equal(body.temperature, undefined);
});

test('turns provider failures into a stable error', async () => {
  await assert.rejects(() => analyzeImage({
    apiKey: 'secret',
    model: 'gpt-4o-mini',
    imageUrl: 'https://example.com/image.jpg',
    fetchImpl: async () => new Response('{"error":"bad"}', { status: 401 })
  }), error => error.message === 'vision_provider_failed' && error.providerDetails.status === 401 && error.providerDetails.message === 'bad');
});

test('parses Nous-style chat completion output', async () => {
  const result = await analyzeImage({
    apiKey: 'secret',
    baseUrl: 'https://inference-api.nousresearch.com/v1',
    model: 'qwen/qwen3.7-flash',
    imageUrl: 'https://example.com/image.jpg',
    fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ isClothing: true, confidence: 0.9, itemType: 'shirt', color: 'white', material: 'cotton', fit: 'relaxed', styleTags: ['minimal'], notes: 'White cotton shirt.' }) } }] }), { status: 200 })
  });
  assert.equal(result.itemType, 'shirt');
});

test('parses Nous content parts', async () => {
  const result = await analyzeImage({
    apiKey: 'secret',
    baseUrl: 'https://inference-api.nousresearch.com/v1',
    model: 'qwen/qwen3.7-flash',
    imageUrl: 'https://example.com/image.jpg',
    fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: [{ type: 'text', text: '{"isClothing":true,"confidence":0.9,"itemType":"shirt","color":"white","material":"cotton","fit":"relaxed","styleTags":["minimal"],"notes":"White cotton shirt."}' }] } }] }), { status: 200 })
  });
  assert.equal(result.itemType, 'shirt');
});

test('parses Nous object content wrapper', async () => {
  const result = await analyzeImage({
    apiKey: 'secret',
    baseUrl: 'https://inference-api.nousresearch.com/v1',
    model: 'qwen/qwen3.7-flash',
    imageUrl: 'https://example.com/image.jpg',
    fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: { text: '{"isClothing":true,"confidence":0.9,"itemType":"jacket","color":"black","material":"denim","fit":"relaxed","styleTags":["street"],"notes":"Black denim jacket."}' } } }] }), { status: 200 })
  });
  assert.equal(result.itemType, 'jacket');
});
