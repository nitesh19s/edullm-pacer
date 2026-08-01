/**
 * EduLLM Demo Mode — ?demo=true
 *
 * Full-height chat UI with history sidebar, stripped of research scaffolding.
 */
(function () {
    var isDemoMode = new URLSearchParams(window.location.search).get('demo') !== null;
    if (!isDemoMode) return;

    // ── Inject styles synchronously to prevent FOUC ───────────────────────────
    var style = document.createElement('style');
    style.textContent = `
/* ===== DEMO MODE BASE ===== */
html.demo-mode,
html.demo-mode body {
    height: 100vh;
    overflow: hidden;
}
html.demo-mode .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
html.demo-mode .header { flex-shrink: 0; z-index: 100; }

/* hide research chrome */
html.demo-mode .sidebar,
html.demo-mode .sidebar-overlay,
html.demo-mode #sidebarToggle,
html.demo-mode .header-actions .contrast-selector,
html.demo-mode .header-actions .language-selector,
html.demo-mode .header-actions .header-demo-link,
html.demo-mode .progress-label,
html.demo-mode #flow-progress-container,
html.demo-mode .flow-progress-container,
html.demo-mode .onboarding-modal,
html.demo-mode .breadcrumb-container,
html.demo-mode #rag .section-header,
html.demo-mode #rag-tips,
html.demo-mode .page-help-banner { display: none !important; }

/* ===== TWO-COLUMN LAYOUT ===== */
html.demo-mode .main-content {
    flex: 1;
    overflow: hidden;
    display: flex !important;
    flex-direction: row !important;
    margin: 0 !important;
    padding: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
}

/* ===== HISTORY SIDEBAR ===== */
.demo-history-sidebar {
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #0f172a;
    overflow: hidden;
    border-right: 1px solid #1e293b;
}
.demo-history-top {
    padding: .875rem 1rem;
    border-bottom: 1px solid #1e293b;
    flex-shrink: 0;
}
.demo-new-chat-btn {
    width: 100%;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: .5rem;
    padding: .6rem 1rem;
    font-size: .84rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: .5rem;
    transition: background .15s;
    justify-content: center;
}
.demo-new-chat-btn:hover { background: #1d4ed8; }
.demo-new-chat-btn i { font-size: .9rem; }

.demo-history-label {
    font-size: .67rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #475569;
    padding: .9rem 1rem .3rem;
    flex-shrink: 0;
}
.demo-sessions-list {
    flex: 1;
    overflow-y: auto;
    padding: .25rem 0 1rem;
}
.demo-sessions-list::-webkit-scrollbar { width: 3px; }
.demo-sessions-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

.demo-session-item {
    padding: .55rem .875rem;
    cursor: pointer;
    border-radius: .375rem;
    margin: .1rem .5rem;
    transition: background .12s;
}
.demo-session-item:hover { background: #1e293b; }
.demo-session-item.active { background: #1e3a5f; }
.demo-session-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: .82rem;
    font-weight: 500;
    color: #94a3b8;
}
.demo-session-item.active .demo-session-title { color: #e2e8f0; }
.demo-session-item:hover .demo-session-title { color: #cbd5e1; }
.demo-session-meta {
    font-size: .7rem;
    color: #475569;
    margin-top: .15rem;
}
.demo-history-empty {
    text-align: center;
    padding: 2rem 1rem 1rem;
    color: #334155;
    font-size: .8rem;
    line-height: 1.6;
}
.demo-history-empty i {
    display: block;
    font-size: 1.75rem;
    margin-bottom: .6rem;
    opacity: .35;
}

/* ===== RAG SECTION FULL-HEIGHT ===== */
html.demo-mode #rag.content-section {
    flex: 1 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #f8fafc;
}

/* Compact info bar */
.demo-info-bar {
    background: #f0f9ff;
    border-bottom: 1px solid #bae6fd;
    padding: .55rem 1.25rem;
    display: flex;
    align-items: flex-start;
    gap: .65rem;
    font-size: .79rem;
    flex-shrink: 0;
    line-height: 1.4;
}
.demo-info-bar > i { color: #0284c7; font-size: .95rem; margin-top: .15rem; flex-shrink: 0; }
.demo-info-bar strong { color: #0369a1; }
.demo-suggestions { display: flex; flex-wrap: wrap; gap: .3rem; margin-top: .35rem; }
.demo-chip {
    background: white;
    border: 1px solid #bae6fd;
    border-radius: 999px;
    padding: .2rem .6rem;
    font-size: .72rem;
    cursor: pointer;
    color: #0369a1;
    transition: all .12s;
    user-select: none;
}
.demo-chip:hover { background: #e0f2fe; border-color: #0284c7; }

/* RAG container fills remaining height */
html.demo-mode .rag-container {
    flex: 1 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    border-radius: 0 !important;
    border: none !important;
    background: white;
    margin: 0 !important;
    box-shadow: none !important;
}
html.demo-mode .chat-header {
    border-radius: 0 !important;
    flex-shrink: 0;
}
html.demo-mode .chat-messages {
    flex: 1 !important;
    overflow-y: auto !important;
    padding: 1.25rem 1.5rem !important;
}
html.demo-mode .typing-indicator { flex-shrink: 0; }
html.demo-mode #sessionHistoryPanel { flex-shrink: 0; }
html.demo-mode .chat-input-area {
    flex-shrink: 0 !important;
    padding: .875rem 1.5rem !important;
    background: white;
    border-top: 1px solid #f1f5f9 !important;
}

/* ===== HEADER ADDITIONS ===== */
.demo-research-link {
    display: inline-flex; align-items: center; gap: .4rem;
    background: #2563eb; color: #fff;
    font-size: .78rem; font-weight: 600;
    padding: .3rem .85rem; border-radius: 999px;
    text-decoration: none; white-space: nowrap;
    transition: background .15s;
    border: none;
}
.demo-research-link:hover { background: #1d4ed8; color: #fff; }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('demo-mode');

    // ── DOM modifications after parse ─────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        // 1. Header: only the Research View link (no Student Demo badge — you're already here)
        var hc = document.querySelector('.header-content');
        if (hc) {
            var link = document.createElement('a');
            link.href = './';
            link.className = 'demo-research-link';
            link.innerHTML = '<i class="fas fa-flask"></i> Research View';
            hc.appendChild(link);
        }

        // 2. History sidebar injected as first child of main-content
        var mainContent = document.querySelector('.main-content');
        if (mainContent) {
            var sidebar = document.createElement('div');
            sidebar.className = 'demo-history-sidebar';
            sidebar.id = 'demoHistorySidebar';
            sidebar.innerHTML =
                '<div class="demo-history-top">' +
                  '<button class="demo-new-chat-btn" id="demoNewChatBtn">' +
                    '<i class="fas fa-plus"></i> New Chat' +
                  '</button>' +
                '</div>' +
                '<div class="demo-history-label">Recent Sessions</div>' +
                '<div class="demo-sessions-list" id="demoSessionsList">' +
                  '<div class="demo-history-empty">' +
                    '<i class="fas fa-comments"></i>' +
                    'No sessions yet.<br>Start chatting to build history.' +
                  '</div>' +
                '</div>';
            mainContent.insertBefore(sidebar, mainContent.firstChild);

            document.getElementById('demoNewChatBtn').addEventListener('click', function () {
                document.querySelectorAll('.demo-session-item').forEach(function (el) {
                    el.classList.remove('active');
                });
                var msgs = document.getElementById('chatMessages');
                if (msgs) {
                    msgs.innerHTML =
                        '<div class="message-date">Today</div>' +
                        '<div class="message assistant-message">' +
                          '<div class="message-avatar"><i class="fas fa-robot"></i></div>' +
                          '<div class="message-bubble">' +
                            '<div class="message-text">Welcome to EduLLM! I\'m your NCERT AI Tutor. Ask me anything about your curriculum.</div>' +
                            '<div class="message-time">Just now</div>' +
                          '</div>' +
                        '</div>';
                }
                if (window.eduLLM) window.eduLLM.currentSessionId = null;
            });

            // Load sessions once API is ready
            waitForApi(loadDemoSessions);
        }

        // 3. Compact info bar above rag-container
        var ragSection = document.getElementById('rag');
        if (ragSection) {
            var ALL_QUESTIONS = [
                // Physics
                "What is Newton's third law of motion? (Class 9)",
                'Explain the law of conservation of energy. (Class 11)',
                'What is Ohm\'s law and how is it used? (Class 10)',
                'Describe total internal reflection. (Class 12)',
                'What is the difference between speed and velocity? (Class 9)',
                'Explain how a transformer works. (Class 12)',
                'What are electromagnetic waves? (Class 12)',
                'State Archimedes\' principle. (Class 9)',
                // Chemistry
                'What is the periodic table? How is it arranged? (Class 10)',
                'Explain covalent and ionic bonds. (Class 11)',
                'What happens during a chemical reaction? (Class 8)',
                'What is the pH scale and what does it measure? (Class 10)',
                'Describe the structure of an atom. (Class 9)',
                'What is electrolysis? Give an example. (Class 12)',
                'Explain the nitrogen cycle. (Class 9)',
                // Biology
                'Explain photosynthesis with its equation. (Class 10)',
                'What is the function of mitochondria? (Class 9)',
                'How does the human digestive system work? (Class 10)',
                'What is DNA and why is it important? (Class 12)',
                'Explain the process of cell division. (Class 12)',
                'What are the differences between arteries and veins? (Class 10)',
                'Describe the water cycle in nature. (Class 7)',
                // Mathematics
                'What are rational numbers? Give examples. (Class 8)',
                'Explain the Pythagorean theorem. (Class 10)',
                'What is the quadratic formula? (Class 10)',
                'How do you find the area of a circle? (Class 7)',
                'What are arithmetic progressions? (Class 10)',
                'Explain probability with an example. (Class 10)',
                'What are matrices and how are they multiplied? (Class 12)',
                'What is differentiation in calculus? (Class 11)',
                // Social Science / History
                'Who was Mahatma Gandhi and what was his role in India\'s independence? (Class 10)',
                'What were the causes of World War I? (Class 9)',
                'What is the French Revolution? (Class 9)',
                'Explain the importance of the Indian Constitution. (Class 11)',
                'What is democracy and how does it work? (Class 9)',
                'Who were the Mughals and how did they rule India? (Class 7)',
                // Geography
                'What causes earthquakes and tsunamis? (Class 9)',
                'Explain the greenhouse effect and global warming. (Class 8)',
                'What are the major climate zones of India? (Class 9)',
                'How are mountains formed? (Class 9)',
                'What is soil erosion and how can it be prevented? (Class 8)',
                // Economics
                'What is GDP and how is it calculated? (Class 10)',
                'Explain the difference between demand and supply. (Class 11)',
                'What is inflation and what causes it? (Class 12)',
                // English / Literature
                'What is the theme of the poem "The Road Not Taken"? (Class 9)',
                'Summarise the story "The Last Leaf" by O. Henry. (Class 10)',
            ];

            // Fisher-Yates shuffle, pick 5
            var pool = ALL_QUESTIONS.slice();
            for (var i = pool.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
            }
            var samples = pool.slice(0, 5);

            var chips = samples.map(function (q) {
                // Strip "(Class X)" suffix from the actual query — keep it only in the label
                var query = q.replace(/\s*\(Class \d+\)\s*$/i, '').trim();
                return '<span class="demo-chip" data-q="' + query.replace(/"/g, '&quot;') + '">' + q + '</span>';
            }).join('');

            var bar = document.createElement('div');
            bar.className = 'demo-info-bar';
            bar.innerHTML =
                '<i class="fas fa-graduation-cap"></i>' +
                '<div>' +
                  '<strong>NCERT AI Tutor</strong> — 8,661 Q&amp;A pairs, grade &amp; Bloom-level aligned.' +
                  '<div class="demo-suggestions">' + chips + '</div>' +
                '</div>';

            // Wire chip clicks — fill input and send immediately (guard against double-fire)
            bar.querySelectorAll('.demo-chip').forEach(function (chip) {
                chip.addEventListener('click', function () {
                    if (chip.dataset.busy) return;
                    chip.dataset.busy = '1';
                    setTimeout(function () { delete chip.dataset.busy; }, 3000);

                    var inp = document.getElementById('chatInput');
                    var btn = document.getElementById('sendButton');
                    if (!inp) return;
                    inp.value = chip.dataset.q;
                    if (btn) btn.click();
                });
            });

            var ragContainer = ragSection.querySelector('.rag-container');
            ragSection.insertBefore(bar, ragContainer || ragSection.firstChild);
        }
    });

    // ── Load session list ─────────────────────────────────────────────────────
    function loadDemoSessions() {
        var client = window.eduLLM && window.eduLLM.apiClient;
        if (!client) return;
        client.getChatSessions().then(function (resp) {
            renderDemoSessions((resp && resp.data) ? resp.data : []);
        }).catch(function () { /* backend offline — silent */ });
    }

    function renderDemoSessions(sessions) {
        var list = document.getElementById('demoSessionsList');
        if (!list) return;
        if (!sessions || sessions.length === 0) {
            list.innerHTML =
                '<div class="demo-history-empty">' +
                  '<i class="fas fa-comments"></i>' +
                  'No sessions yet.<br>Start chatting to build history.' +
                '</div>';
            return;
        }
        list.innerHTML = sessions.slice(0, 40).map(function (s) {
            var title = s.title || s.firstMessage || ('Session ' + String(s.id).slice(-6));
            var date = s.updatedAt
                ? new Date(s.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : '';
            var meta = [date, s.messageCount ? s.messageCount + ' msgs' : ''].filter(Boolean).join(' · ');
            return '<div class="demo-session-item" data-id="' + s.id + '">' +
                '<div class="demo-session-title">' + esc(title) + '</div>' +
                (meta ? '<div class="demo-session-meta">' + meta + '</div>' : '') +
                '</div>';
        }).join('');

        list.querySelectorAll('.demo-session-item').forEach(function (el) {
            el.addEventListener('click', function () {
                list.querySelectorAll('.demo-session-item').forEach(function (x) { x.classList.remove('active'); });
                el.classList.add('active');
                loadDemoSession(el.dataset.id);
            });
        });
    }

    function loadDemoSession(sessionId) {
        var client = window.eduLLM && window.eduLLM.apiClient;
        if (!client) return;
        client.getChatSession(sessionId).then(function (resp) {
            var history = resp && resp.data && resp.data.history ? resp.data.history : [];
            var msgs = document.getElementById('chatMessages');
            if (!msgs || history.length === 0) return;
            msgs.innerHTML = '<div class="message-date">Session history</div>';
            history.forEach(function (m) {
                var isUser = m.role === 'user';
                var div = document.createElement('div');
                div.className = 'message ' + (isUser ? 'user-message' : 'assistant-message');
                div.innerHTML =
                    '<div class="message-avatar"><i class="fas fa-' + (isUser ? 'user' : 'robot') + '"></i></div>' +
                    '<div class="message-bubble"><div class="message-text">' + esc(m.content || '') + '</div></div>';
                msgs.appendChild(div);
            });
            msgs.scrollTop = msgs.scrollHeight;
        }).catch(function () {});
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function esc(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function waitForApi(cb) {
        var n = 0;
        var t = setInterval(function () {
            if (++n > 60) { clearInterval(t); return; }
            if (window.eduLLM && window.eduLLM.apiClient) {
                clearInterval(t);
                cb();
            }
        }, 100);
    }

    // ── Switch to RAG once app boots ──────────────────────────────────────────
    window.addEventListener('load', function () {
        var n = 0;
        var t = setInterval(function () {
            if (++n > 50) { clearInterval(t); return; }
            if (window.eduLLM && typeof window.eduLLM.switchSection === 'function') {
                clearInterval(t);
                window.eduLLM.switchSection('rag');
            }
        }, 100);
    });
})();
