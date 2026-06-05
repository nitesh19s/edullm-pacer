/**
 * sidebar-loader.js
 *
 * Fetches _sidebar.html and injects it into <nav class="sidebar-nav">.
 *
 * On index.html  → converts <a data-target="x"> to <button data-section="x">
 *                  so single-page navigation works. The <nav> element stays in
 *                  the DOM immediately; click delegation on it means zero timing gap.
 *
 * On other pages → leaves <a href="index.html#…"> links intact.
 *                  Set <body data-active-page="database"> to mark current page.
 *
 * NOTE: script.js's switchSectionDirect() already does live document.querySelectorAll
 * queries, so active-state highlighting works automatically once buttons are injected —
 * no need to patch switchSectionDirect here.
 */
(function () {
    const isIndexPage = window.location.pathname.endsWith('index.html') ||
                        window.location.pathname === '/' ||
                        window.location.pathname.endsWith('/');

    const scripts = document.querySelectorAll('script[src*="sidebar-loader"]');
    const base = scripts.length
        ? scripts[scripts.length - 1].src.replace('sidebar-loader.js', '')
        : '';

    // ── Event delegation on <nav> — works even before fetch completes ──────────
    // script.js may have run bindEvents() before the buttons existed; this catches all future clicks.
    document.addEventListener('DOMContentLoaded', () => {
        const nav = document.querySelector('nav.sidebar-nav');
        if (!nav || !isIndexPage) return;

        nav.addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-link[data-section]');
            if (!btn) return;
            e.preventDefault();
            const section = btn.dataset.section;
            if (window.eduLLM) {
                window.eduLLM.switchSection(section);
            }
            // Close mobile sidebar
            document.querySelector('.app-container')?.classList.remove('sidebar-open');
        });
    });

    // ── Fetch and inject ────────────────────────────────────────────────────────
    fetch(base + '_sidebar.html')
        .then(r => {
            if (!r.ok) throw new Error('sidebar fetch failed: ' + r.status);
            return r.text();
        })
        .then(html => {
            const nav = document.querySelector('nav.sidebar-nav');
            if (!nav) return;

            nav.innerHTML = html;

            if (isIndexPage) {
                // Convert <a data-target="x"> → <button data-section="x">
                nav.querySelectorAll('a.nav-link[data-target]').forEach(a => {
                    const target = a.getAttribute('data-target');

                    // Keep database link as <a> — it's a real page navigation
                    if (target === 'database') return;

                    const btn = document.createElement('button');
                    btn.className = 'nav-link';
                    btn.dataset.section = target;
                    btn.innerHTML = a.innerHTML;

                    // Restore special onclick for pacer init
                    if (target === 'pacer') {
                        btn.setAttribute('onclick',
                            "if(window.pacerResultsManager&&!window.pacerResultsManager._initialized)" +
                            "{window.pacerResultsManager._initialized=true;window.pacerResultsManager.initialize();}");
                    }

                    a.parentNode.replaceChild(btn, a);
                });

                // Mark Dashboard active by default (switchSectionDirect will update on navigation)
                const dashBtn = nav.querySelector('.nav-link[data-section="dashboard"]');
                if (dashBtn) dashBtn.classList.add('active');

                // If hash routing already fired before we injected, re-apply active class
                if (window._currentSidebarSection) {
                    nav.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
                    const active = nav.querySelector(`.nav-link[data-section="${window._currentSidebarSection}"]`);
                    if (active) active.classList.add('active');
                }

            } else {
                // Other pages: highlight active page link
                const activePage = document.body.dataset.activePage || '';
                nav.querySelectorAll('a.nav-link[data-target]').forEach(a => {
                    a.classList.toggle('active', a.dataset.target === activePage);
                });
            }
        })
        .catch(err => {
            console.warn('sidebar-loader: could not load _sidebar.html —', err.message);
        });
})();
