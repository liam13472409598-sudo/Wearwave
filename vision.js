const DEFAULT_MODEL = 'gpt-4o-mini';
const REQUIRED_VISION_VARS = ['OPENAI_API_KEY'];
const allowedStyles = new Set(['street', 'vintage', 'y2k', 'minimal', 'outdoor']);

export function getVisionConfig(env = process.env) {
  const missing = REQUIRED_VISION_VARS.filter(name => !String(env[name] || '').trim());
  return {
    enabled: missing.length === 0,
    missing,
    apiKey: String(env.OPENAI_API_KEY || '').trim(),
    model: String(env.OPENAI_VISION_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL,
    timeoutMs: Math.min(Math.max(Number(env.OPENAI_VISION_TIMEOUT_MS || 30000), 5000), 60000)
  };
}

function boundedString(value, maxLength = 120) {
  return String(value || '').trim().slice(0, maxLength);
}

export function summarizeVisionProviderError(body = {}, status = 0) {
  const source = body?.error && typeof body.error === 'object' ? body.error : body;
  return {
    status: Number(status) || null,
    code: boundedString(source?.code || source?.type || `http_${status}`, 80),
    message: boundedString(source?.message || source?.error || 'Vision provider request failed', 240)
  };
}

export function normalizeVisionResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_vision_result');
  const result = {
    isClothing: value.isClothing === true,
    confidence: Math.min(1, Math.max(0, Number(value.confidence))),
    itemType: boundedString(value.itemType),
    color: boundedString(value.color),
    material: boundedString(value.material),
    fit: boundedString(value.fit),
    styleTags: Array.isArray(value.styleTags) ? value.styleTags.map(tag => boundedString(tag, 30).toLowerCase()).filter(tag => allowedStyles.has(tag)).slice(0, 5) : [],
    notes: boundedString(value.notes, 500)
  };
  if (!Number.isFinite(result.confidence) || !result.itemType || !result.color || !result.material || !result.fit || !result.notes) throw new Error('invalid_vision_result');
  return result;
}

const outputSchema = {
  type: 'object',
  properties: {
    isClothing: { type: 'boolean' },
    confidence: { type: 'number' },
    itemType: { type: 'string' },
    color: { type: 'string' },
    material: { type: 'string' },
    fit: { type: 'string' },
    styleTags: { type: 'array', items: { type: 'string', enum: [...allowedStyles] } },
    notes: { type: 'string' }
  },
  required: ['isClothing', 'confidence', 'itemType', 'color', 'material', 'fit', 'styleTags', 'notes'],
  additionalProperties: false
};

function parseResponseBody(body) {
  if (typeof body?.output_text === 'string') return JSON.parse(body.output_text);
  const text = body?.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
  if (typeof text === 'string') return JSON.parse(text);
  throw new Error('vision_empty_response');
}

export async function analyzeImage({ apiKey, model = DEFAULT_MODEL, imageUrl, userTags = {}, fetchImpl = fetch, timeoutMs = 30000 }) {
  if (!apiKey || !imageUrl) throw new Error('vision_input_missing');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: [{ role: 'user', content: [
          { type: 'input_text', text: `Identify the single clothing item in this image. User-provided hints, which may be wrong: ${JSON.stringify(userTags)}. Do not identify a person. If this is not a clear clothing item, set isClothing to false and explain why in notes.` },
          { type: 'input_image', image_url: imageUrl, detail: 'low' }
        ] }],
        text: { format: { type: 'json_schema', name: 'wearwave_clothing_analysis', strict: true, schema: outputSchema } },
        max_output_tokens: 500
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error('vision_provider_failed');
      error.providerDetails = summarizeVisionProviderError(body, response.status);
      throw error;
    }
    return normalizeVisionResult(parseResponseBody(body));
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('vision_timeout');
    if (/^vision_/.test(error?.message || '')) throw error;
    throw new Error('vision_provider_failed');
  } finally {
    clearTimeout(timeout);
  }
}

export const visionOutputSchema = outputSchema;
export const defaultVisionModel = DEFAULT_MODEL;
