/**
 * Ollama Service
 * Wraps the local Ollama REST API for text generation and embeddings.
 */

const OLLAMA_URL         = process.env.OLLAMA_URL         || 'http://localhost:11434';
const OLLAMA_MODEL       = process.env.OLLAMA_MODEL       || 'llama3.2';
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const OLLAMA_TIMEOUT_MS  = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000');

// ── helpers ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Check whether Ollama is reachable.
 * @returns {Promise<boolean>}
 */
async function isAvailable() {
    try {
        const res = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Generate a text embedding for the given input.
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector
 */
async function generateEmbedding(text) {
    const res = await fetchWithTimeout(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama embeddings error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.embedding;
}

/**
 * Generate a completion from the LLM.
 * @param {string} prompt
 * @param {object} [options]
 * @param {string}  [options.model]       override model
 * @param {boolean} [options.stream]      stream tokens (default false)
 * @param {object}  [options.options]     Ollama model options (temperature, etc.)
 * @returns {Promise<{response: string, model: string, totalDuration: number, evalCount: number}>}
 */
async function generate(prompt, options = {}) {
    const body = {
        model:  options.model || OLLAMA_MODEL,
        prompt,
        stream: false,
        options: options.options || {}
    };

    const res = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama generate error ${res.status}: ${err}`);
    }

    const data = await res.json();

    return {
        response:      data.response?.trim() || '',
        model:         data.model,
        totalDuration: data.total_duration,   // nanoseconds
        evalCount:     data.eval_count        // tokens generated
    };
}

/**
 * List models currently available in Ollama.
 * @returns {Promise<string[]>}
 */
async function listModels() {
    const res = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map(m => m.name);
}

module.exports = { isAvailable, generateEmbedding, generate, listModels, OLLAMA_MODEL, OLLAMA_EMBED_MODEL };
