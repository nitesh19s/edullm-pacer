/**
 * Drop-in replacement for the mocked generateResponse() in
 * EduLLM_Web_Application_-_Educational_Localized_Language_Model_Platform.html
 *
 * Usage:
 *   1. Start the backend:  uvicorn edullm_pacer.api.server:app --port 8000
 *   2. In your HTML, replace the contents of the <script> tag with the
 *      contents of this file (or load it via <script src="edullm_client.js">).
 *   3. The UI stays identical — only the generateResponse method becomes real.
 */

// ============================================================
// CONFIG
// ============================================================
// Empty means same-origin (when UI is served by the FastAPI server).
// Set to "http://localhost:8000" if opening this HTML file directly from disk.
const EDULLM_API_BASE = "";

// ============================================================
// APP
// ============================================================
class EduLLMApp {
    constructor() {
        this.messageInput = document.getElementById("messageInput");
        this.sendButton = document.getElementById("sendButton");
        this.chatMessages = document.getElementById("chatMessages");
        this.typingIndicator = document.getElementById("typingIndicator");

        this.initializeEventListeners();
        this.refreshStats();
        // Poll stats every 5s so the right panel reflects real usage.
        this._statsTimer = setInterval(() => this.refreshStats(), 5000);
    }

    initializeEventListeners() {
        this.sendButton.addEventListener("click", () => this.sendMessage());
        this.messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.messageInput.addEventListener("input", () => this.adjustTextareaHeight());

        ["subject", "grade", "resource-type", "language"].forEach((id) => {
            document.getElementById(id).addEventListener("change", () => this.notifyFiltersUpdated());
        });
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = "auto";
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + "px";
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, "user");
        this.messageInput.value = "";
        this.adjustTextareaHeight();
        this.showTypingIndicator();

        try {
            const response = await this.callBackend(message);
            this.hideTypingIndicator();
            this.addMessage(response.answer, "assistant", response.sources, {
                retrievalMs: response.retrieval_latency_ms,
                generationMs: response.generation_latency_ms,
                totalMs: response.total_latency_ms,
            });
        } catch (err) {
            this.hideTypingIndicator();
            this.addMessage(
                `Sorry - couldn't reach the backend. Is the API running at ${EDULLM_API_BASE}?\n\nError: ${err.message}`,
                "assistant",
                null,
            );
        } finally {
            this.refreshStats();
        }
    }

    async callBackend(query) {
        const filters = {
            subject: this.getFilter("subject"),
            grade: this.getFilter("grade"),
            resourceType: this.getFilter("resource-type"),
            language: this.getFilter("language"),
        };
        const res = await fetch(`${EDULLM_API_BASE}/api/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, filters, k: 5 }),
        });
        if (!res.ok) {
            throw new Error(`${res.status} ${res.statusText}`);
        }
        return res.json();
    }

    getFilter(id) {
        const el = document.getElementById(id);
        const value = el ? el.value : "";
        return value || null;
    }

    addMessage(text, sender, sources = null, timings = null) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}`;

        const metaDiv = document.createElement("div");
        metaDiv.className = "message-meta";
        metaDiv.textContent = sender === "user" ? "You" : "EduLLM Assistant";

        const textDiv = document.createElement("div");
        textDiv.textContent = text;

        messageDiv.appendChild(metaDiv);
        messageDiv.appendChild(textDiv);

        if (sources && sources.length > 0) {
            for (const s of sources) {
                const sourceDiv = document.createElement("div");
                sourceDiv.className = "source-info";
                const meta = [s.subject, s.grade, s.doc_type].filter(Boolean).join(" / ");
                sourceDiv.innerHTML = `
                    <i class="fas fa-book"></i>
                    <strong>Source ${s.source_index}</strong>${meta ? " — " + meta : ""}
                    <div style="margin-top:6px; font-size:0.85em; opacity:0.85;">${this.escapeHtml(s.preview)}</div>
                `;
                messageDiv.appendChild(sourceDiv);
            }
        }

        if (timings) {
            const timingDiv = document.createElement("div");
            timingDiv.style.fontSize = "0.75em";
            timingDiv.style.opacity = "0.6";
            timingDiv.style.marginTop = "6px";
            timingDiv.textContent = `retrieval ${this.fmtMs(timings.retrievalMs)} · generation ${this.fmtMs(timings.generationMs)} · total ${this.fmtMs(timings.totalMs)}`;
            messageDiv.appendChild(timingDiv);
        }

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    escapeHtml(s) {
        const div = document.createElement("div");
        div.textContent = s;
        return div.innerHTML;
    }

    fmtMs(ms) {
        if (ms == null) return "-";
        return ms >= 1000 ? (ms / 1000).toFixed(2) + "s" : ms.toFixed(0) + "ms";
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = "flex";
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    hideTypingIndicator() {
        this.typingIndicator.style.display = "none";
    }

    notifyFiltersUpdated() {
        // Visual confirmation only - filters are applied per-query when sent.
        const filters = ["subject", "grade", "resource-type", "language"]
            .map((id) => this.getFilter(id))
            .filter(Boolean);
        const msg = filters.length
            ? `Filters set: ${filters.join(", ")}. Will apply to your next question.`
            : "Filters cleared.";
        this.addMessage(msg, "assistant", null);
    }

    async refreshStats() {
        try {
            const res = await fetch(`${EDULLM_API_BASE}/api/stats`);
            if (!res.ok) return;
            const stats = await res.json();
            const el = (id) => document.getElementById(id);
            if (el("totalQueries")) el("totalQueries").textContent = stats.total_queries;
            if (el("accuracyRate")) el("accuracyRate").textContent = "—"; // real CAS plugs in here (Workstream D)
            if (el("responseTime")) el("responseTime").textContent = this.fmtMs(stats.avg_latency_ms);
            if (el("documentsIndexed")) el("documentsIndexed").textContent = stats.chunks_indexed.toLocaleString();
        } catch (_) {
            // Backend down; leave stats alone.
        }
    }
}

document.addEventListener("DOMContentLoaded", () => new EduLLMApp());
