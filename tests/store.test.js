// store.test.js: persistência com backend em memória (B4.2, B11.1).
import { test, assert, eq } from './harness.js';
import { store, createMemoryBackend, SCHEMA } from '../app/js/store.js';

function fresh() {
  const b = createMemoryBackend();
  store.init({ backend: b, onWarn: null, onError: null });
  return b;
}

function quotaError() {
  return new DOMException('cheio', 'QuotaExceededError');
}

/** Backend que lança QuotaExceededError nas `fails` primeiras gravações da chave alvo. */
function quotaBackend(targetKey, fails) {
  const b = createMemoryBackend();
  let left = fails;
  const setItem = b.setItem;
  b.setItem = (k, v) => {
    if (k === targetKey && left > 0) {
      left--;
      throw quotaError();
    }
    setItem(k, v);
  };
  return b;
}

test('get/set ida e volta', () => {
  fresh();
  eq(store.set('profile', { name: 'Ana', age: 30 }), true);
  eq(store.get('profile', null), { name: 'Ana', age: 30 });
  eq(store.get('nada', null), null);
  eq(store.get('nada'), null);
});

test('fallback é cópia profunda', () => {
  fresh();
  const fb = { list: [1, 2], nested: { a: 1 } };
  const v = store.get('x', fb);
  v.list.push(3);
  v.nested.a = 99;
  eq(fb, { list: [1, 2], nested: { a: 1 } });
  const v2 = store.get('x', fb);
  eq(v2, { list: [1, 2], nested: { a: 1 } });
});

test('leituras devolvem cópias novas', () => {
  fresh();
  store.set('favs', { foods: ['a'] });
  const v = store.get('favs', null);
  v.foods.push('b');
  eq(store.get('favs', null), { foods: ['a'] });
});

test('JSON corrompido → fallback + chave de backup', () => {
  const b = fresh();
  b.setItem('edf:v1:profile', '{quebrado');
  const v = store.get('profile', { ok: true });
  eq(v, { ok: true });
  eq(b.getItem('edf:backup:profile'), '{quebrado');
  // o backup é copiado só uma vez
  b.setItem('edf:v1:profile', '{outro');
  store.get('profile', null);
  eq(b.getItem('edf:backup:profile'), '{quebrado');
});

test('cota cheia: handler chamado uma vez e gravação repetida', () => {
  const b = quotaBackend('edf:v1:diet', 1);
  store.init({ backend: b, onWarn: null, onError: null });
  let calls = 0;
  store.setQuotaHandler(() => { calls++; });
  eq(store.set('diet', { days: {} }), true);
  eq(calls, 1);
  eq(store.get('diet', null), { days: {} });
});

test('cota cheia: handler que não libera nada → set retorna false e avisa', () => {
  const b = quotaBackend('edf:v1:diet', 99);
  let errMsg = null;
  store.init({ backend: b, onWarn: null, onError: (m) => { errMsg = m; } });
  let calls = 0;
  store.setQuotaHandler(() => { calls++; });
  eq(store.set('diet', { days: {} }), false);
  eq(calls, 1);
  eq(errMsg, 'Armazenamento cheio. Exporte um backup e limpe dados antigos em Perfil.');
  eq(store.get('diet', null), null);
  store.setNotifier({ onError: null });
});

test('cota cheia sem handler: tenta de novo uma vez', () => {
  const b = quotaBackend('edf:v1:diet', 1);
  store.init({ backend: b, onWarn: null, onError: null });
  eq(store.set('diet', { a: 1 }), true);
});

test('clearAll() remove só edf:v1:*', () => {
  const b = fresh();
  store.set('profile', { a: 1 });
  store.set('access', 'ok');
  b.setItem('edf:sales:deadline', '123');
  b.setItem('edf:backup:profile', 'x');
  b.setItem('outra:chave', 'y');
  store.clearAll();
  eq(store.keys(), []);
  eq(b.getItem('edf:sales:deadline'), '123');
  eq(b.getItem('edf:backup:profile'), 'x');
  eq(b.getItem('outra:chave'), 'y');
});

test("clearAll({keep:['access']}) preserva edf:v1:access", () => {
  const b = fresh();
  store.set('profile', { a: 1 });
  store.set('access', 'ok');
  store.clearAll({ keep: ['access'] });
  eq(store.keys(), ['access']);
  eq(b.getItem('edf:v1:access'), '"ok"');
});

test('keys() lista nomes sem prefixo', () => {
  fresh();
  store.set('body', []);
  store.set('habits', {});
  const k = store.keys().sort();
  eq(k, ['body', 'habits', 'meta']);
});

test('migração inicial grava meta.schema', () => {
  fresh();
  const meta = store.get('meta', null);
  eq(meta.schema, SCHEMA);
  eq(SCHEMA, 1);
  assert(typeof meta.createdAt === 'number' && typeof meta.lastOpen === 'number', 'meta sem datas');
});

test('backend indisponível → memória + aviso único', () => {
  const broken = {
    getItem() { throw new Error('bloqueado'); },
    setItem() { throw new Error('bloqueado'); },
    removeItem() { throw new Error('bloqueado'); },
    key() { return null; },
    length: 0,
  };
  const warns = [];
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    store.init({ backend: broken, onWarn: (m) => warns.push(m), onError: null });
    eq(store.isMemory(), true);
    eq(store.set('profile', { a: 1 }), true);
    eq(store.get('profile', null), { a: 1 });
    store.init({ backend: broken });
  } finally {
    console.warn = origWarn;
    store.setNotifier({ onWarn: null });
  }
  eq(warns, ['Seus dados não serão salvos neste navegador.']);
});

test('subscribe recebe gravações e remoções da mesma aba', () => {
  fresh();
  const seen = [];
  const off = store.subscribe('profile', (v) => seen.push(v));
  store.set('profile', { a: 1 });
  store.remove('profile');
  off();
  store.set('profile', { a: 2 });
  eq(seen, [{ a: 1 }, null]);
});
