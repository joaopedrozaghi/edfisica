// auth.js: contas locais (login + senha por usuário).
// - As contas ficam neste aparelho (localStorage). Não há servidor.
// - A senha nunca é guardada: só um hash PBKDF2-SHA256 com sal aleatório.
// - Cada conta tem seus próprios dados (prefixo de chaves no store).
// - Se config.access.requireCode estiver ligado, criar conta pede o código da compra.
// Sem efeitos colaterais na importação.

import { normalizeCode, hashCode } from './access.js';

const USERS_KEY = 'edf:auth:users';
const SESSION_KEY = 'edf:auth:session';
const LEGACY_PREFIX = 'edf:v1:';
const ITERATIONS = 120000;

/** Prefixo das chaves de dados de uma conta. */
export function userPrefix(id) {
  return 'edf:u:' + id + ':';
}

function ls() {
  try { return window.localStorage; } catch (e) { return null; }
}

function readUsers() {
  const s = ls();
  if (!s) return [];
  try {
    const list = JSON.parse(s.getItem(USERS_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function writeUsers(list) {
  ls()?.setItem(USERS_KEY, JSON.stringify(list));
}

export function normalizeEmail(s) {
  return String(s || '').trim().toLowerCase();
}

export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(s));
}

export function canHash() {
  return !!(window.crypto && window.crypto.subtle);
}

const toHex = (buf) => Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)));

async function derive(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: ITERATIONS },
    key,
    256
  );
  return toHex(bits);
}

/** Usuário logado ({ id, name, email }) ou null. */
export function currentUser() {
  const s = ls();
  if (!s) return null;
  let session = null;
  try { session = JSON.parse(s.getItem(SESSION_KEY) || 'null'); } catch (e) { session = null; }
  if (!session || !session.id) return null;
  const u = readUsers().find((x) => x.id === session.id);
  return u ? { id: u.id, name: u.name, email: u.email } : null;
}

export function hasAccounts() {
  return readUsers().length > 0;
}

/** Contas deste aparelho (só nome e e-mail), para o atalho da tela de login. */
export function listAccounts() {
  return readUsers().map((u) => ({ name: u.name, email: u.email }));
}

function startSession(id) {
  ls()?.setItem(SESSION_KEY, JSON.stringify({ id, at: Date.now() }));
}

export function signOut() {
  ls()?.removeItem(SESSION_KEY);
}

/** Primeira conta criada herda os dados que já existiam no aparelho (versão sem login). */
function adoptLegacyData(id) {
  const s = ls();
  if (!s) return;
  const target = userPrefix(id);
  const legacy = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k && k.indexOf(LEGACY_PREFIX) === 0 && k !== LEGACY_PREFIX + 'access' && k !== LEGACY_PREFIX + '__probe') legacy.push(k);
  }
  for (const k of legacy) {
    try {
      s.setItem(target + k.slice(LEGACY_PREFIX.length), s.getItem(k));
      s.removeItem(k);
    } catch (e) {
      console.warn('[auth] não foi possível mover', k, e);
    }
  }
}

/**
 * Cria a conta e já entra.
 * @returns {Promise<{ok:true,user}|{ok:false,field,error}>}
 */
export async function signUp({ name, email, password, code }, accessCfg = {}) {
  const cleanName = String(name || '').trim();
  const cleanEmail = normalizeEmail(email);
  if (!cleanName) return { ok: false, field: 'name', error: 'Como podemos te chamar?' };
  if (!isValidEmail(cleanEmail)) return { ok: false, field: 'email', error: 'Confira o e-mail.' };
  if (String(password || '').length < 6) return { ok: false, field: 'password', error: 'Use pelo menos 6 caracteres.' };

  if (accessCfg.requireCode) {
    const hash = await hashCode(normalizeCode(code || ''));
    if (!normalizeCode(code || '') || !(accessCfg.codeHashes || []).includes(hash)) {
      return { ok: false, field: 'code', error: 'Código inválido. Ele está no e-mail da sua compra.' };
    }
  }

  const users = readUsers();
  if (users.some((u) => u.email === cleanEmail)) {
    return { ok: false, field: 'email', error: 'Já existe uma conta com esse e-mail. Entre com sua senha.' };
  }

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await derive(password, salt);
  const id = toHex(crypto.getRandomValues(new Uint8Array(6)));
  const first = users.length === 0;
  users.push({ id, name: cleanName, email: cleanEmail, salt, hash, createdAt: Date.now() });
  writeUsers(users);
  if (first) adoptLegacyData(id);
  startSession(id);
  return { ok: true, user: { id, name: cleanName, email: cleanEmail } };
}

/** @returns {Promise<{ok:true,user}|{ok:false,field,error}>} */
export async function signIn({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  const u = readUsers().find((x) => x.email === cleanEmail);
  if (!u) return { ok: false, field: 'email', error: 'Não achamos uma conta com esse e-mail neste aparelho.' };
  const hash = await derive(String(password || ''), u.salt);
  if (hash !== u.hash) return { ok: false, field: 'password', error: 'Senha incorreta.' };
  startSession(u.id);
  return { ok: true, user: { id: u.id, name: u.name, email: u.email } };
}
