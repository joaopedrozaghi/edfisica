// Página de vendas: hidrata a marcação a partir de /config.js.
// Não importa código do app (/app/), só a configuração.
import { CONFIG } from '../../config.js';

const PLACEHOLDER = 'SEU-CHECKOUT-AQUI';
const DEADLINE_KEY = 'edf:sales:deadline';
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// ---------- Formatadores (cópia mínima de fmtBRL/fmtInt/fmt1 do app) ----------
const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const intFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const dec1Fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtBRL = (x) => brlFmt.format(x); // mantém o espaço sem quebra (U+00A0) do Intl
const fmtInt = (x) => intFmt.format(Math.round(x));
const fmt1 = (x) => dec1Fmt.format(x);
const FORMATS = { brl: fmtBRL, int: fmtInt, dec1: fmt1 };

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Valores derivados (nunca guardados no config) ----------
export function computeDerived(cfg, now = new Date()) {
  const cur = cfg.price.current;
  const anchor = cfg.price.anchor;
  const hasAnchor = typeof anchor === 'number' && anchor > 0;
  const stack = cfg.mainProduct.value + cfg.bonuses.reduce((s, b) => s + b.value, 0);
  return {
    priceBRL: fmtBRL(cur),
    anchorBRL: hasAnchor ? fmtBRL(anchor) : null,
    savingsBRL: hasAnchor ? fmtBRL(Math.round((anchor - cur) * 100) / 100) : null,
    percentOff: hasAnchor ? Math.round((1 - cur / anchor) * 100) : null,
    stackTotalBRL: hasAnchor ? fmtBRL(stack) : null,
    year: now.getFullYear(),
  };
}

const derived = computeDerived(CONFIG);
const DATA = Object.assign({}, CONFIG, { derived });

function resolve(path) {
  let v = DATA;
  for (const k of path.split('.')) {
    if (v === null || typeof v !== 'object' || !(k in v)) return undefined;
    v = v[k];
  }
  return v;
}

function lookup(el, attr) {
  const path = el.getAttribute(attr);
  const v = resolve(path);
  if (v === undefined) console.error('[config] campo ausente: ' + path);
  return v;
}

// ---------- data-cfg / data-cfg-show / data-cfg-hide / data-cfg-href ----------
function bindConfig(root) {
  root.querySelectorAll('[data-cfg]').forEach((el) => {
    const v = lookup(el, 'data-cfg');
    if (v === undefined || v === null) return; // mantém o texto de reserva
    const f = FORMATS[el.getAttribute('data-fmt')];
    el.textContent = f && typeof v === 'number' ? f(v) : String(v);
  });
  root.querySelectorAll('[data-cfg-show]').forEach((el) => {
    const v = lookup(el, 'data-cfg-show');
    if (v !== undefined) el.hidden = !v;
  });
  root.querySelectorAll('[data-cfg-hide]').forEach((el) => {
    const v = lookup(el, 'data-cfg-hide');
    if (v !== undefined) el.hidden = !!v;
  });
  root.querySelectorAll('[data-cfg-href]').forEach((el) => {
    const v = lookup(el, 'data-cfg-href');
    if (v) el.setAttribute('href', String(v));
  });
}

// ---------- Toast ----------
let toastTimer = 0;
function showToast(text) {
  const t = document.getElementById('toast');
  if (!t) return;
  clearTimeout(toastTimer);
  t.textContent = text;
  t.hidden = false;
  toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
}

// ---------- CTAs → checkout ----------
export function checkoutHref(cfg, search) {
  const raw = String(cfg.checkout.url || '');
  if (raw.indexOf(PLACEHOLDER) !== -1) return null;
  let url;
  try { url = new URL(raw); } catch (e) { return null; }
  const q = new URLSearchParams(search || '');
  (cfg.checkout.passThroughParams || []).forEach((name) => {
    const v = q.get(name);
    if (v !== null) url.searchParams.set(name, v);
  });
  return url.toString();
}

function bindCTAs() {
  const href = checkoutHref(CONFIG, location.search);
  const ctas = document.querySelectorAll('[data-cta]');
  if (href) {
    ctas.forEach((a) => a.setAttribute('href', href));
    return;
  }
  console.warn('[config] checkout.url não configurado: os botões não levam ao checkout.');
  ctas.forEach((a) => {
    a.setAttribute('href', '#oferta');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Configure o link do checkout em config.js');
    });
  });
}

// ---------- Renderizações a partir do config ----------
function replaceWith(container, markup) {
  // A marcação de reserva só é trocada depois que o HTML novo foi montado sem erro.
  if (container) container.innerHTML = markup;
}

function renderBonuses() {
  const hasAnchor = derived.anchorBRL !== null;
  const html = CONFIG.bonuses.map((b, i) => `
    <article class="card glass bonus reveal">
      <div class="bonus-top"><span class="bonus-tag">★ Bônus ${i + 1}</span><span class="card-emoji" aria-hidden="true">${esc(b.emoji)}</span></div>
      <h3>${esc(b.title)}</h3>
      <p>${esc(b.desc)}</p>
      <p class="bonus-price">${hasAnchor ? `<s class="was">De ${esc(fmtBRL(b.value))}</s>` : '<span class="incl">Incluso</span>'}<span class="free">GRÁTIS</span></p>
    </article>`).join('');
  replaceWith(document.querySelector('[data-render="bonuses"]'), html);
}

function renderValueStack() {
  const hasAnchor = derived.anchorBRL !== null;
  const items = [CONFIG.mainProduct].concat(CONFIG.bonuses);
  document.querySelectorAll('[data-render="value-stack"]').forEach((ul) => {
    const strike = ul.hasAttribute('data-strike');
    const html = items.map((it) => {
      const val = hasAnchor
        ? (strike ? `<s>${esc(fmtBRL(it.value))}</s>` : esc(fmtBRL(it.value)))
        : 'Incluso';
      return `<li><span>${esc(it.title)}</span><span class="v">${val}</span></li>`;
    }).join('');
    replaceWith(ul, html);
  });
}

function renderTestimonials() {
  const t = CONFIG.testimonials;
  const section = document.getElementById('depoimentos');
  if (!section) return;
  if (!t.enabled || !t.items.length) { section.hidden = true; return; }
  const notice = section.querySelector('[data-testi-notice]');
  if (notice) notice.hidden = !t.items.some((it) => it.example);
  const html = t.items.map((it) => {
    const tag = it.example ? '<span class="testi-tag">Exemplo: substitua por um depoimento real</span>' : '';
    const who = it.example
      ? esc(it.role || '')
      : [it.name ? `<strong>${esc(it.name)}</strong>` : '', esc(it.role || ''), esc(it.city || '')].filter(Boolean).join(' · ');
    return `<figure class="card glass testi reveal">${tag}<blockquote>“${esc(it.text)}”</blockquote><figcaption>${who}</figcaption></figure>`;
  }).join('');
  replaceWith(section.querySelector('[data-render="testimonials"]'), html);
}

function renderSupport() {
  const s = CONFIG.support;
  let href = '';
  let label = '';
  if (s.whatsapp) {
    href = 'https://wa.me/' + encodeURIComponent(s.whatsapp) + '?text=' + encodeURIComponent(s.message || '');
    label = 'WhatsApp';
  } else if (s.email) {
    href = 'mailto:' + s.email;
    label = s.email;
  }
  if (!href) return;
  const ans = document.querySelector('[data-support-answer]');
  if (ans) {
    const ext = s.whatsapp ? ' target="_blank" rel="noopener"' : '';
    ans.innerHTML = `Fale com a gente ${s.whatsapp ? 'pelo' : 'pelo e-mail'} <a href="${esc(href)}"${ext}>${esc(label)}</a>. Respondemos o mais rápido possível.`;
  }
  const link = document.querySelector('[data-support-link]');
  if (link) {
    link.setAttribute('href', href);
    if (s.whatsapp) { link.target = '_blank'; link.rel = 'noopener'; }
    link.hidden = false;
  }
}

// ---------- Contador regressivo ----------
function fmtClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

function initCountdown() {
  const c = CONFIG.countdown;
  const wraps = document.querySelectorAll('[data-countdown-wrap]');
  const timers = document.querySelectorAll('[data-countdown]');
  if (!c.enabled) { wraps.forEach((w) => { w.hidden = true; }); return; }

  const span = Math.max(1, Number(c.minutes) || 15) * 60000;
  let deadline = NaN;
  const save = (v) => { try { localStorage.setItem(DEADLINE_KEY, String(v)); } catch (e) { /* só nesta visita */ } };
  try { deadline = parseInt(localStorage.getItem(DEADLINE_KEY), 10); } catch (e) { deadline = NaN; }
  if (!isFinite(deadline)) { deadline = Date.now() + span; save(deadline); }

  let iv = 0;
  const tick = () => {
    let left = deadline - Date.now();
    if (left <= 0) {
      if (c.onExpire === 'restart') {
        deadline = Date.now() + span;
        save(deadline);
        left = span;
      } else {
        wraps.forEach((w) => w.remove());
        stop();
        return;
      }
    }
    const txt = fmtClock(left);
    timers.forEach((t) => { t.textContent = txt; });
  };
  const start = () => { if (!iv) { tick(); iv = setInterval(tick, 1000); } };
  const stop = () => { clearInterval(iv); iv = 0; };
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  if (!document.hidden) start(); else tick();
}

// ---------- Revelar ao rolar ----------
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
}

// ---------- Barra fixa de compra (< 1024 px) ----------
function initStickyCTA() {
  const bar = document.getElementById('sticky-cta');
  const hero = document.getElementById('hero-cta');
  const offer = document.getElementById('oferta');
  if (!bar || !hero || !offer || !('IntersectionObserver' in window)) return;
  const btn = bar.querySelector('a, button');
  let heroPassed = false;
  let offerVisible = false;
  const update = () => {
    const show = heroPassed && !offerVisible;
    bar.classList.toggle('is-shown', show);
    bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (btn) btn.tabIndex = show ? 0 : -1;
  };
  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      // Só aparece depois que o botão do topo saiu da tela por cima.
      heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0;
    });
    update();
  }).observe(hero);
  new IntersectionObserver((entries) => {
    entries.forEach((e) => { offerVisible = e.isIntersecting; });
    update();
  }).observe(offer);
}

// ---------- FAQ (acordeão; vários itens podem ficar abertos) ----------
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');
    if (!btn || !panel) return;
    let timer = 0;
    btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      clearTimeout(timer);
      if (open) {
        panel.hidden = false;
        if (reduceMotion) { item.classList.add('is-open'); return; }
        requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add('is-open')));
      } else {
        item.classList.remove('is-open');
        if (reduceMotion) { panel.hidden = true; return; }
        timer = setTimeout(() => { panel.hidden = true; }, 320);
      }
    });
  });
}

// ---------- Contagem animada dos números ----------
function initCountUp() {
  const els = document.querySelectorAll('[data-countup]');
  if (reduceMotion || !('IntersectionObserver' in window) || !window.requestAnimationFrame) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target;
      const final = parseInt(el.textContent.replace(/\D/g, ''), 10);
      if (!isFinite(final) || final <= 0) return;
      const t0 = performance.now();
      const dur = 1200;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = fmtInt(final * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else el.textContent = fmtInt(final);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

// ---------- Indicadores do carrossel de telas (celular) ----------
function initDemoDots() {
  const track = document.querySelector('[data-demo-track]');
  const dots = document.querySelectorAll('[data-demo-dots] i');
  if (!track || !dots.length) return;
  let raf = 0;
  track.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const items = track.children;
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      for (let i = 0; i < items.length; i++) {
        const c = items[i].offsetLeft + items[i].offsetWidth / 2;
        if (Math.abs(c - mid) < dist) { dist = Math.abs(c - mid); best = i; }
      }
      dots.forEach((d, i) => d.classList.toggle('on', i === best));
    });
  }, { passive: true });
}

// ---------- Inicialização ----------
function init() {
  document.documentElement.classList.add('js');
  renderBonuses();
  renderValueStack();
  renderTestimonials();
  bindConfig(document);
  renderSupport();
  bindCTAs();
  initCountdown();
  initReveal();
  initStickyCTA();
  initFAQ();
  initCountUp();
  initDemoDots();
}

init();
