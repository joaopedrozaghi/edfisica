// config.test.js: confere se /config.js está coerente (B3) e os helpers de acesso (B4.6).
// Cada falha traz uma dica em pt-BR do que corrigir no config.js.
import { test, assert, eq } from './harness.js';
import { CONFIG } from '../config.js';
import { normalizeCode, hashCode } from '../app/js/access.js';

// Os 8 módulos do app listados em A1 / FR-6…FR-13 do design.
const FEATURE_MODULES = 8;

test('config: objeto exportado e congelado', () => {
  assert(CONFIG && typeof CONFIG === 'object', 'config.js precisa exportar CONFIG');
  assert(Object.isFrozen(CONFIG), 'CONFIG precisa ser Object.freeze({...})');
});

test('config: price.current > 0', () => {
  assert(typeof CONFIG.price.current === 'number' && CONFIG.price.current > 0,
    'price.current precisa ser um número maior que zero (use ponto: 27.90)');
});

test('config: price.anchor é null ou número >= preço atual', () => {
  const a = CONFIG.price.anchor;
  assert(a === null || typeof a === 'number', "price.anchor precisa ser um número (ex.: 197.00) ou null");
  if (a === null) return; // sem preço "De": verificação ignorada
  assert(a >= CONFIG.price.current, "O preço 'De' (price.anchor) precisa ser maior ou igual ao preço atual");
});

test('config: produto + bônus = preço "De" (quando há âncora)', () => {
  if (CONFIG.price.anchor === null) return; // com anchor null a soma não é verificada
  const sum = CONFIG.mainProduct.value + CONFIG.bonuses.reduce((s, b) => s + b.value, 0);
  assert(Math.abs(sum - CONFIG.price.anchor) <= 0.01,
    `Soma dos bônus + produto ≠ preço 'De' (soma ${sum.toFixed(2)}, preço 'De' ${CONFIG.price.anchor})`);
});

test('config: garantia de pelo menos 7 dias', () => {
  const d = CONFIG.guarantee.days;
  assert(Number.isInteger(d) && d >= 7, 'A garantia deve ter pelo menos 7 dias (CDC art. 49)');
});

test('config: texto de parcelas coerente com o preço', () => {
  const m = /(\d+)x de R\$ ([\d.,]+)/.exec(CONFIG.price.installmentsText);
  assert(m, "price.installmentsText precisa seguir o formato 'ou 4x de R$ 7,57'");
  const n = Number(m[1]);
  const value = Number(m[2].replace(/\./g, '').replace(',', '.'));
  assert(Number.isFinite(value), "Valor da parcela ilegível em price.installmentsText (use '7,57')");
  assert(n * value >= CONFIG.price.current - 0.01, 'Texto de parcelas desatualizado em relação ao preço');
});

test('config: countdown.onExpire válido', () => {
  assert(['hide', 'restart'].indexOf(CONFIG.countdown.onExpire) !== -1,
    "countdown.onExpire precisa ser 'hide' ou 'restart'");
});

test('config: WhatsApp vazio ou só dígitos com DDI+DDD', () => {
  const w = CONFIG.support.whatsapp;
  assert(w === '' || /^\d{12,13}$/.test(w),
    "support.whatsapp precisa ficar vazio ou ter só dígitos com DDI+DDD (ex.: '5511999999999')");
});

test('config: codeHashes em SHA-256 hex minúsculo', () => {
  assert(Array.isArray(CONFIG.access.codeHashes), 'access.codeHashes precisa ser uma lista');
  for (const h of CONFIG.access.codeHashes) {
    assert(/^[0-9a-f]{64}$/.test(h),
      `Hash inválido em access.codeHashes: "${h}". Gere com o comando do README (64 caracteres 0-9a-f)`);
  }
});

test('config: site.showDemoLink é booleano', () => {
  assert(typeof CONFIG.site.showDemoLink === 'boolean', 'site.showDemoLink precisa ser true ou false');
});

test('config: contentStats.modules <= módulos reais', () => {
  const v = CONFIG.contentStats.modules;
  assert(typeof v === 'number' && v <= FEATURE_MODULES,
    `contentStats.modules (${v}) é maior que o número real de módulos (${FEATURE_MODULES})`);
});

test('config: depoimentos de exemplo marcados e sem nome', () => {
  for (const t of CONFIG.testimonials.items) {
    if (t.example === true) assert(!t.name, 'Depoimentos de exemplo não podem ter nome');
  }
});

test('access: normalizeCode tira espaços e põe em maiúsculas', () => {
  eq(normalizeCode(' edf2024 '), 'EDF2024');
});

test('access: hashCode do código normalizado = hash do código em maiúsculas', async () => {
  const a = await hashCode(normalizeCode(' edf2024 '));
  const b = await hashCode('EDF2024');
  eq(a, b);
  assert(/^[0-9a-f]{64}$/.test(a), 'hashCode precisa retornar 64 caracteres hex minúsculos');
  eq(await hashCode('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
