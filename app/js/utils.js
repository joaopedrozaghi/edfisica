// utils.js: helpers puros (números, datas, textos, aleatoriedade).
// Sem efeitos colaterais na importação (B4.3): nada de DOM ou listeners aqui.

// ---------------------------------------------------------------------
// Números
// ---------------------------------------------------------------------

// Decimais (peso, medidas, carga, sono, porção, altura em metros): "70,5" ou "70.5"
export function parseNum(str) {
  const s = String(str).trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

// Inteiros (idade, FC, reps, passos, metas de passos, kcal, ml, gramas, segundos, descanso, rodadas):
// aceita "8000" ou "8.000" (separador de milhar pt-BR)
export function parseIntBR(str) {
  const s = String(str).trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ''));
  return /^\d+$/.test(s) ? Number(s) : NaN;   // "8,5", "8.5" ou "1.50" → NaN (campo inteiro)
}

// Formatadores criados sob demanda (e reaproveitados).
let nf1 = null;
let nfInt = null;
let nfBRL = null;

/** 1 casa decimal no padrão pt-BR: 22.857 → "22,9". Só para exibição. */
export function fmt1(x) {
  if (!nf1) nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return nf1.format(x);
}

/** Inteiro com separador de milhar: 1780 → "1.780". Só para exibição. */
export function fmtInt(x) {
  if (!nfInt) nfInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  return nfInt.format(Math.round(x));
}

/** Moeda: 27.9 → "R$\u00A027,90" (mantém o espaço sem quebra U+00A0 do Intl). */
export function fmtBRL(x) {
  if (!nfBRL) nfBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  return nfBRL.format(x);
}

export function clamp(x, min, max) {
  return Math.min(max, Math.max(min, x));
}

// ---------------------------------------------------------------------
// Datas (chaves locais YYYY-MM-DD; NUNCA toISOString, que usa UTC)
// ---------------------------------------------------------------------

const pad2 = (n) => String(n).padStart(2, '0');

/** Chave local "YYYY-MM-DD" da data informada (padrão: agora). */
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Converte uma chave em Date local ao meio-dia (evita problemas de horário de verão).
function keyToDate(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Soma n dias (pode ser negativo) a uma chave de data. */
export function addDays(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** As 7 chaves da semana (segunda a domingo) que contém a data. */
export function weekKeys(key) {
  const d = keyToDate(key);
  const offset = (d.getDay() + 6) % 7; // 0 = segunda
  const monday = addDays(key, -offset);
  const out = [];
  for (let i = 0; i < 7; i++) out.push(addDays(monday, i));
  return out;
}

let dfWeekday = null;

/** Rótulo curto: "seg 12/05" (sem o ponto que o Intl coloca em "seg."). */
export function labelShort(key) {
  if (!dfWeekday) dfWeekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
  const d = keyToDate(key);
  const wd = dfWeekday.format(d).replace('.', '');
  return `${wd} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

/**
 * Valida o parâmetro ?d= (B4.3). Vazio/undefined → hoje.
 * Retorna a própria chave quando é uma data real, não futura e de até 60 dias atrás; senão null.
 */
export function parseDayParam(q, todayKey) {
  if (q === undefined || q === null || q === '') return todayKey;
  if (typeof q !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(q)) return null;
  const [y, m, d] = q.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null; // ex.: 30/02
  if (q > todayKey) return null;
  if (q < addDays(todayKey, -60)) return null;
  return q;
}

// ---------------------------------------------------------------------
// Aleatoriedade e ids
// ---------------------------------------------------------------------

/** Inteiro aleatório em [0, n) via crypto.getRandomValues. */
function randInt(n) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return Math.floor((buf[0] / 4294967296) * n);
}

let lastTs = 0;

/**
 * Id único: carimbo de tempo em base 36 + 6 caracteres aleatórios em base 36.
 * O carimbo nunca se repete nesta sessão (se dois ids caem no mesmo ms, o
 * segundo usa ms + 1) e tem tamanho fixo (8 caracteres até 2059), então
 * comparar ids como texto ordena pela ordem de criação.
 */
export function uid() {
  const ts = Math.max(Date.now(), lastTs + 1);
  lastTs = ts;
  let rnd = '';
  for (let i = 0; i < 6; i++) rnd += randInt(36).toString(36);
  return ts.toString(36) + rnd;
}

/** Fisher-Yates com crypto.getRandomValues. Retorna uma NOVA lista (não altera a original). */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

// ---------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------

/** Remove acentos, minúsculas e espaços nas pontas: "Feijão " → "feijao". */
export function normalize(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Id a partir do nome; descarta parênteses: "Chute glúteo (anfersen)" → "chute-gluteo". */
export function slugify(s) {
  return normalize(String(s).replace(/\s*\(.*?\)\s*/g, ' ')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Escapa & < > " ' para uso seguro em HTML.
 * Fica aqui (puro, testável) e é reexportado por ui.js junto com o html``.
 */
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------
// Funções
// ---------------------------------------------------------------------

/** Atrasa a execução até `ms` sem novas chamadas. */
export function debounce(fn, ms = 250) {
  let t = null;
  return function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}
