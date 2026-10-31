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

function renderIncluded() {
  const ul = document.querySelector('[data-render="included"]');
  if (!ul) return;
  const hasAnchor = derived.anchorBRL !== null;
  const items = [{ title: CONFIG.mainProduct.title, desc: 'Estudos, treinos, dieta, IMC, avaliação física e progresso.', value: CONFIG.mainProduct.value }]
    .concat(CONFIG.bonuses.map((b) => ({ title: b.title, value: b.value, bonus: true })));
  replaceWith(ul, items.map((it, i) => `
    <li>
      <span class="incl-n">${i === 0 ? '★' : i}</span>
      <span class="incl-t"><strong>${esc(it.title)}</strong>${it.desc ? `<span>${esc(it.desc)}</span>` : ""}</span>
      <span class="incl-v">${hasAnchor ? `<s>${esc(fmtBRL(it.value))}</s>` : (it.bonus ? 'Bônus' : 'Incluso')}</span>
    </li>`).join(''));
}

function renderTestimonials() {
  // Só depoimentos reais (example:false). Os de exemplo nunca aparecem no site.
  const t = CONFIG.testimonials;
  const section = document.getElementById('depoimentos');
  if (!section) return;
  const real = (t.items || []).filter((it) => !it.example);
  if (!t.enabled || !real.length) { section.hidden = true; return; }
  section.hidden = false;
  replaceWith(section.querySelector('[data-render="testimonials"]'), real.map((it) => {
    const who = [it.name ? `<strong>${esc(it.name)}</strong>` : '', esc(it.role || ''), esc(it.city || '')].filter(Boolean).join(' · ');
    return `<figure class="quote"><blockquote>“${esc(it.text)}”</blockquote><figcaption>${who}</figcaption></figure>`;
  }).join(''));
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

// ---------- Entrada suave ao rolar ----------
function initReveal() {
  const els = document.querySelectorAll('.nums, .block, .foot');
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach((el) => { el.classList.add('rise'); io.observe(el); });
}

// ---------- Topo com linha ao rolar ----------
function initTopBar() {
  const top = document.querySelector('.top');
  if (!top) return;
  const on = () => top.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', on, { passive: true });
  on();
}

// ---------- Barra fixa de compra ----------
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
    entries.forEach((e) => { heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0; });
    update();
  }).observe(hero);
  new IntersectionObserver((entries) => {
    entries.forEach((e) => { offerVisible = e.isIntersecting; });
    update();
  }, { threshold: 0.2 }).observe(offer);
}

// ---------- Dúvidas: abre uma por vez ----------
function initFAQ() {
  const items = document.querySelectorAll('.faq details');
  items.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) items.forEach((o) => { if (o !== d) o.open = false; });
  }));
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
      const dur = 1000;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = fmtInt(final * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else el.textContent = fmtInt(final);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
}

// ---------- Vitrine: abas, arrastar no celular, flashcard e timer ----------
const CAPTIONS = [
  () => `${fmtInt(CONFIG.contentStats.subjects)} matérias com resumos, flashcards e questões comentadas. Toque no cartão.`,
  () => 'O app conta o tempo, avisa a troca e mostra o próximo exercício.',
  () => `Monte o dia com ${fmtInt(CONFIG.contentStats.foods)}+ alimentos brasileiros e veja calorias e macros.`,
  () => 'IMC, % de gordura, frequência cardíaca e seu histórico de peso.',
];

function initShowcase() {
  const root = document.querySelector('[data-show]');
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll('[data-tab]'));
  const track = root.querySelector('[data-screens]');
  const ind = root.querySelector('.show-ind');
  const cap = root.querySelector('[data-cap]');
  const phone = root.querySelector('[data-phone]');
  const panels = Array.from(track.children);
  let idx = 0;
  let auto = 0;
  let touched = false;

  const stopAuto = () => { touched = true; clearInterval(auto); auto = 0; };
  const go = (i, fromUser) => {
    idx = (i + tabs.length) % tabs.length;
    track.style.transform = `translateX(${-idx * 100}%)`;
    ind.style.transform = `translateX(${idx * 100}%)`;
    tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === idx));
      t.tabIndex = n === idx ? 0 : -1;
    });
    panels.forEach((p, n) => p.setAttribute('aria-hidden', String(n !== idx)));
    if (cap) {
      cap.classList.add('is-out');
      setTimeout(() => { cap.textContent = CAPTIONS[idx](); cap.classList.remove('is-out'); }, 160);
    }
    if (fromUser) stopAuto();
  };
  const startAuto = () => {
    if (reduceMotion || touched || auto) return;
    auto = setInterval(() => go(idx + 1), 5000);
  };

  tabs.forEach((t, n) => t.addEventListener('click', () => go(n, true)));
  root.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    go(idx + (e.key === 'ArrowRight' ? 1 : -1), true);
    tabs[idx].focus();
  });

  // Arrastar para o lado no celular
  let x0 = null;
  let y0 = 0;
  phone.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; stopAuto(); }, { passive: true });
phone.addEventListener('pointerdown', stopAuto);
  phone.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1), true);
  }, { passive: true });

  // Flashcard vira ao tocar
  root.querySelector('[data-flip]')?.addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('is-flipped');
    stopAuto();
  });

  // Timer do player conta de verdade (30 s em loop)
  const clock = root.querySelector('[data-clock]');
  const ring = root.querySelector('[data-ring]');
  if (clock && ring && !reduceMotion) {
    const C = 326.7;
    let left = 30;
    setInterval(() => {
      if (document.hidden) return;
      left = left <= 0 ? 30 : left - 1;
      clock.textContent = `0:${String(left).padStart(2, '0')}`;
      ring.style.strokeDashoffset = String(C * (1 - left / 30));
    }, 1000);
  }

  // Só anda sozinho enquanto a vitrine está na tela
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) startAuto(); else { clearInterval(auto); auto = 0; } });
    }, { threshold: 0.5 }).observe(phone);
  }
  go(0);
}

// ---------- Inicialização ----------
function init() {
  document.documentElement.classList.add('js');
  renderIncluded();
  renderTestimonials();
  bindConfig(document);
  renderSupport();
  bindCTAs();
  initCountdown();
  initShowcase();
  initReveal();
  initTopBar();
  initStickyCTA();
  initFAQ();
  initCountUp();
}

init();
