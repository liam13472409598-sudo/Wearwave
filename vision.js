const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const NOUS_BASE_URL = 'https://inference-api.nousresearch.com/v1';
const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';
const NOUS_DEFAULT_MODEL = 'qwen/qwen3.7-flash';
const REQUIRED_VISION_VARS = ['OPENAI_API_KEY or NOUS_PORTAL_API_KEY'];
const allowedStyles = new Set(['street', 'vintage', 'y2k', 'minimal', 'outdoor']);

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return OPENAI_BASE_URL;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export const visionSystemPrompt = `You are WEARWAVE's clothing-vision classifier. Analyze only the clothing item in the supplied image; never identify, describe, or infer the person's identity, age, body, attractiveness, ethnicity, or other sensitive traits. Return only the JSON object required by the schema.

Your job is to identify one primary clothing item for outfit discovery. Be conservative: if the image is not a clear, single, wearable clothing item, set isClothing to false. Do not invent brand names, prices, or details that are not visually supported. Ignore user hints when they conflict with the image.

Use short, concrete English labels. For styleTags, choose only labels supported by the image from: street, vintage, y2k, minimal, outdoor. Confidence must be between 0 and 1. Notes must briefly explain the visible evidence or why the image is unclear. Do not include markdown, commentary, or extra keys.`;

export function buildVisionUserPrompt(userTags = {}) {
  return `Classify the single primary clothing item in this image for WEARWAVE outfit matching. User-provided hints may be wrong; use them only as weak context: ${JSON.stringify(userTags)}.

Inspect these properties when visible: garment category, dominant color, material or surface, fit or silhouette, and compatible style signals. If there are multiple garments, choose the most prominent one only when it is clearly separable; otherwise mark the image as not a clear single item. If the image is not clothing, is too blurry, mostly obstructed, or shows a person wearing several inseparable items, set isClothing to false.`;
}

export function getVisionConfig(env = process.env) {
  const apiKey = String(env.OPENAI_API_KEY || env.NOUS_PORTAL_API_KEY || env.NOUS_API_KEY || '').trim();
  const baseUrl = normalizeBaseUrl(env.OPENAI_BASE_URL || env.NOUS_BASE_URL || OPENAI_BASE_URL);
  const isNous = baseUrl === NOUS_BASE_URL || baseUrl.includes('inference-api.nousresearch.com');
  const missing = apiKey ? [] : REQUIRED_VISION_VARS;
  return {
    enabled: missing.length === 0,
    missing,
    apiKey,
    baseUrl,
    model: String(env.OPENAI_VISION_MODEL || (isNous ? NOUS_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL)).trim() || (isNous ? NOUS_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL),
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
  const parseJsonText = value => {
    if (typeof value !== 'string') return null;
    const cleaned = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  };
  const extractText = (value, depth = 0) => {
    if (depth > 5 || value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(item => extractText(item, depth + 1)).join('');
    if (typeof value !== 'object') return '';
    for (const key of ['text', 'output_text', 'content', 'parts']) {
      if (value[key] != null) {
        const text = extractText(value[key], depth + 1);
        if (text.trim()) return text;
      }
    }
    return '';
  };
  const parseContent = value => {
    const text = extractText(value).trim();
    return text ? parseJsonText(text) : null;
  };
  if (body?.output_text != null) return parseContent(body.output_text);
  const text = body?.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
  if (typeof text === 'string') return parseJsonText(text);
  const message = body?.choices?.[0]?.message || {};
  const contentResult = parseContent(message.content);
  if (contentResult) return contentResult;
  if (message.reasoning_content != null) return parseContent(message.reasoning_content);
  const error = new Error('vision_empty_response');
  error.providerDetails = { status: 200, code: 'empty_response', message: JSON.stringify({ topLevelKeys: Object.keys(body || {}).slice(0, 20), choiceKeys: Object.keys(message).slice(0, 20), contentType: Array.isArray(message.content) ? 'array' : typeof message.content }) };
  throw error;
}

function buildVisionRequest({ baseUrl, model, imageUrl, userTags }) {
  const isNous = String(baseUrl).includes('inference-api.nousresearch.com');
  if (isNous) {
    return {
      url: `${normalizeBaseUrl(baseUrl)}/chat/completions`,
      body: {
        model,
        messages: [
          { role: 'system', content: visionSystemPrompt },
          { role: 'user', content: [
            { type: 'text', text: buildVisionUserPrompt(userTags) },
            { type: 'image_url', image_url: { url: imageUrl } }
          ] }
        ],
        // Keep the Nous request to the broadly supported multimodal chat shape.
        // The system prompt requests JSON; normalizeVisionResult validates it.
        include_reasoning: false,
        max_tokens: 500
      }
    };
  }
  return {
    url: `${normalizeBaseUrl(baseUrl)}/responses`,
    body: {
      model,
      input: [{ role: 'system', content: visionSystemPrompt }, { role: 'user', content: [
        { type: 'input_text', text: buildVisionUserPrompt(userTags) },
        { type: 'input_image', image_url: imageUrl, detail: 'low' }
      ] }],
      text: { format: { type: 'json_schema', name: 'wearwave_clothing_analysis', strict: true, schema: outputSchema } },
      max_output_tokens: 500
    }
  };
}

export async function analyzeImage({ apiKey, baseUrl = OPENAI_BASE_URL, model = OPENAI_DEFAULT_MODEL, imageUrl, userTags = {}, fetchImpl = fetch, timeoutMs = 30000 }) {
  if (!apiKey || !imageUrl) throw new Error('vision_input_missing');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const request = buildVisionRequest({ baseUrl, model, imageUrl, userTags });
    const response = await fetchImpl(request.url, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body)
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
    const providerError = new Error('vision_provider_failed');
    providerError.providerDetails = summarizeVisionProviderError({ type: error?.code || 'network_error', message: error?.message || 'Network request failed' }, 0);
    throw providerError;
  } finally {
    clearTimeout(timeout);
  }
}

export const visionOutputSchema = outputSchema;
export const defaultVisionModel = OPENAI_DEFAULT_MODEL;
