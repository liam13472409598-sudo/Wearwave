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

Use short, concrete English labels. Return exactly these keys: isClothing (boolean), itemType (string), color (string), material (string), fit (string), styleTags (array of strings), confidence (number from 0 to 1), and notes (string). For styleTags, choose only labels supported by the image from: street, vintage, y2y, minimal, outdoor. Notes must briefly explain the visible evidence or why the image is unclear. Do not include markdown, commentary, or extra keys.`;

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

function textValue(value, depth = 0) {
  if (depth > 4 || value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (Array.isArray(value)) return value.map(item => textValue(item, depth + 1)).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    for (const key of ['value', 'text', 'label', 'name', 'description', 'category', 'color', 'material', 'fit', 'type']) {
      const text = textValue(value[key], depth + 1);
      if (text) return text;
    }
    return Object.values(value).map(item => textValue(item, depth + 1)).filter(Boolean).join(', ');
  }
  return '';
}

function boundedString(value, maxLength = 120) {
  return textValue(value).slice(0, maxLength);
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
    itemType: boundedString(value.itemType ?? value.category),
    color: boundedString(value.color),
    material: boundedString(value.material),
    fit: boundedString(value.fit),
    styleTags: Array.isArray(value.styleTags) ? value.styleTags.map(tag => boundedString(tag, 30).toLowerCase()).filter(tag => allowedStyles.has(tag)).slice(0, 5) : [],
    notes: boundedString(value.notes, 500)
  };
  if (!Number.isFinite(result.confidence) || !result.itemType || !result.color || !result.material || !result.fit || !result.notes) throw new Error('invalid_vision_result');
  return result;
}

function summarizeVisionValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { type: typeof value };
  return {
    keys: Object.keys(value).slice(0, 20),
    types: Object.fromEntries(Object.keys(value).slice(0, 20).map(key => [key, Array.isArray(value[key]) ? 'array' : typeof value[key]]))
  };
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
    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
      return null;
    }
  };
  const findResult = (value, depth = 0) => {
    if (depth > 8 || value == null) return null;
    if (typeof value === 'string') return findResult(parseJsonText(value), depth + 1);
    if (Array.isArray(value)) {
      for (const item of value) {
        const result = findResult(item, depth + 1);
        if (result) return result;
      }
      return null;
    }
    if (typeof value !== 'object') return null;
    if ('isClothing' in value || 'itemType' in value || 'category' in value || 'styleTags' in value) return value;
    for (const key of ['output_text', 'content', 'text', 'parts', 'reasoning_content', 'message', 'choices', 'output']) {
      if (value[key] != null) {
        const result = findResult(value[key], depth + 1);
        if (result) return result;
      }
    }
    return null;
  };
  const result = findResult(body);
  if (result) return result;
  const choice = body?.choices?.[0] || {};
  const message = choice.message || {};
  const error = new Error('vision_empty_response');
  error.providerDetails = {
    status: 200,
    code: 'empty_response',
    message: JSON.stringify({
      topLevelKeys: Object.keys(body || {}).slice(0, 20),
      choiceKeys: Object.keys(choice).slice(0, 20),
      messageKeys: Object.keys(message).slice(0, 20),
      choiceContentType: Array.isArray(choice.content) ? 'array' : typeof choice.content,
      messageContentType: Array.isArray(message.content) ? 'array' : typeof message.content,
      messageContentKeys: message.content && typeof message.content === 'object' ? Object.keys(message.content).slice(0, 20) : []
    })
  };
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
        // Qwen3.7 Flash enables thinking by default. With a small output budget,
        // it can spend the entire completion on hidden reasoning and return an
        // empty content object. Disable reasoning explicitly for this classifier.
        reasoning: { effort: 'none' },
        include_reasoning: false,
        max_tokens: 800
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
    const parsed = parseResponseBody(body);
    try {
      return normalizeVisionResult(parsed);
    } catch {
      const validationError = new Error('invalid_vision_result');
      validationError.providerDetails = { status: response.status, code: 'invalid_vision_result', message: JSON.stringify(summarizeVisionValue(parsed)) };
      throw validationError;
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('vision_timeout');
    if (/^vision_/.test(error?.message || '') || error?.message === 'invalid_vision_result') throw error;
    const providerError = new Error('vision_provider_failed');
    providerError.providerDetails = summarizeVisionProviderError({ type: error?.code || 'network_error', message: error?.message || 'Network request failed' }, 0);
    throw providerError;
  } finally {
    clearTimeout(timeout);
  }
}

export const visionOutputSchema = outputSchema;
export const defaultVisionModel = OPENAI_DEFAULT_MODEL;
