/* =====================================================================
   UI kit: icons, components, charts, overlays, shell, router, events
   ===================================================================== */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  stamp: '<path d="M9 3h6v5l3 3v3H6v-3l3-3z"/><path d="M5 18h14"/><path d="M6 21h12"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/><circle cx="12" cy="14" r="1.5"/>',
  coins: '<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v5c0 1.7 2.7 3 6 3s6-1.3 6-3V6"/><path d="M3 11v5c0 1.7 2.7 3 6 3 1.2 0 2.3-.2 3.2-.5"/><circle cx="17" cy="16" r="4"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>',
  building: '<rect x="4" y="3" width="10" height="18" rx="1"/><path d="M14 9h5a1 1 0 0 1 1 1v11h-6"/><path d="M8 7h2M8 11h2M8 15h2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  ok: '<path d="m5 12 5 5L20 7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  flag: '<path d="M4 21V4h12l-2 4 2 4H4"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>',
  dollar: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
  dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  board: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
};
function icon(n, cls) { return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; }
const LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.4 6.9 7.1.2-5.7 4.3 2.1 7-5.9-4.2-5.9 4.2 2.1-7L2.5 9.6l7.1-.2z" fill="#3b3494"/></svg>';

/* ---------- small components ---------- */
function avatar(u, size) { u = typeof u === 'string' ? user(u) : u; return '<span class="avatar ' + (size || '') + '" style="background:' + u.color + '" title="' + esc(u.name) + '">' + esc(u.initials) + '</span>'; }
function person(id, opt) { const u = user(id); opt = opt || {}; return '<span class="person">' + avatar(u, opt.size || 'sm') + '<span>' + esc(opt.short ? u.name.split(' ')[0] : u.name) + (opt.title ? ' <small class="muted">· ' + esc(u.title) + '</small>' : '') + '</span></span>'; }
function badge(text, cls, plain) { return '<span class="badge ' + (cls || '') + (plain ? ' plain' : '') + '">' + esc(text) + '</span>'; }
function taskStatusBadge(t) { const s = TASK_STATUS[t.status]; return badge(s.label, s.cls) + (isOverdue(t) ? ' ' + badge('Overdue', 'b-bad') : ''); }
function prioBadge(p) { const x = PRIORITY[p] || PRIORITY.medium; return badge(x.label, x.cls, true); }
function progressBar(v, cls) { return '<div class="progress ' + (cls || '') + '" role="progressbar" aria-valuenow="' + Math.round(v) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + clamp(v, 0, 100) + '%"></i></div>'; }
function cfg(txt) { return '<span class="cfg" title="Placeholder business rule — change it in Settings">' + icon('gear') .replace('<svg', '<svg width="10" height="10"') + (txt || 'Configurable') + '</span>'; }
function companyTag(cid) { const c = company(cid); return '<span class="tag">' + esc(c.short) + '</span>'; }
function card(title, body, opt) {
  opt = opt || {};
  return '<section class="card ' + (opt.cls || '') + '"' + (opt.id ? ' id="' + opt.id + '"' : '') + '>' + (title ? '<div class="card-h"><div><h3>' + title + '</h3>' + (opt.sub ? '<div class="sub">' + opt.sub + '</div>' : '') + '</div>' + (opt.actions ? '<div class="row">' + opt.actions + '</div>' : '') + '</div>' : '') + '<div class="card-b ' + (opt.flush ? 'flush' : '') + '">' + body + '</div></section>';
}
function kpiTile(label, value, delta, opt) {
  opt = opt || {};
  return '<div class="card kpi ' + (opt.hero ? 'hero' : '') + '"' + (opt.act ? ' data-act="' + opt.act + '" style="cursor:pointer"' : '') + '><div class="lbl">' + (opt.icon ? icon(opt.icon).replace('<svg', '<svg width="14" height="14"') : '') + esc(label) + '</div><div class="kpi-val">' + value + '</div>' + (delta ? '<div class="delta">' + delta + '</div>' : '') + '</div>';
}
function deltaTxt(cur, prev, invert, suffix) {
  if (!prev) return '<span class="muted">' + (suffix || '') + '</span>';
  const d = (cur - prev) / Math.abs(prev) * 100; const good = invert ? d < 0 : d > 0;
  return '<span class="' + (good ? 'up' : 'down') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(1) + '%</span> <span class="muted">' + (suffix || '') + '</span>';
}
function emptyState(t) { return '<div class="empty">' + esc(t) + '</div>'; }
function selectEl(id, opts, val, extra) {
  return '<select class="select" id="' + id + '" ' + (extra || '') + '>' + opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
}
function tabsEl(items, cur, act) { return '<div class="tabs" role="tablist">' + items.map(([k, l, n]) => '<button role="tab" class="' + (k === cur ? 'on' : '') + '" data-act="' + act + '" data-v="' + k + '">' + esc(l) + (n != null ? '<span class="count">' + n + '</span>' : '') + '</button>').join('') + '</div>'; }
function segEl(items, cur, act) { return '<div class="seg">' + items.map(([k, l]) => '<button class="' + (k === cur ? 'on' : '') + '" data-act="' + act + '" data-v="' + k + '">' + l + '</button>').join('') + '</div>'; }
function noticeEl(text, kind, ic) { return '<div class="notice ' + (kind || '') + '">' + icon(ic || 'info') + '<div>' + text + '</div></div>'; }
function companyOptions(ids, withAll) { const o = (ids || activeCompanyIds()).map(id => [id, company(id).name]); return withAll ? [['all', 'All companies']].concat(o) : o; }
function deptOptions(cid, withAll) { const o = state.departments.filter(d => !cid || cid === 'all' || d.companyId === cid).map(d => [d.id, (d.parentId ? '— ' : '') + d.name + (cid && cid !== 'all' ? '' : ' (' + company(d.companyId).short + ')')]); return withAll ? [['all', 'All departments']].concat(o) : o; }
function userOptions(list, withAll) { const o = list.map(u => [u.id, u.name + ' — ' + u.title]); return withAll ? [['all', 'Everyone']].concat(o) : o; }

/* table with pagination */
function tableEl(cols, rows, opt) {
  opt = opt || {};
  const size = opt.pageSize || 0; const key = opt.pageKey || 'pg';
  let page = App.ui[key] || 0; const pages = size ? Math.max(1, Math.ceil(rows.length / size)) : 1; if (page >= pages) page = pages - 1;
  const view = size ? rows.slice(page * size, page * size + size) : rows;
  const head = '<thead><tr>' + cols.map(c => '<th class="' + (c.r ? 'r' : '') + '">' + c.h + '</th>').join('') + '</tr></thead>';
  const body = view.length ? view.map(r => '<tr class="' + (opt.rowAct ? 'clickable ' : '') + (opt.rowCls ? opt.rowCls(r) : '') + '"' + (opt.rowAct ? ' data-act="' + opt.rowAct + '" data-id="' + esc(r.id) + '"' : '') + '>' + cols.map(c => '<td class="' + (c.r ? 'r num' : '') + (c.nowrap ? ' nowrap' : '') + '">' + c.v(r) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + cols.length + '">' + emptyState(opt.empty || 'Nothing here yet.') + '</td></tr>';
  const foot = opt.foot ? '<tfoot><tr>' + opt.foot.map((f, i) => '<td class="' + (cols[i] && cols[i].r ? 'r num' : '') + '">' + f + '</td>').join('') + '</tr></tfoot>' : '';
  const pager = size && rows.length > size ? '<div class="pager"><span>' + (page * size + 1) + '–' + Math.min(rows.length, page * size + size) + ' of ' + rows.length + '</span><button class="btn sm" data-act="page" data-k="' + key + '" data-v="' + (page - 1) + '"' + (page === 0 ? ' disabled' : '') + '>Prev</button><button class="btn sm" data-act="page" data-k="' + key + '" data-v="' + (page + 1) + '"' + (page >= pages - 1 ? ' disabled' : '') + '>Next</button></div>' : '';
  return '<div class="table-wrap"><table class="t">' + head + '<tbody>' + body + '</tbody>' + foot + '</table></div>' + pager;
}

/* ---------- charts (SVG, token-colored, hover tooltips) ---------- */
function niceMax(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }
function tipHtml(title, rows) { return esc('<div class="tt-h">' + esc(title) + '</div>' + rows.map(([c, n, v]) => '<div class="tt-r"><span><i class="key" style="background:' + c + '"></i> ' + esc(n) + '</span><b>' + esc(v) + '</b></div>').join('')); }
function legendEl(series, line) { return '<div class="legend">' + series.map(s => '<span><i class="' + (line ? 'ln' : '') + '" style="background:' + s.color + '"></i>' + esc(s.name) + '</span>').join('') + '</div>'; }
function barChart(o) {
  const W = 640, H = o.height || 220, L = 52, Rm = 8, T = 10, B = 24;
  const n = o.labels.length, sN = o.series.length;
  const all = o.series.flatMap(s => s.values);
  let max = Math.max(0, ...all), min = Math.min(0, ...all);
  if (o.stacked) { max = Math.max(0, ...o.labels.map((_, i) => sum(o.series, s => Math.max(0, s.values[i])))); }
  const top = niceMax(max), bot = min < 0 ? -niceMax(-min) : 0;
  const y = v => T + (H - T - B) * (1 - (v - bot) / (top - bot));
  const fmt = o.fmt || (v => money(v, { compact: true }));
  const gw = (W - L - Rm) / n; const pad = gw * (n > 8 ? .22 : .28); const bw = o.stacked ? gw - pad * 2 : Math.max(2, (gw - pad * 2 - (sN - 1) * 2) / sN);
  let g = '';
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) { const v = bot + (top - bot) * i / ticks; g += '<line class="gridl" x1="' + L + '" x2="' + (W - Rm) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + esc(fmt(v)) + '</text>'; }
  if (bot < 0) g += '<line class="axis" x1="' + L + '" x2="' + (W - Rm) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
  const barPath = (x, v0, v1, w) => { const ya = y(v0), yb = y(v1); const up = yb < ya; const h = Math.abs(yb - ya); const r = Math.min(4, h, w / 2); if (h < .5) return ''; if (up) return 'M' + x + ',' + ya + 'V' + (yb + r) + 'Q' + x + ',' + yb + ' ' + (x + r) + ',' + yb + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + yb + ' ' + (x + w) + ',' + (yb + r) + 'V' + ya + 'Z'; return 'M' + x + ',' + ya + 'V' + (yb - r) + 'Q' + x + ',' + yb + ' ' + (x + r) + ',' + yb + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + yb + ' ' + (x + w) + ',' + (yb - r) + 'V' + ya + 'Z'; };
  o.labels.forEach((lab, i) => {
    const gx = L + gw * i;
    if (o.stacked) {
      let acc = 0;
      o.series.forEach((s, si) => { const v = s.values[i]; if (v > 0) { const p = barPath(gx + pad, acc, acc + v, bw); g += '<path class="bar" d="' + p + '" fill="' + s.color + '"/>'; acc += v; if (si < sN - 1) g += '<line x1="' + (gx + pad) + '" x2="' + (gx + pad + bw) + '" y1="' + y(acc) + '" y2="' + y(acc) + '" stroke="var(--surface)" stroke-width="2"/>'; } });
    } else o.series.forEach((s, si) => { const v = s.values[i]; g += '<path class="bar" d="' + barPath(gx + pad + si * (bw + 2), 0, v, bw) + '" fill="' + s.color + '"/>'; });
    if (n <= 14 || i % 2 === 0) g += '<text x="' + (gx + gw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(lab) + '</text>';
    const tip = tipHtml(o.tipTitle ? o.tipTitle(i) : lab, o.series.map(s => [s.color, s.name, fmt(s.values[i], true)]).concat(o.tipExtra ? o.tipExtra(i) : []));
    g += '<rect class="hit" x="' + gx + '" y="' + T + '" width="' + gw + '" height="' + (H - T - B) + '" data-tip="' + tip + '"' + (o.act ? ' data-act="' + o.act + '" data-i="' + i + '"' : '') + '/>';
  });
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Bar chart') + '">' + g + '</svg>' + (o.noLegend ? '' : '<div style="margin-top:8px">' + legendEl(o.series) + '</div>');
}
function lineChart(o) {
  const W = 640, H = o.height || 220, L = 52, Rm = 12, T = 10, B = 24;
  const n = o.labels.length; const all = o.series.flatMap(s => s.values).concat(o.target != null ? [o.target] : []);
  const mx = Math.max(...all), mn = Math.min(...all);
  let top, bot;
  if (o.zero !== false && mn >= 0) { top = niceMax(mx); bot = 0; } else { const span = (mx - mn) || 1; top = mx + span * .15; bot = mn - span * .15; }
  const x = i => L + (W - L - Rm) * (n === 1 ? .5 : i / (n - 1));
  const y = v => T + (H - T - B) * (1 - (v - bot) / (top - bot));
  const fmt = o.fmt || (v => money(v, { compact: true }));
  let g = '';
  for (let i = 0; i <= 4; i++) { const v = bot + (top - bot) * i / 4; g += '<line class="gridl" x1="' + L + '" x2="' + (W - Rm) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + esc(fmt(v)) + '</text>'; }
  if (o.target != null) g += '<line x1="' + L + '" x2="' + (W - Rm) + '" y1="' + y(o.target) + '" y2="' + y(o.target) + '" stroke="var(--muted)" stroke-dasharray="4 4"/><text x="' + (W - Rm) + '" y="' + (y(o.target) - 5) + '" text-anchor="end">Target ' + esc(fmt(o.target)) + '</text>';
  o.series.forEach((s, si) => {
    const pts = s.values.map((v, i) => [x(i), y(v)]);
    if (o.area && si === 0) g += '<path d="M' + pts.map(p => p.join(',')).join('L') + 'L' + x(n - 1) + ',' + y(Math.max(bot, 0)) + 'L' + x(0) + ',' + y(Math.max(bot, 0)) + 'Z" fill="' + s.color + '" fill-opacity=".10"/>';
    g += '<path d="M' + pts.map(p => p.join(',')).join('L') + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="5 4"' : '') + '/>';
    const lp = pts[pts.length - 1]; g += '<circle cx="' + lp[0] + '" cy="' + lp[1] + '" r="4" fill="' + s.color + '" stroke="var(--surface)" stroke-width="2"/>';
  });
  o.labels.forEach((lab, i) => {
    if (n <= 13 || i % 2 === 0) g += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '">' + esc(lab) + '</text>';
    const w = (W - L - Rm) / Math.max(1, n - 1);
    g += '<rect class="hit" x="' + Math.max(L, x(i) - w / 2) + '" y="' + T + '" width="' + w + '" height="' + (H - T - B) + '" data-tip="' + tipHtml(lab, o.series.map(s => [s.color, s.name, fmt(s.values[i], true)])) + '"/>';
  });
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Line chart') + '">' + g + '</svg>' + (o.noLegend || o.series.length < 2 ? '' : '<div style="margin-top:8px">' + legendEl(o.series, true) + '</div>');
}
function sparkline(vals, color, w, h) {
  w = w || 110; h = h || 30; const mx = Math.max(...vals), mn = Math.min(...vals); const sp = (mx - mn) || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (w - 4) + 2, h - 3 - ((v - mn) / sp) * (h - 6)]);
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="M' + pts.map(p => p.join(',')).join('L') + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round"/><circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="3" fill="' + color + '"/></svg>';
}
function hbars(rows, opt) {
  // rows: [{label, value, color, sub, act, id}] — HTML bars, label left, value right
  opt = opt || {}; const mx = Math.max(1, ...rows.map(r => Math.abs(r.value)));
  const fmt = opt.fmt || (v => money(v, { compact: true }));
  return '<div class="stack" style="gap:12px">' + rows.map(r => '<div' + (r.act ? ' data-act="' + r.act + '" data-id="' + r.id + '" style="cursor:pointer"' : '') + ' data-tip="' + tipHtml(r.label, [[r.color || 'var(--s1)', opt.name || 'Value', fmt(r.value)]]) + '"><div class="row" style="justify-content:space-between;margin-bottom:5px"><span class="strong small">' + esc(r.label) + (r.sub ? ' <span class="muted" style="font-weight:500">' + r.sub + '</span>' : '') + '</span><span class="num small strong">' + fmt(r.value) + '</span></div><div class="progress" style="height:8px"><i style="width:' + (Math.abs(r.value) / mx * 100) + '%;background:' + (r.value < 0 ? 'var(--bad)' : (r.color || 'var(--s1)')) + '"></i></div></div>').join('') + '</div>';
}
function stackBarEl(segs, fmt, name) { fmt = fmt || String; const tot = sum(segs, s => s.value) || 1; return '<div class="stackbar">' + segs.filter(s => s.value > 0).map(s => '<i style="width:' + (s.value / tot * 100) + '%;background:' + s.color + '" data-tip="' + tipHtml(s.label, [[s.color, name || 'Count', fmt(s.value)]]) + '"></i>').join('') + '</div><div class="legend" style="margin-top:10px">' + segs.map(s => '<span><i style="background:' + s.color + '"></i>' + esc(s.label) + ' <b class="num">' + esc(fmt(s.value)) + '</b></span>').join('') + '</div>'; }
const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
function companyColor(cid) { const c = company(cid); return c.slot ? SERIES[(c.slot - 1) % 4] : 'var(--muted)'; }

/* ---------- overlays ---------- */
const App = { route: { page: 'dashboard' }, ui: {}, drawer: null };
function openModal(html, wide) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '<div class="overlay" data-act="overlay-close" data-which="modal"><div class="modal ' + (wide ? 'wide' : '') + '" role="dialog" aria-modal="true">' + html + '</div></div>';
  const f = root.querySelector('input:not([type=hidden]):not([type=checkbox]),textarea,select'); if (f) setTimeout(() => f.focus(), 30);
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
function modalShell(title, body, footer) { return '<div class="modal-h"><h3>' + title + '</h3><button class="icon-btn" data-act="close-modal" aria-label="Close">' + icon('x') + '</button></div><div class="modal-b">' + body + '</div><div class="modal-f">' + (footer || '') + '</div>'; }
function formVals(root) {
  root = root || document.getElementById('modal-root'); const o = {};
  root.querySelectorAll('[name]').forEach(el => { if (el.type === 'checkbox') o[el.name] = el.checked; else if (el.type === 'file') o[el.name] = el.files; else o[el.name] = el.value; });
  return o;
}
function field(label, inner, opt) { opt = opt || {}; return '<div class="field ' + (opt.full ? 'full' : '') + '"><label' + (opt.for ? ' for="' + opt.for + '"' : '') + '>' + label + '</label>' + inner + (opt.hint ? '<div class="hint">' + opt.hint + '</div>' : '') + '</div>'; }
function inputEl(name, val, attrs) { return '<input class="input" id="f_' + name + '" name="' + name + '" value="' + esc(val == null ? '' : val) + '" ' + (attrs || '') + '>'; }
function selectF(name, opts, val, attrs) { return selectEl('f_' + name, opts, val, 'name="' + name + '" ' + (attrs || '')); }
function openDrawer(type, id) { App.drawer = { type, id }; renderDrawer(); }
function closeDrawer() { App.drawer = null; document.getElementById('drawer-root').innerHTML = ''; }
function renderDrawer() {
  const root = document.getElementById('drawer-root');
  if (!App.drawer) { root.innerHTML = ''; return; }
  const fn = DRAWERS[App.drawer.type]; const html = fn ? fn(App.drawer.id) : '';
  if (!html) { closeDrawer(); return; }
  const scroll = root.querySelector('.drawer-b'); const st = scroll ? scroll.scrollTop : 0;
  root.innerHTML = '<div class="overlay right" data-act="overlay-close" data-which="drawer"><aside class="drawer" role="dialog" aria-modal="true">' + html + '</aside></div>';
  const nb = root.querySelector('.drawer-b'); if (nb) nb.scrollTop = st;
}
function drawerHead(eyebrow, title, extra) { return '<div class="drawer-h"><div style="flex:1;min-width:0"><div class="eyebrow">' + eyebrow + '</div><h2>' + title + '</h2>' + (extra ? '<div class="row" style="margin-top:8px">' + extra + '</div>' : '') + '</div><button class="icon-btn" data-act="close-drawer" aria-label="Close">' + icon('x') + '</button></div>'; }
const DRAWERS = {};
let _toastT;
function toast(msg, bad) {
  const w = document.getElementById('toasts'); const el = document.createElement('div'); el.className = 'toast ' + (bad ? 'bad' : ''); el.textContent = msg; while (w.children.length >= 2) w.firstChild.remove(); w.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
function historyTimeline(entityId, limit) {
  const h = historyOf(entityId).slice(0, limit || 50);
  if (!h.length) return emptyState('No recorded activity yet.');
  const ic = { approved: ['good', 'ok'], posted: ['good', 'ok'], rejected: ['bad', 'x'], reversed: ['bad', 'undo'], cancelled: ['bad', 'x'], submitted: ['cur', 'send'], delegated: ['cur', 'arrowR'], created: ['', 'plus'], adjusted: ['warn', 'edit'], payment: ['good', 'dollar'] };
  return '<div class="timeline">' + h.map(a => { const [c, i] = ic[a.action] || ['', 'dots']; return '<div class="tl"><div class="dotm ' + c + '">' + icon(i) + '</div><div class="tx"><b>' + esc(user(a.actorId).name) + '</b> — ' + esc(a.summary) + '<small>' + fmtDT(a.at) + ' · ' + esc(a.action) + '</small></div></div>'; }).join('') + '</div>';
}
function attachList(files, opts) {
  opts = opts || {};
  return '<div class="stack" style="gap:8px">' + (files.length ? files.map(f => '<div class="file">' + icon('file') + '<div style="flex:1;min-width:0"><div class="strong" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f.name) + '</div><div class="muted small">' + Math.max(1, Math.round((f.size || 0) / 1000)) + ' KB' + (f.by ? ' · ' + esc(user(f.by).name) : '') + (f.at ? ' · ' + ago(f.at) : '') + '</div></div></div>').join('') : '<div class="muted small">No attachments.</div>') + (opts.act ? '<label class="btn sm" style="align-self:flex-start">' + icon('clip') + 'Attach file<input type="file" hidden multiple data-upload="' + opts.act + '" data-id="' + opts.id + '"></label><div class="muted small">Prototype stores file name and size only.</div>' : '') + '</div>';
}

/* ---------- shell ---------- */
const NAV = [
  ['Workspace', [['dashboard', 'Dashboard', 'home', 'dashboard.view'], ['tasks', 'Tasks', 'check', 'tasks.view'], ['projects', 'Projects', 'folder', 'projects.view'], ['approvals', 'Approvals', 'stamp', 'approvals.view'], ['operations', 'Operations', 'gauge', 'operations.view']]],
  ['Business', [['finance', 'Finance', 'coins', 'finance.view'], ['reports', 'Reports', 'chart', 'reports.view'], ['companies', 'Companies', 'building', 'companies.view'], ['people', 'People', 'users', 'people.view']]],
  ['Tools', [['documents', 'Documents', 'file', 'documents.view'], ['calendar', 'Calendar', 'calendar', 'calendar.view'], ['notifications', 'Notifications', 'bell', null], ['settings', 'Settings', 'gear', null]]],
];
function pageAllowed(page) { for (const [, items] of NAV) for (const it of items) if (it[0] === page) return !it[3] || can(it[3]); return false; }
function myPendingApprovals() {
  const a = state.approvals.filter(x => canActOnApproval(x)).length;
  const t = state.tasks.filter(x => canReviewTask(x)).length;
  return a + t;
}
function sidebarHtml() {
  const counts = { approvals: myPendingApprovals(), notifications: unreadCount(), tasks: state.tasks.filter(t => t.assigneeId === me().id && t.status !== 'completed').length };
  let h = '<div class="brand"><div class="brand-mark">' + LOGO + '</div><div><b>Negroni</b><small>Management OS</small></div></div>';
  for (const [grp, items] of NAV) {
    const vis = items.filter(it => !it[3] || can(it[3])); if (!vis.length) continue;
    h += '<div class="nav-label">' + grp + '</div>';
    h += vis.map(([p, l, ic]) => '<button class="nav-item ' + (App.route.page === p ? 'active' : '') + '" data-act="nav" data-page="' + p + '"' + (App.route.page === p ? ' aria-current="page"' : '') + '>' + icon(ic) + '<span>' + l + '</span>' + (counts[p] ? '<span class="count">' + counts[p] + '</span>' : '') + '</button>').join('');
  }
  const u = me();
  h += '<div class="sidebar-foot"><div class="perm-note">Signed in as <b style="color:#fff">' + esc(roleLabel(u.role)) + '</b><br>Access: ' + esc(SCOPES[u.scope]) + '<br>' + ALL_PERMS.filter(p => can(p)).length + ' of ' + ALL_PERMS.length + ' permissions</div></div>';
  return h;
}
function topbarHtml() {
  const u = me(); const ids = scopeCompanyIds();
  const scopeCtl = ids.length > 1 ? selectEl('scope-select', [['all', 'All companies (' + ids.length + ')']].concat(ids.map(id => [id, company(id).name])), state.session.companyFilter || 'all', 'class="scope-select" data-act-change="scope" aria-label="Company scope"') : '<span class="tag" style="padding:6px 10px">' + esc(company(u.companyId).name) + '</span>';
  return '<button class="icon-btn menu-btn" data-act="toggle-nav" aria-label="Menu">' + icon('menu') + '</button>' +
    '<div class="search">' + icon('search') + '<input id="gsearch" type="search" placeholder="Search tasks, projects, requests, people…" autocomplete="off" aria-label="Global search"><div id="search-results" class="search-results" hidden></div></div>' +
    '<div class="top-actions">' + (Cloud.ws ? '<span data-save-status>' + cloudStatusHtml() + '</span>' : '') + scopeCtl +
    '<button class="icon-btn" data-act="nav" data-page="notifications" aria-label="Notifications">' + icon('bell') + (unreadCount() ? '<span class="dot">' + unreadCount() + '</span>' : '') + '</button>' +
    '<button class="user-chip" data-act="user-menu" aria-label="Account menu">' + avatar(u) + '<span class="who"><b>' + esc(u.name) + '</b><small>' + esc(roleLabel(u.role)) + ' · ' + esc(company(u.companyId).short) + '</small></span></button></div>';
}
const VIEWS = {};
function render() {
  const root = document.getElementById('app');
  if (!state) { root.innerHTML = VIEWS.cloudScreen(); return; }
  if (!state.session.userId) { root.innerHTML = VIEWS.login(); return; }
  const ae = document.activeElement; const fid = ae && ae.id; const sel = ae && ae.selectionStart;
  if (!pageAllowed(App.route.page)) App.route = { page: 'dashboard' };
  let content;
  try { content = (VIEWS[App.route.page] || VIEWS.dashboard)(); }
  catch (e) { console.error(e); content = card('Something went wrong', '<p>' + esc(e.message) + '</p>'); }
  if (Cloud.ws && Cloud.ws.readOnly) content = noticeEl('<b>View only.</b> You can look around and try things, but nothing you change here is saved to “' + esc(Cloud.ws.name) + '”.', 'warn', 'lock') + '<div style="height:12px"></div>' + content;
  root.innerHTML = '<div class="app ' + (App.ui.navOpen ? 'nav-open' : '') + '"><nav class="sidebar" aria-label="Main">' + sidebarHtml() + '</nav><div class="scrim" data-act="toggle-nav"></div><div class="main"><header class="topbar">' + topbarHtml() + '</header><main class="content" id="content">' + content + '</main></div></div>';
  if (fid && fid !== 'gsearch') { const el = document.getElementById(fid); if (el) { el.focus(); try { if (sel != null) el.setSelectionRange(sel, sel); } catch (e) { } } }
  saveState();
}
function refresh() { render(); renderDrawer(); }
function go(page, opt) {
  opt = opt || {};
  App.route = Object.assign({ page }, opt); App.ui.navOpen = false; closeModal();
  if (!opt.keepDrawer) closeDrawer();
  render(); window.scrollTo(0, 0);
}
function openEntity(type, id) {
  if (type === 'task') openDrawer('task', id);
  else if (type === 'approval') openDrawer('approval', id);
  else if (type === 'transaction') openDrawer('tx', id);
  else if (type === 'project') go('projects', { id });
  else if (type === 'company') go('companies', { id });
  else if (type === 'user') openDrawer('person', id);
  else if (type === 'invoice' || type === 'bill') openDrawer(type, id);
  else if (type === 'risk') openDrawer('risk', id);
}
function followLink(l) {
  if (!l) return;
  if (!pageAllowed(l.page)) { toast('You do not have access to that section.', true); return; }
  if (l.page === 'tasks' && l.id) { go('tasks'); openDrawer('task', l.id); return; }
  if (l.page === 'approvals' && l.id) { go('approvals'); openDrawer('approval', l.id); return; }
  if (l.page === 'finance') { App.ui.finTab = l.tab || 'overview'; go('finance'); if (l.id) openDrawer('tx', l.id); return; }
  go(l.page, { id: l.id });
}

/* ---------- global search ---------- */
function searchAll(q) {
  q = q.trim().toLowerCase(); if (q.length < 2) return [];
  const m = s => String(s || '').toLowerCase().includes(q);
  const out = [];
  const push = (group, items) => { if (items.length) out.push([group, items.slice(0, 6)]); };
  push('Tasks', state.tasks.filter(t => visibleTask(t) && (m(t.title) || m(t.key))).map(t => ({ t: 'task', id: t.id, label: t.title, sub: t.key + ' · ' + TASK_STATUS[t.status].label })));
  if (can('projects.view')) push('Projects', state.projects.filter(p => visibleProject(p) && m(p.name)).map(p => ({ t: 'project', id: p.id, label: p.name, sub: company(p.companyId).short })));
  push('Requests', state.approvals.filter(a => visibleApproval(a) && (m(a.title) || m(a.no))).map(a => ({ t: 'approval', id: a.id, label: a.title, sub: a.no + ' · ' + a.status })));
  if (can('people.view')) push('People', state.users.filter(u => canSeeUser(u) && (m(u.name) || m(u.title))).map(u => ({ t: 'user', id: u.id, label: u.name, sub: u.title })));
  if (can('companies.view')) push('Companies', state.companies.filter(c => scopeCompanyIds().includes(c.id) && (m(c.name) || m(c.industry))).map(c => ({ t: 'company', id: c.id, label: c.name, sub: c.industry })));
  if (can('finance.view')) {
    push('Transactions', state.transactions.filter(t => scopeCompanyIds().includes(t.companyId) && (m(t.no) || m(t.memo) || m(t.party))).slice(-40).reverse().map(t => ({ t: 'transaction', id: t.id, label: t.no + ' — ' + t.memo, sub: money(t.amount) })));
    push('Invoices & bills', state.invoices.filter(i => scopeCompanyIds().includes(i.companyId) && (m(i.number) || m(i.customer))).map(i => ({ t: 'invoice', id: i.id, label: i.number + ' — ' + i.customer, sub: money(i.amount) })).concat(state.bills.filter(i => scopeCompanyIds().includes(i.companyId) && (m(i.number) || m(i.vendor))).map(i => ({ t: 'bill', id: i.id, label: i.number + ' — ' + i.vendor, sub: money(i.amount) }))));
  }
  if (can('operations.view')) push('Risks & issues', state.risks.filter(r => scopeCompanyIds().includes(r.companyId) && m(r.title)).map(r => ({ t: 'risk', id: r.id, label: r.title, sub: r.key })));
  return out;
}
function renderSearch(q) {
  const box = document.getElementById('search-results'); if (!box) return;
  const res = searchAll(q);
  if (q.trim().length < 2) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = res.length ? res.map(([g, items]) => '<div class="sr-group">' + g + '</div>' + items.map(it => '<button class="sr-item" data-act="open" data-t="' + it.t + '" data-id="' + it.id + '"><span>' + esc(it.label) + '</span><small>' + esc(it.sub) + '</small></button>').join('')).join('') : '<div class="empty">No matches in your access scope.</div>';
}

/* ---------- theme ---------- */
function applyTheme(t) { if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); try { localStorage.setItem('northstar-theme', t || ''); } catch (e) { } }

/* ---------- event wiring ---------- */
const ACT = {};
const CHANGE = {};
function bindEvents() {
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el) { const sb = document.getElementById('search-results'); if (sb && !ev.target.closest('.search')) sb.hidden = true; return; }
    const a = el.dataset.act;
    if (a === 'overlay-close') { if (ev.target !== el) return; if (el.dataset.which === 'modal') closeModal(); else closeDrawer(); return; }
    if (el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
    const fn = ACT[a]; if (fn) { ev.preventDefault(); fn(el, ev); }
  });
  document.addEventListener('change', ev => {
    const el = ev.target;
    if (el.dataset && el.dataset.upload) { handleUpload(el); return; }
    const a = el.dataset && el.dataset.actChange; if (a && CHANGE[a]) CHANGE[a](el, ev);
  });
  document.addEventListener('input', ev => {
    const el = ev.target;
    if (el.id === 'gsearch') { renderSearch(el.value); return; }
    const a = el.dataset && el.dataset.actInput; if (a && CHANGE[a]) { clearTimeout(el._t); el._t = setTimeout(() => CHANGE[a](el, ev), 180); }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { if (document.getElementById('modal-root').innerHTML) closeModal(); else if (App.drawer) closeDrawer(); const sb = document.getElementById('search-results'); if (sb) sb.hidden = true; }
    if (ev.key === 'Enter' && ev.target.id === 'gsearch') { const f = document.querySelector('#search-results .sr-item'); if (f) f.click(); }
    if ((ev.key === '/' ) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { const s = document.getElementById('gsearch'); if (s) { ev.preventDefault(); s.focus(); } }
  });
  // tooltip
  const tip = document.createElement('div'); tip.className = 'tooltip'; tip.hidden = true; document.body.appendChild(tip);
  document.addEventListener('pointerover', ev => { const el = ev.target.closest && ev.target.closest('[data-tip]'); if (!el) { tip.hidden = true; return; } tip.innerHTML = el.getAttribute('data-tip'); tip.hidden = false; });
  document.addEventListener('pointermove', ev => { if (tip.hidden) return; const w = tip.offsetWidth, h = tip.offsetHeight; let x = ev.clientX + 14, y = ev.clientY + 14; if (x + w > innerWidth - 8) x = ev.clientX - w - 14; if (y + h > innerHeight - 8) y = ev.clientY - h - 14; tip.style.left = x + 'px'; tip.style.top = y + 'px'; });
  document.addEventListener('pointerout', ev => { if (ev.target.closest && ev.target.closest('[data-tip]') && !(ev.relatedTarget && ev.relatedTarget.closest && ev.relatedTarget.closest('[data-tip]'))) tip.hidden = true; });
  document.addEventListener('scroll', () => { tip.hidden = true; }, true);
}
function handleUpload(el) {
  const files = [...el.files].map(f => ({ id: uid('f'), name: f.name, size: f.size, by: me().id, at: nowISO() }));
  if (!files.length) return;
  const kind = el.dataset.upload, id = el.dataset.id;
  if (kind === 'task') { const t = get('tasks', id); t.attachments.push(...files); audit('attached', 'task', id, 'Attached ' + files.map(f => f.name).join(', ')); }
  if (kind === 'approval') { const a = get('approvals', id); a.attachments.push(...files); audit('attached', 'approval', id, 'Attached ' + files.map(f => f.name).join(', ')); }
  if (kind === 'tx') { const t = get('transactions', id); if (t.status !== 'draft') { toast('Posted entries are locked. Attach to a reversal or adjustment instead.', true); return; } t.docs.push(...files); audit('attached', 'transaction', id, 'Attached supporting document ' + files.map(f => f.name).join(', ')); }
  if (kind === 'modal') { App.ui.pendingFiles = (App.ui.pendingFiles || []).concat(files); const l = document.getElementById('pending-files'); if (l) l.innerHTML = App.ui.pendingFiles.map(f => '<div class="file">' + icon('file') + esc(f.name) + '</div>').join(''); return; }
  toast('Attached ' + files.length + ' file' + (files.length > 1 ? 's' : ''));
  refresh();
}

/* generic actions */
Object.assign(ACT, {
  nav: el => go(el.dataset.page),
  'toggle-nav': () => { App.ui.navOpen = !App.ui.navOpen; document.querySelector('.app').classList.toggle('nav-open', App.ui.navOpen); },
  'close-modal': () => closeModal(),
  'close-drawer': () => closeDrawer(),
  open: el => { const sb = document.getElementById('search-results'); if (sb) sb.hidden = true; const s = document.getElementById('gsearch'); if (s) s.value = ''; openEntity(el.dataset.t, el.dataset.id); },
  page: el => { App.ui[el.dataset.k] = Number(el.dataset.v); render(); },
  'user-menu': () => {
    const u = me(); let t = ''; try { t = localStorage.getItem('northstar-theme') || ''; } catch (e) { }
    const byRole = ROLE_KEYS.map(r => [r, state.users.filter(x => x.role === r && x.active !== false)]);
    openModal(modalShell('Account', '<div class="row" style="gap:12px;margin-bottom:16px">' + avatar(u, 'lg') + '<div><div class="strong" style="font-size:16px">' + esc(u.name) + '</div><div class="muted">' + esc(u.title) + ' · ' + esc(company(u.companyId).name) + '</div><div class="row" style="margin-top:6px">' + badge(roleLabel(u.role), 'b-brand') + badge(SCOPES[u.scope], '') + '</div></div></div>' +
      (Cloud.ws ? cloudAccountHtml() + '<div class="hr"></div>' : '') +
      field(Cloud.ws ? 'Prototype: acting as ' + esc(u.name) + ' (' + esc(roleLabel(u.role)) + ')' : 'Switch user (demo login)', '<select class="select" id="switch-user">' + byRole.map(([r, us]) => '<optgroup label="' + esc(roleLabel(r)) + '">' + us.map(x => '<option value="' + x.id + '"' + (x.id === u.id ? ' selected' : '') + '>' + esc(x.name) + ' — ' + esc(x.title) + '</option>').join('') + '</optgroup>').join('') + '</select>', { hint: Cloud.ws ? 'Act as any sample person to test what their role can see. This does not change your real account.' : 'Each person has their own role, company, department, manager and permissions. Switch to test what they can see.' }) +
      '<div class="hr"></div>' + field('Theme', segEl([['', 'System'], ['light', 'Light'], ['dark', 'Dark']], t, 'theme')),
      '<button class="btn" data-act="logout">' + icon('logout') + 'Sign out</button><span class="spacer"></span><button class="btn primary" data-act="switch-user">' + icon('swap') + (Cloud.ws ? 'Act as' : 'Switch') + '</button>'));
  },
  theme: el => { applyTheme(el.dataset.v); el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  'switch-user': () => { const id = document.getElementById('switch-user').value; closeModal(); login(id); },
  logout: () => { if (Cloud.enabled) { closeModal(); cloudSignOut(); return; } audit('logout', 'session', me().id, 'Signed out'); state.session.userId = null; closeModal(); closeDrawer(); saveState(); render(); },
  'login-as': el => login(el.dataset.id),
  'mark-read': el => { const n = state.notifications.find(x => x.id === el.dataset.id); if (n) { n.read = true; } followLink(n && n.link); },
});
Object.assign(CHANGE, {
  scope: el => { state.session.companyFilter = el.value; App.ui = { navOpen: false }; refresh(); },
});
function login(id) {
  state.session.userId = id; state.session.companyFilter = 'all'; App.ui = {}; App.route = { page: 'dashboard' }; App.drawer = null;
  audit('login', 'session', id, 'Signed in');
  runDeadlineSweep();
  render(); renderDrawer(); window.scrollTo(0, 0);
  toast('Signed in as ' + me().name + ' (' + roleLabel(me().role) + ')');
}
