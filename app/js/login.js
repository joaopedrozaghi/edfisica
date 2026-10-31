// login.js: tela de entrar / criar conta.
// Renderizada por main.js quando não há usuário logado.
// Sem efeitos colaterais na importação.

import { CONFIG } from '../../config.js';
import { html, raw, esc } from './ui.js';
import { icon } from './icons.js';
import { signIn, signUp, hasAccounts, listAccounts, canHash } from './auth.js';

export function renderLogin(app) {
  if (!app) return;
  document.title = `Entrar · ${CONFIG.product.name}`;

  if (!canHash()) {
    app.innerHTML = html`
      <div class="auth">
        <div class="auth-hero">${raw(mark())}<h1 class="auth-title">Abra pelo link seguro</h1>
        <p class="auth-sub">Para entrar, abra o app pelo endereço que começa com https://</p></div>
      </div>`;
    return;
  }

  let mode = hasAccounts() ? 'login' : 'signup';
  const needCode = !!CONFIG.access.requireCode;

  app.innerHTML = html`
    <div class="auth">
      <div class="auth-hero">
        ${raw(mark())}
        <h1 class="auth-title" data-title tabindex="-1"></h1>
        <p class="auth-sub" data-sub></p>
      </div>

      <div class="auth-card">
        <div class="auth-tabs" role="tablist" aria-label="Entrar ou criar conta">
          <button type="button" role="tab" data-mode="login">Entrar</button>
          <button type="button" role="tab" data-mode="signup">Criar conta</button>
          <span class="auth-tabs-ind" aria-hidden="true"></span>
        </div>

        <div class="auth-accounts" data-accounts></div>

        <form class="auth-form" novalidate>
          <div class="auth-field" data-only="signup">
            <input id="au-name" name="name" type="text" autocomplete="given-name" placeholder=" " maxlength="40">
            <label for="au-name">Seu nome</label>
          </div>
          <div class="auth-field">
            <input id="au-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder=" ">
            <label for="au-email">E-mail</label>
          </div>
          <div class="auth-field auth-field--pw">
            <input id="au-password" name="password" type="password" autocomplete="current-password" placeholder=" ">
            <label for="au-password">Senha</label>
            <button type="button" class="auth-eye" data-eye aria-label="Mostrar senha">${raw(icon('eye', 20))}</button>
          </div>
          ${needCode ? raw(`
          <div class="auth-field" data-only="signup">
            <input id="au-code" name="code" type="text" autocomplete="off" autocapitalize="characters" placeholder=" ">
            <label for="au-code">Código da compra</label>
          </div>`) : ''}
          <p class="auth-error" data-error role="alert" hidden></p>
          <button type="submit" class="btn btn--primary auth-submit" data-submit><span data-submit-label></span></button>
        </form>
      </div>

      <p class="auth-foot">Sua conta e seu progresso ficam salvos neste aparelho.</p>
    </div>
  `;

  const $ = (sel) => app.querySelector(sel);
  const form = $('.auth-form');
  const errEl = $('[data-error]');
  const submit = $('[data-submit]');
  const pw = $('#au-password');

  function setMode(next) {
    mode = next;
    app.querySelector('.auth').dataset.mode = mode;
    app.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    app.querySelectorAll('[data-only]').forEach((el) => { el.hidden = el.dataset.only !== mode; });
    $('[data-title]').textContent = mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta';
    $('[data-sub]').textContent = mode === 'login'
      ? 'Entre para continuar de onde parou.'
      : needCode ? 'Use o código que chegou no e-mail da compra.' : 'Leva menos de um minuto.';
    $('[data-submit-label]').textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
    pw.setAttribute('autocomplete', mode === 'login' ? 'current-password' : 'new-password');
    renderAccounts();
    showError('');
  }

  function renderAccounts() {
    const box = $('[data-accounts]');
    const list = mode === 'login' ? listAccounts() : [];
    box.hidden = list.length === 0;
    box.innerHTML = list.map((a) => `
      <button type="button" class="auth-acc" data-email="${esc(a.email)}">
        <span class="auth-acc-av">${esc((a.name || '?').trim().charAt(0).toUpperCase())}</span>
        <span class="auth-acc-txt"><strong>${esc(a.name)}</strong><span>${esc(a.email)}</span></span>
      </button>`).join('');
    box.querySelectorAll('[data-email]').forEach((b) => b.addEventListener('click', () => {
      $('#au-email').value = b.dataset.email;
      box.querySelectorAll('.auth-acc').forEach((x) => x.classList.toggle('is-on', x === b));
      pw.focus();
    }));
  }

  function showError(msg, field) {
    errEl.textContent = msg;
    errEl.hidden = !msg;
    app.querySelectorAll('.auth-field').forEach((f) => f.classList.remove('is-bad'));
    if (field) {
      const input = form.querySelector(`[name="${field}"]`);
      input?.closest('.auth-field')?.classList.add('is-bad');
      input?.focus();
    }
    if (msg) {
      form.classList.remove('shake');
      void form.offsetWidth;
      form.classList.add('shake');
    }
  }

  app.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  $('[data-eye]').addEventListener('click', (e) => {
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    e.currentTarget.innerHTML = icon(show ? 'eyeOff' : 'eye', 20);
    e.currentTarget.setAttribute('aria-label', show ? 'Esconder senha' : 'Mostrar senha');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    const data = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    submit.classList.add('is-loading');
    try {
      const res = mode === 'login' ? await signIn(data) : await signUp(data, CONFIG.access);
      if (!res.ok) {
        showError(res.error, res.field);
        return;
      }
      app.querySelector('.auth').classList.add('is-done');
      setTimeout(() => {
        location.replace(location.pathname + '#/');
        location.reload();
      }, 280);
    } catch (err) {
      console.error('[login]', err);
      showError('Algo deu errado. Tente de novo.');
    } finally {
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }
  });

  setMode(mode);
}

function mark() {
  return `<div class="auth-mark" aria-hidden="true">
    <svg viewBox="0 0 48 48" width="44" height="44"><rect width="48" height="48" rx="14" fill="var(--accent-fill)"/>
    <path d="M27 9 15 27h8l-2 12 12-18h-8z" fill="var(--accent-ink)"/></svg>
    <span>${esc(CONFIG.product.shortName)}<b>PRO</b></span></div>`;
}
