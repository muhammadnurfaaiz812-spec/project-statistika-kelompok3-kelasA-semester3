/* =========================================================
   app.js — Skrip bersama StatKit
   Dimuat di statistika.html & probabilitas.html (defer).
   ========================================================= */
(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    function parseNumber(text) {
        if (typeof text === 'number') return text;
        let s = String(text == null ? '' : text).trim().replace(/\s+/g, '');
        if (s === '') return NaN;
        s = s.replace(/%$/, '');
        if (!/^[+-]?[\d.,]+$/.test(s)) return NaN;

        const lastDot = s.lastIndexOf('.');
        const lastComma = s.lastIndexOf(',');

        if (lastDot !== -1 && lastComma !== -1) {
            if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
            else s = s.replace(/,/g, '');
        } else if (lastComma !== -1) {
            s = (s.match(/,/g).length === 1) ? s.replace(',', '.') : s.replace(/,/g, '');
        } else if (lastDot !== -1 && s.match(/\./g).length > 1) {
            s = s.replace(/\./g, '');
        }
        const n = Number(s);
        return Number.isFinite(n) ? n : NaN;
    }

    function fmt(n, digits) {
        if (n === null || n === undefined || Number.isNaN(n)) return '–';
        if (!Number.isFinite(n)) return n > 0 ? '∞' : '−∞';
        const d = (digits === undefined) ? 4 : digits;
        const rounded = Math.abs(n) < 1e-12 ? 0 : n;
        return rounded.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: d
        });
    }

    function showAlert(el, message) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
    }

    function hideAlert(el) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return;
        el.textContent = '';
        el.hidden = true;
    }

    function setupTabs(buttons, onSelect) {
        function select(btn) {
            buttons.forEach(function (b) {
                const on = (b === btn);
                b.setAttribute('aria-selected', on ? 'true' : 'false');
                b.classList.toggle('is-active', on);
                b.tabIndex = on ? 0 : -1;
            });
            if (onSelect) onSelect(btn);
        }
        buttons.forEach(function (btn, i) {
            btn.addEventListener('click', function () { select(btn); });
            btn.addEventListener('keydown', function (e) {
                let next = null;
                if (e.key === 'ArrowRight') next = buttons[(i + 1) % buttons.length];
                if (e.key === 'ArrowLeft') next = buttons[(i - 1 + buttons.length) % buttons.length];
                if (next) { e.preventDefault(); next.focus(); select(next); }
            });
        });
        const initial = buttons.find(function (b) { return b.getAttribute('aria-selected') === 'true'; }) || buttons[0];
        if (initial) select(initial);
        return select;
    }

    window.App = {
        $: $,
        $$: $$,
        parseNumber: parseNumber,
        fmt: fmt,
        showAlert: showAlert,
        hideAlert: hideAlert,
        setupTabs: setupTabs
    };

    function initNav() {
        const current = (location.pathname.split('/').pop() || 'statistika.html').toLowerCase();
        $$('.main-nav a').forEach(function (a) {
            const href = (a.getAttribute('href') || '').toLowerCase();
            if (href === current) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
    }

    function initModeInput() {
        const tabManual = $('#tab-manual');
        const tabCsv = $('#tab-csv');
        const manual = $('#manual-area');
        const csv = $('#upload-csv-area');
        if (!tabManual || !tabCsv || !manual || !csv) return;

        setupTabs([tabManual, tabCsv], function (btn) {
            const isManual = (btn === tabManual);
            manual.hidden = !isManual;
            csv.hidden = isManual;
            document.dispatchEvent(new CustomEvent('app:modechange', {
                detail: { mode: isManual ? 'manual' : 'csv' }
            }));
        });
    }

    function initSubNav() {
        const buttons = $$('.sub-nav [data-sub]');
        if (!buttons.length) return;

        const panels = {};
        buttons.forEach(function (b) {
            panels[b.dataset.sub] = document.getElementById('panel-' + b.dataset.sub);
        });

        const select = setupTabs(buttons, function (btn) {
            Object.keys(panels).forEach(function (key) {
                if (panels[key]) panels[key].hidden = (key !== btn.dataset.sub);
            });
            document.dispatchEvent(new CustomEvent('app:subchange', {
                detail: { sub: btn.dataset.sub }
            }));
        });

        function fromHash() {
            const key = location.hash.replace('#', '');
            const target = buttons.find(function (b) { return b.dataset.sub === key; });
            if (target) select(target);
        }
        window.addEventListener('hashchange', fromHash);
        fromHash();

        buttons.forEach(function (b) {
            b.addEventListener('click', function () {
                if (history.replaceState) history.replaceState(null, '', '#' + b.dataset.sub);
            });
        });
    }

    function initRelasiToggle() {
        const sel = $('#select-relasi');
        const wrap = $('#wrapper-pab');
        if (!sel || !wrap) return;
        function update() { wrap.hidden = (sel.value !== 'custom'); }
        sel.addEventListener('change', update);
        update();
    }

    function initAlertAutoClear() {
        $$('.alert').forEach(function (alertEl) {
            const scope = alertEl.closest('form, section, .card');
            if (!scope) return;
            scope.addEventListener('input', function () { hideAlert(alertEl); });
        });
    }

    function init() {
        initNav();
        initModeInput();
        initSubNav();
        initRelasiToggle();
        initAlertAutoClear();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
