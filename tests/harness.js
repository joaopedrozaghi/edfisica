// harness.js: mini executor de testes no navegador (B11.1).
// Os arquivos *.test.js registram testes com test(); run() importa cada arquivo,
// executa todos em sequência (com suporte a async) e só então escreve a linha final
// "ALL TESTS PASSED (n)" ou "FAILED: k of n" em <pre id="out"> e
// document.body.dataset.result = 'pass' | 'fail'. Até lá a página mostra "RUNNING".

const registry = [];
let currentFile = '';

/** Registra um teste (fn pode ser async). */
export function test(name, fn) {
  registry.push({ file: currentFile, name, fn });
}

/** Falha com msg quando cond é falso. */
export function assert(cond, msg = 'asserção falhou') {
  if (!cond) throw new Error(msg);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (!deepEqual(ka, kb)) return false;
  for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
  return true;
}

function show(x) {
  if (typeof x === 'string') return JSON.stringify(x);
  if (typeof x === 'number' && Number.isNaN(x)) return 'NaN';
  try {
    return JSON.stringify(x);
  } catch (e) {
    return String(x);
  }
}

/** Igualdade profunda (NaN é igual a NaN). */
export function eq(a, b, msg) {
  if (!deepEqual(a, b)) throw new Error(`${msg ? msg + ': ' : ''}esperado ${show(b)}, obtido ${show(a)}`);
}

/** |a − b| <= tol. */
export function close(a, b, tol = 0.05, msg) {
  if (typeof a !== 'number' || !(Math.abs(a - b) <= tol)) {
    throw new Error(`${msg ? msg + ': ' : ''}esperado ${b} ± ${tol}, obtido ${show(a)}`);
  }
}

/** fn precisa lançar (opcionalmente uma instância de ErrorType). Retorna o erro. */
export function throws(fn, ErrorType, msg) {
  let err = null;
  try {
    fn();
  } catch (e) {
    err = e;
  }
  if (!err) throw new Error(msg || 'esperava um erro, mas nada foi lançado');
  if (ErrorType && !(err instanceof ErrorType)) {
    throw new Error(msg || `esperava ${ErrorType.name}, obtido ${err && err.name}`);
  }
  return err;
}

/**
 * Importa cada arquivo com load(file) (falha de import conta como falha:
 * "FAILED: import <file>"), roda todos os testes em sequência e escreve o resultado.
 */
export async function run(files, load) {
  const out = document.getElementById('out');
  const lines = [];
  let failed = 0;
  let total = 0;

  for (const file of files) {
    currentFile = file;
    try {
      await load(file);
    } catch (e) {
      total++;
      failed++;
      lines.push(`FAILED: import ${file} - ${e && e.message ? e.message : e}`);
    }
  }
  currentFile = '';

  for (const t of registry) {
    total++;
    try {
      await t.fn();
      lines.push(`ok   ${t.file} › ${t.name}`);
    } catch (e) {
      failed++;
      lines.push(`FAIL ${t.file} › ${t.name}\n     ${e && e.message ? e.message : e}`);
    }
  }

  lines.push(failed === 0 ? `ALL TESTS PASSED (${total})` : `FAILED: ${failed} of ${total}`);
  out.textContent = lines.join('\n');
  document.body.dataset.result = failed === 0 ? 'pass' : 'fail';
}
