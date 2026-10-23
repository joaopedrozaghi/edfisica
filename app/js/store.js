// store.js: persistência de baixo nível (B4.2).
// - Chaves com namespace "edf:v1:<nome>", uma por domínio.
// - Backend injetável (testes usam createMemoryBackend()); sem localStorage → memória.
// - Não importa nada de repo.js nem de ui.js: avisos para o usuário saem pelos
//   callbacks onWarn/onError (main.js liga em toasts) e a limpeza em caso de cota
//   cheia sai pelo handler de setQuotaHandler (repo.init registra repo.prune).
// Sem efeitos colaterais na importação.

export const PREFIX = 'edf:v1:';
export const BACKUP_PREFIX = 'edf:backup:';
export const SCHEMA = 1;

const PROBE_KEY = PREFIX + '__probe';
const MSG_NO_STORAGE = 'Seus dados não serão salvos neste navegador.';
const MSG_QUOTA = 'Armazenamento cheio. Exporte um backup e limpe dados antigos em Perfil.';

// Migrações futuras: migrations[n] leva os dados da versão n-1 para n.
// Recebe o store e não deve apagar dados. Versão 1 é a inicial.
const MIGRATIONS = {};

/** Backend em memória com a mesma interface do localStorage (getItem/setItem/removeItem/key/length). */
export function createMemoryBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: (k) => { map.delete(k); },
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
    clear: () => map.clear(),
  };
}

let backend = null;
let memoryMode = false;
let warnedMemory = false;
let quotaHandler = null;
let inQuotaHandler = false;
let onWarn = null;
let onError = null;
let subscribers = new Map(); // nome → Set<fn>
let storageListening = false;

const deepCopy = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

function isQuotaError(e) {
  return !!e && (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014
  );
}

function allKeys() {
  const out = [];
  try {
    for (let i = 0; i < backend.length; i++) {
      const k = backend.key(i);
      if (k !== null) out.push(k);
    }
  } catch (e) {
    console.warn('[store] falha ao listar chaves', e);
  }
  return out;
}

function notify(name, value) {
  const set = subscribers.get(name);
  if (!set) return;
  for (const fn of Array.from(set)) {
    try {
      fn(value === undefined ? null : deepCopy(value), name);
    } catch (e) {
      console.error('[store] erro em assinante de', name, e);
    }
  }
}

function probe(b) {
  b.setItem(PROBE_KEY, '1');
  if (b.getItem(PROBE_KEY) !== '1') throw new Error('probe');
  b.removeItem(PROBE_KEY);
}

function useMemory() {
  backend = createMemoryBackend();
  memoryMode = true;
  console.warn('[store] localStorage indisponível');
  if (!warnedMemory) {
    warnedMemory = true;
    if (onWarn) {
      try { onWarn(MSG_NO_STORAGE); } catch (e) { console.error(e); }
    }
  }
}

function listenStorageEvents() {
  if (storageListening || typeof window === 'undefined' || !window.addEventListener) return;
  storageListening = true;
  window.addEventListener('storage', (ev) => {
    if (!ev.key || ev.key.indexOf(PREFIX) !== 0) return;
    const name = ev.key.slice(PREFIX.length);
    let value = null;
    if (ev.newValue !== null) {
      try { value = JSON.parse(ev.newValue); } catch (e) { value = null; }
    }
    notify(name, value);
  });
}

function runMigrations() {
  const now = Date.now();
  const meta = get('meta', null);
  if (!meta || typeof meta !== 'object' || !Number.isInteger(meta.schema)) {
    set('meta', { schema: SCHEMA, createdAt: (meta && meta.createdAt) || now, lastOpen: now });
    return;
  }
  let schema = meta.schema;
  while (schema < SCHEMA) {
    const fn = MIGRATIONS[schema + 1];
    try {
      if (fn) fn(store);
      schema++;
    } catch (e) {
      // Falhou: não apaga nada e segue com os padrões.
      console.error('[store] migração falhou', schema + 1, e);
      break;
    }
  }
  set('meta', Object.assign({}, meta, { schema, lastOpen: now }));
}

/**
 * Inicializa o store.
 * @param {object} [opts]
 * @param {Storage} [opts.backend] backend com interface de Storage (padrão: localStorage)
 * @param {(msg:string)=>void} [opts.onWarn] aviso único "dados não serão salvos"
 * @param {(msg:string)=>void} [opts.onError] erro de armazenamento cheio
 */
function init({ backend: b, onWarn: w, onError: er } = {}) {
  if (w !== undefined) onWarn = w;
  if (er !== undefined) onError = er;
  subscribers = new Map();
  quotaHandler = null;
  memoryMode = false;
  let candidate = b;
  let isNative = false;
  if (!candidate) {
    try {
      candidate = window.localStorage;
      isNative = true;
    } catch (e) {
      candidate = null;
    }
  }
  try {
    if (!candidate) throw new Error('sem storage');
    probe(candidate);
    backend = candidate;
  } catch (e) {
    useMemory();
  }
  if (isNative && !memoryMode) listenStorageEvents();
  runMigrations();
}

/** Liga (ou troca) os callbacks de aviso/erro depois do init. */
function setNotifier({ onWarn: w, onError: er } = {}) {
  if (w !== undefined) onWarn = w;
  if (er !== undefined) onError = er;
}

/** Valor salvo (JSON) ou uma CÓPIA do fallback. JSON corrompido → backup + fallback. */
function get(name, fallback) {
  const key = PREFIX + name;
  let raw = null;
  try {
    raw = backend.getItem(key);
  } catch (e) {
    console.warn('[store] falha ao ler', name, e);
    return deepCopy(fallback);
  }
  if (raw === null || raw === undefined) return fallback === undefined ? null : deepCopy(fallback);
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[store] JSON inválido em', name, '- usando o padrão');
    try {
      if (backend.getItem(BACKUP_PREFIX + name) === null) backend.setItem(BACKUP_PREFIX + name, raw);
    } catch (e2) {
      console.warn('[store] não foi possível copiar o backup de', name);
    }
    return fallback === undefined ? null : deepCopy(fallback);
  }
}

/** Grava; em cota cheia chama o handler e tenta de novo uma vez. Retorna true/false. */
function set(name, value) {
  const key = PREFIX + name;
  const str = JSON.stringify(value);
  try {
    backend.setItem(key, str);
  } catch (e) {
    if (!isQuotaError(e)) {
      console.error('[store] falha ao gravar', name, e);
      return false;
    }
    if (quotaHandler && !inQuotaHandler) {
      inQuotaHandler = true;
      try { quotaHandler(); } catch (e2) { console.error('[store] handler de cota falhou', e2); }
      inQuotaHandler = false;
    }
    try {
      backend.setItem(key, str);
    } catch (e3) {
      console.error('[store] armazenamento cheio ao gravar', name, e3);
      if (onError && !inQuotaHandler) {
        try { onError(MSG_QUOTA); } catch (e4) { console.error(e4); }
      }
      return false;
    }
  }
  notify(name, value);
  return true;
}

function remove(name) {
  try {
    backend.removeItem(PREFIX + name);
  } catch (e) {
    console.warn('[store] falha ao remover', name, e);
  }
  notify(name, null);
}

/** Nomes (sem prefixo) de todas as chaves edf:v1:*. */
function keys() {
  return allKeys()
    .filter((k) => k.indexOf(PREFIX) === 0 && k !== PROBE_KEY)
    .map((k) => k.slice(PREFIX.length));
}

/** Assina mudanças de um nome (nesta aba e, com localStorage, em outras abas). Retorna o cancelamento. */
function subscribe(name, fn) {
  if (!subscribers.has(name)) subscribers.set(name, new Set());
  subscribers.get(name).add(fn);
  return () => {
    const s = subscribers.get(name);
    if (s) s.delete(fn);
  };
}

/** Remove só as chaves edf:v1:* (exceto os nomes em keep). Não notifica assinantes. */
function clearAll({ keep = [] } = {}) {
  for (const name of keys()) {
    if (keep.indexOf(name) !== -1) continue;
    try {
      backend.removeItem(PREFIX + name);
    } catch (e) {
      console.warn('[store] falha ao remover', name, e);
    }
  }
}

function setQuotaHandler(fn) {
  quotaHandler = typeof fn === 'function' ? fn : null;
}

/** true quando os dados estão só em memória (não serão salvos). */
function isMemory() {
  return memoryMode;
}

export const store = {
  init,
  setNotifier,
  get,
  set,
  remove,
  keys,
  subscribe,
  clearAll,
  setQuotaHandler,
  isMemory,
};

export default store;
