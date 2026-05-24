/* ---- Service Worker ---- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ---- PWA Install Prompt ---- */
let installPrompt = null;
const installBanner = document.getElementById('install-banner');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  installBanner?.classList.remove('hidden');
});

document.getElementById('btn-install')?.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  if (outcome === 'accepted') installBanner.classList.add('hidden');
  installPrompt = null;
});

document.getElementById('btn-dismiss')?.addEventListener('click', () => {
  installBanner.classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
  installBanner?.classList.add('hidden');
});

/* ---- Helpers ---- */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function mapsBtn(url, label) {
  const a = document.createElement('a');
  a.href = url;
  a.className = 'btn-map';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.innerHTML = `📍 ${label || 'Google Maps'}`;
  return a;
}

function renderBadges(badges, container) {
  if (!badges?.length) return;
  const wrap = el('div', 'stop-badges');
  badges.forEach(b => {
    wrap.appendChild(el('span', `badge badge--${b.color}`, b.text));
  });
  container.appendChild(wrap);
}

/* ---- Option item ---- */
function renderOptionItem(item) {
  const card = el('div', item.best ? 'option option--recommended' : 'option');
  if (item.best && item.bestLabel) {
    card.appendChild(el('span', 'option-rec-badge', item.bestLabel));
  }
  card.appendChild(el('h4', null, item.title));
  if (item.desc) card.appendChild(el('p', null, item.desc));
  if (item.badges?.length) {
    const badgeWrap = el('div', 'option-tags');
    item.badges.forEach(b => badgeWrap.appendChild(el('span', `badge badge--${b.color}`, b.text)));
    card.appendChild(badgeWrap);
  }
  if (item.note) card.appendChild(el('p', 'stop-note', item.note.replace(/\n/g, '<br>')));
  if (item.maps) card.appendChild(mapsBtn(item.maps));
  return card;
}

/* ---- Option group ---- */
function renderOptionGroup(group) {
  const frag = document.createDocumentFragment();
  if (group.label) frag.appendChild(el('div', 'options-label', group.label));
  const grid = el('div', `options ${group.layout || 'two-col'}`);
  group.items.forEach(item => grid.appendChild(renderOptionItem(item)));
  frag.appendChild(grid);
  return frag;
}

/* ---- Stop card ---- */
function renderStop(stop) {
  const wrapper = el('div', `stop stop--${stop.kind}`);
  wrapper.dataset.types = (stop.types || []).join(' ');

  const inner = el('div', 'stop-inner');

  // Header row
  const header = el('div', 'stop-header');
  header.appendChild(el('span', 'stop-time', stop.time));
  header.appendChild(el('span', 'stop-icon', stop.icon));
  header.appendChild(el('div', 'stop-title', stop.title));
  inner.appendChild(header);

  // Badges
  renderBadges(stop.badges, inner);

  // Description (string or array)
  if (stop.desc) {
    const descs = Array.isArray(stop.desc) ? stop.desc : [stop.desc];
    descs.forEach(d => inner.appendChild(el('p', 'stop-desc', d)));
  }

  // Note
  if (stop.note) inner.appendChild(el('p', 'stop-note', stop.note.replace(/\n/g, '<br>')));

  // Top-level maps link
  if (stop.maps) inner.appendChild(mapsBtn(stop.maps));

  // Option groups
  if (stop.optionGroups?.length) {
    stop.optionGroups.forEach(group => inner.appendChild(renderOptionGroup(group)));
  }

  wrapper.appendChild(inner);
  return wrapper;
}

/* ---- Day section ---- */
function renderDay(day) {
  const section = document.createElement('section');
  section.id = `day-${day.id}`;
  section.className = 'day';
  section.dataset.day = String(day.id);
  section.setAttribute('aria-labelledby', `day${day.id}-heading`);

  // Header
  const header = el('div', 'day-header');
  header.appendChild(el('div', 'day-num', day.label));
  const h2 = el('h2', 'day-date', day.date);
  h2.id = `day${day.id}-heading`;
  header.appendChild(h2);
  header.appendChild(el('div', 'day-route', day.route));
  header.appendChild(el('div', 'day-stay', day.stay));
  section.appendChild(header);

  // Timezone note
  if (day.tzNote) section.appendChild(el('div', 'day-tz', day.tzNote));

  // Photo
  if (day.photo) {
    const photoWrap = el('div', 'day-photo');
    const img = document.createElement('img');
    img.src = day.photo.url;
    img.alt = day.photo.alt;
    img.loading = 'lazy';
    photoWrap.appendChild(img);
    section.appendChild(photoWrap);
  }

  // Stops timeline
  const stopsWrap = el('div', 'stops');
  day.stops.forEach(stop => stopsWrap.appendChild(renderStop(stop)));
  section.appendChild(stopsWrap);

  return section;
}

/* ---- Hero ---- */
function renderHero(meta) {
  document.getElementById('hero-bg').style.backgroundImage = `url('${meta.hero.url}')`;
  document.getElementById('hero-bg').setAttribute('role', 'img');
  document.getElementById('hero-bg').setAttribute('aria-label', meta.hero.alt);

  const content = document.getElementById('hero-content');
  content.appendChild(el('div', 'trip-badge', `📅 ${meta.subtitle}`));
  content.appendChild(el('h1', null, meta.title));
  content.appendChild(el('p', 'hero-route', meta.route));

  const stats = el('div', 'hero-stats');
  meta.stats.forEach(s => stats.appendChild(el('span', 'hero-stat', `${s.icon} ${s.label}`)));
  content.appendChild(stats);
}

/* ---- Alerts ---- */
function renderAlerts(alerts) {
  const bar = document.getElementById('alerts-bar');
  alerts.forEach(a => {
    const div = el('div', `alert alert--${a.color}`);
    div.appendChild(el('span', null, a.icon));
    const text = el('div');
    text.innerHTML = `<strong>${a.title}</strong> ${a.body}`;
    div.appendChild(text);
    bar.appendChild(div);
  });
}

/* ---- Park Pass ---- */
function renderParkPass(pp) {
  const section = el('div', 'pass-section');
  section.setAttribute('role', 'note');
  section.appendChild(el('h2', null, pp.title));
  section.appendChild(el('p', null, pp.body));
  const ul = document.createElement('ul');
  pp.costs.forEach(c => ul.appendChild(el('li', null, c)));
  section.appendChild(ul);
  return section;
}

/* ---- Filters ---- */
let activeDay = 'all';
let activeType = 'all';
let dayEls = [];
let stopEls = [];

function applyFilters() {
  dayEls.forEach(d => {
    d.classList.toggle('hidden', activeDay !== 'all' && d.dataset.day !== activeDay);
  });
  stopEls.forEach(s => {
    if (activeType === 'all') { s.classList.remove('hidden'); return; }
    const types = (s.dataset.types || '').split(' ');
    s.classList.toggle('hidden', !types.includes(activeType));
  });
}

function renderFilters(days) {
  const filters = document.getElementById('filters');

  // Row 1: days
  const row1 = el('div', 'filter-row');
  row1.appendChild(el('span', 'filter-label', 'Day'));

  function dayBtn(label, val) {
    const btn = el('button', 'filter-btn' + (val === 'all' ? ' active' : ''), label);
    btn.dataset.dayFilter = val;
    btn.addEventListener('click', () => {
      row1.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDay = val;
      applyFilters();
      if (val !== 'all') {
        const target = document.getElementById(`day-${val}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return btn;
  }

  row1.appendChild(dayBtn('All', 'all'));
  const dayLabels = ['Jul 11', 'Jul 12', 'Jul 13', 'Jul 14', 'Jul 15', 'Jul 16', 'Jul 17'];
  days.forEach((d, i) => row1.appendChild(dayBtn(dayLabels[i], String(d.id))));
  filters.appendChild(row1);

  // Row 2: types
  const row2 = el('div', 'filter-row');
  row2.appendChild(el('span', 'filter-label', 'Type'));

  const typeOpts = [
    { label: '🗺️ All', val: 'all' },
    { label: '🏖️ Beaches', val: 'beach' },
    { label: '📸 Viewpoints', val: 'viewpoint' },
    { label: '🥾 Hikes', val: 'hike' },
    { label: '♿ Accessible', val: 'accessible' },
    { label: '🍽️ Food', val: 'food' }
  ];

  typeOpts.forEach(({ label, val }) => {
    const btn = el('button', 'filter-btn' + (val === 'all' ? ' active' : ''), label);
    btn.dataset.typeFilter = val;
    btn.addEventListener('click', () => {
      row2.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = val;
      applyFilters();
    });
    row2.appendChild(btn);
  });
  filters.appendChild(row2);
}

/* ---- Checklist ---- */
const CHECKLIST_KEY = 'bctrip-checklist';

function renderChecklist(items) {
  const section = document.createElement('section');
  section.id = 'checklist';
  section.setAttribute('aria-labelledby', 'checklist-heading');

  section.appendChild(el('h2', null, '🎒 Pre-Trip Pack Checklist'));
  section.appendChild(el('p', null, '<small style="color:var(--muted)">Your progress is saved automatically.</small>'));

  const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}');
  const grid = el('div', 'checklist-grid');

  items.forEach(item => {
    const label = document.createElement('label');
    const checked = !!saved[item.id];
    if (checked) label.classList.add('checked');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = item.id;
    cb.checked = checked;
    cb.addEventListener('change', () => {
      label.classList.toggle('checked', cb.checked);
      const state = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}');
      state[item.id] = cb.checked;
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
    });

    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + item.text));
    grid.appendChild(label);
  });

  section.appendChild(grid);

  const resetBtn = el('button', 'checklist-reset', 'Reset checklist');
  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset all checklist items?')) return;
    grid.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.checked = false;
      cb.closest('label')?.classList.remove('checked');
    });
    localStorage.removeItem(CHECKLIST_KEY);
  });
  section.appendChild(resetBtn);

  return section;
}

/* ---- Accessibility Table ---- */
function renderAccessibilityTable(rows) {
  const section = el('div', 'access-section');
  section.setAttribute('aria-labelledby', 'access-heading');
  section.appendChild(el('h2', null, '♿ Accessibility at a Glance'));

  const wrap = el('div', null);
  wrap.style.overflowX = 'auto';

  const table = el('table', 'access-table');
  table.innerHTML = `<thead><tr><th>Stop</th><th>🚼 Stroller</th><th>♿ LMC</th><th>Hike?</th></tr></thead>`;
  const tbody = document.createElement('tbody');

  rows.forEach(row => {
    const tr = document.createElement('tr');
    const strollerCls = row.stroller === 'yes' ? 'ok' : row.stroller === 'no' ? 'no' : 'partial';
    const lmcCls = row.lmc === 'yes' || row.lmc.startsWith('yes') ? 'ok' : row.lmc === 'no' ? 'no' : 'partial';
    tr.innerHTML = `
      <td>${row.stop}</td>
      <td class="${strollerCls}">${row.stroller === 'yes' ? '✅' : row.stroller === 'no' ? '❌' : '⚠️'} ${row.stroller}</td>
      <td class="${lmcCls}">${row.lmc === 'yes' || row.lmc.startsWith('yes') ? '✅' : row.lmc === 'no' ? '❌' : '⚠️'} ${row.lmc}</td>
      <td>${row.hike}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  section.appendChild(wrap);
  return section;
}

/* ---- Divider ---- */
function divider() { return el('div', 'section-divider'); }

/* ---- Main render ---- */
async function init() {
  try {
    const data = await fetch('trip.json').then(r => {
      if (!r.ok) throw new Error('Failed to load trip data');
      return r.json();
    });

    // Hero + Alerts
    renderHero(data.meta);
    renderAlerts(data.alerts);
    renderFilters(data.days);

    // Clear loading indicator
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Park pass info
    app.appendChild(renderParkPass(data.parkPass));

    // Days
    data.days.forEach((day, i) => {
      const dayEl = renderDay(day);
      app.appendChild(dayEl);
      if (i < data.days.length - 1) app.appendChild(divider());
    });

    // Collect references for filter
    dayEls = Array.from(app.querySelectorAll('.day[data-day]'));
    stopEls = Array.from(app.querySelectorAll('.stop[data-types]'));

    // Checklist
    app.appendChild(divider());
    app.appendChild(renderChecklist(data.checklist));

    // Accessibility table
    app.appendChild(divider());
    app.appendChild(renderAccessibilityTable(data.accessibilityTable));

    // Show footer
    document.getElementById('site-footer').style.display = '';

  } catch (err) {
    document.getElementById('loading').innerHTML = `
      <div style="font-size:3rem">⚠️</div>
      <p style="color:var(--red);margin-top:1rem">Could not load trip data.</p>
      <p style="color:var(--muted);font-size:0.85rem;margin-top:0.5rem">Try opening via a local server or the hosted GitHub Pages URL.</p>
    `;
    console.error(err);
  }
}

init();
