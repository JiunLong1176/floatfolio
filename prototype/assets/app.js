/* ──────────────────────────────────────────────────────────────
 * Personal investments dashboard — prototype glue
 *
 * Features:
 *  - Currency toggle (MYR ⇄ USD), live re-format every [data-myr]
 *  - Theme toggle (dark/light) persisted in localStorage
 *  - Tabs/segmented controls helper
 *  - Tiny sparkline + area-chart renderers (inline SVG)
 *  - Drawer / modal helpers
 *  - Sortable table helper
 * ──────────────────────────────────────────────────────────── */

const FX = { MYR_per_USD: 4.72, MYR_per_HKD: 0.60 };

/* ─── Currency formatting ─────────────────────────────────────── */
function fmtNumber(n, decimals) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function getCurrency() {
  return localStorage.getItem('currency') || 'MYR';
}
function setCurrency(c) {
  localStorage.setItem('currency', c);
  applyCurrency();
  document.querySelectorAll('[data-currency-toggle]').forEach(el => {
    el.querySelectorAll('button').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.curr === c ? 'true' : 'false');
    });
  });
}
function applyCurrency() {
  const cur = getCurrency();
  document.querySelectorAll('[data-myr]').forEach(el => {
    const myr = parseFloat(el.dataset.myr);
    if (Number.isNaN(myr)) return;
    const decimals = el.dataset.decimals != null ? +el.dataset.decimals : 2;
    const compact = el.dataset.compact === 'true';
    let value = myr;
    if (cur === 'USD') value = myr / FX.MYR_per_USD;
    let formatted;
    if (compact) {
      const abs = Math.abs(value);
      if (abs >= 1e6) formatted = (value / 1e6).toFixed(2) + 'M';
      else if (abs >= 1e3) formatted = (value / 1e3).toFixed(2) + 'k';
      else formatted = fmtNumber(value, decimals);
    } else {
      formatted = fmtNumber(value, decimals);
    }
    // Split integer/decimal part for typographic treatment
    const sym = cur === 'USD' ? '$' : 'RM';
    const sign = el.dataset.sign === 'true' ? (myr >= 0 ? '+' : '−') : '';
    const absText = formatted.replace(/^-/, '');
    if (el.dataset.split === 'true' && absText.includes('.')) {
      const [intPart, decPart] = absText.split('.');
      el.innerHTML = `${sign}<span class="curr-prefix">${sym}</span>${intPart}<span class="num-cents">.${decPart}</span>`;
    } else {
      el.innerHTML = `${sign}<span class="curr-prefix">${sym}</span>${absText}`;
    }
  });
  // Update standalone currency labels
  document.querySelectorAll('[data-currency-label]').forEach(el => el.textContent = cur);
}

/* ─── Theme ───────────────────────────────────────────────────── */
function getTheme() { return localStorage.getItem('theme') || 'dark'; }
function setTheme(t) {
  localStorage.setItem('theme', t);
  document.documentElement.classList.toggle('light', t === 'light');
  document.querySelectorAll('[data-theme-toggle]').forEach(el => {
    el.querySelectorAll('button').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.theme === t ? 'true' : 'false');
    });
  });
}

/* ─── Tabs / segmented ───────────────────────────────────────── */
function wireTabs(root, onChange) {
  const buttons = root.querySelectorAll('button[data-tab]');
  buttons.forEach(b => {
    b.addEventListener('click', () => {
      buttons.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      onChange && onChange(b.dataset.tab, b);
    });
  });
}

/* ─── Sparkline ──────────────────────────────────────────────── */
function sparkline(svg, points, opts = {}) {
  if (!points || points.length === 0) return;
  const w = svg.clientWidth || 120;
  const h = svg.clientHeight || 36;
  const pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (points.length - 1);
  const xy = points.map((v, i) => [pad + i * stepX, h - pad - ((v - min) / span) * (h - pad * 2)]);
  const d = xy.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${d} L${xy[xy.length - 1][0]},${h} L${xy[0][0]},${h} Z`;
  const positive = points[points.length - 1] >= points[0];
  const color = opts.color || (positive ? 'var(--profit)' : 'var(--loss)');
  svg.innerHTML = `
    <path class="area" d="${area}" fill="${color}"></path>
    <path class="line" d="${d}" stroke="${color}"></path>
  `;
}

/* ─── Big area chart ─────────────────────────────────────────── */
function areaChart(svg, points, opts = {}) {
  const w = svg.clientWidth || 800;
  const h = svg.clientHeight || 280;
  const padL = 8, padR = 8, padT = 14, padB = 22;
  const min = opts.min ?? Math.min(...points);
  const max = opts.max ?? Math.max(...points);
  const span = max - min || 1;
  const stepX = (w - padL - padR) / (points.length - 1);
  const xy = points.map((v, i) => [padL + i * stepX, padT + (1 - (v - min) / span) * (h - padT - padB)]);
  const d = xy.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${d} L${xy[xy.length - 1][0]},${h - padB} L${xy[0][0]},${h - padB} Z`;
  const positive = points[points.length - 1] >= points[0];
  const color = opts.color || (positive ? 'var(--profit)' : 'var(--loss)');
  const gradId = 'g' + Math.random().toString(36).slice(2, 8);

  // Cost basis line (optional)
  let basisLine = '';
  if (opts.basis != null) {
    const by = padT + (1 - (opts.basis - min) / span) * (h - padT - padB);
    basisLine = `<line x1="${padL}" x2="${w - padR}" y1="${by}" y2="${by}"
      stroke="var(--fg-mute)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"></line>
      <text x="${w - padR - 4}" y="${by - 6}" text-anchor="end" fill="var(--fg-mute)" font-size="11" font-family="JetBrains Mono, monospace">cost basis</text>`;
  }

  // Y-axis grid lines
  const grid = [0.25, 0.5, 0.75].map(t => {
    const y = padT + t * (h - padT - padB);
    return `<line x1="${padL}" x2="${w - padR}" y1="${y}" y2="${y}" stroke="var(--border)" stroke-width="1"></line>`;
  }).join('');

  // X-axis labels
  let xLabels = '';
  if (opts.xLabels) {
    const n = opts.xLabels.length;
    xLabels = opts.xLabels.map((lbl, i) => {
      const x = padL + (i / (n - 1)) * (w - padL - padR);
      return `<text x="${x}" y="${h - 6}" text-anchor="middle" fill="var(--fg-mute)" font-size="11" font-family="JetBrains Mono, monospace">${lbl}</text>`;
    }).join('');
  }

  svg.innerHTML = `
    <defs>
      <linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${area}" fill="url(#${gradId})"></path>
    <path d="${d}" stroke="${color}" stroke-width="1.75" fill="none"></path>
    ${basisLine}
    ${xLabels}
  `;
}

/* ─── Drawer / modal helpers ─────────────────────────────────── */
function openOverlay(panelId) {
  const scrim = document.getElementById('scrim');
  const panel = document.getElementById(panelId);
  if (scrim) scrim.classList.add('open');
  if (panel) panel.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeOverlays() {
  document.querySelectorAll('.scrim, .drawer, .modal').forEach(el => el.classList.remove('open'));
  document.body.style.overflow = '';
}

/* ─── Active nav highlighter ─────────────────────────────────── */
function highlightNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.dataset.nav === path) a.setAttribute('aria-current', 'page');
  });
}

/* ─── Boot ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTheme(getTheme());
  setCurrency(getCurrency());
  highlightNav();

  document.querySelectorAll('[data-currency-toggle]').forEach(toggle => {
    toggle.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => setCurrency(b.dataset.curr));
    });
  });
  document.querySelectorAll('[data-theme-toggle]').forEach(toggle => {
    toggle.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => setTheme(b.dataset.theme));
    });
  });

  // ESC closes overlays
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlays(); });

  // Render any pre-declared sparklines
  document.querySelectorAll('svg[data-spark]').forEach(svg => {
    const pts = JSON.parse(svg.dataset.spark);
    sparkline(svg, pts, { color: svg.dataset.color });
  });
  document.querySelectorAll('svg[data-area]').forEach(svg => {
    const pts = JSON.parse(svg.dataset.area);
    const opts = {};
    if (svg.dataset.basis) opts.basis = +svg.dataset.basis;
    if (svg.dataset.xlabels) opts.xLabels = JSON.parse(svg.dataset.xlabels);
    if (svg.dataset.color) opts.color = svg.dataset.color;
    areaChart(svg, pts, opts);
  });
});

/* Expose to inline scripts */
window.App = {
  fmtNumber, getCurrency, setCurrency, applyCurrency,
  getTheme, setTheme, wireTabs, sparkline, areaChart,
  openOverlay, closeOverlays, FX,
};
