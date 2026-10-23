// main.js: boot sequence (B4.1)
// 1. store.init + repo.init
// 2. access gate (se requireCode)
// 3. render shell (nav + view)
// 4. onboarding redirect
// 5. router.start
// 6. SW register
// 7. global error handlers

import { CONFIG } from '../../config.js';
import { store } from './store.js';
import { repo } from './repo.js';
import * as router from './router.js';
import { toast, html, raw } from './ui.js';

// ---------------------------------------------------------------------
// 1. Init storage + repo
// ---------------------------------------------------------------------

store.init({
  onWarn: (msg) => toast(msg, { type: 'info', duration: 5000 }),
  onError: (msg) => toast(msg, { type: 'error', duration: 5000 }),
});

repo.init();

// ---------------------------------------------------------------------
// 2. Access gate (B4.6)
// ---------------------------------------------------------------------

if (CONFIG.access.requireCode) {
  const unlocked = store.get('access', null);
  if (unlocked !== 'ok') {
    renderGate();
    document.documentElement.dataset.boot = 'gate';
    throw new Error('[main] access gate ativo, boot interrompido');
  }
}

// ---------------------------------------------------------------------
// 3. Render shell (nav + #view)
// ---------------------------------------------------------------------

renderShell();

// ---------------------------------------------------------------------
// 4. Onboarding redirect (B4.1 step 6)
// ---------------------------------------------------------------------

const profile = repo.profile.get();
if (profile.onboarded !== true && location.hash !== '#/onboarding') {
  location.replace('#/onboarding');
}

// ---------------------------------------------------------------------
// 5. Router start
// ---------------------------------------------------------------------

router.start();

// ---------------------------------------------------------------------
// 6. Service Worker (B4.1)
// ---------------------------------------------------------------------

if ('serviceWorker' in navigator) {
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (isSecure) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.info('[sw] registrado', reg.scope);
      
      // Update toast
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Nova versão disponível', {
              type: 'info',
              action: {
                label: 'Atualizar',
                fn: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                },
              },
              duration: 10000,
            });
          }
        });
      });
    }).catch((err) => {
      console.warn('[sw] falha ao registrar', err);
    });
    
    // Reload on controllerchange
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      location.reload();
    });
  }
}

// ---------------------------------------------------------------------
// 7. beforeinstallprompt (B4.1)
// ---------------------------------------------------------------------

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Também expõe no window para telas que são renderizadas depois do evento
  // (evita problemas de ordem de carregamento / import circular).
  window.__edfInstallPrompt = e;
  console.info('[install] prompt capturado');
  // Notifica telas abertas (ex.: Perfil/Início) para mostrarem o botão.
  window.dispatchEvent(new CustomEvent('edf-installable'));
});

// Depois de instalado, limpa o prompt para o botão sumir.
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  window.__edfInstallPrompt = null;
  console.info('[install] app instalado');
});

export function getInstallPrompt() {
  return deferredPrompt || window.__edfInstallPrompt || null;
}

// ---------------------------------------------------------------------
// 8. Global error handlers (B8.3)
// ---------------------------------------------------------------------

let lastErrorToast = 0;

window.addEventListener('error', (e) => {
  console.error('[global error]', e.error || e.message);
  showThrottledErrorToast();
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandled rejection]', e.reason);
  showThrottledErrorToast();
});

function showThrottledErrorToast() {
  const now = Date.now();
  if (now - lastErrorToast > 10000) {
    toast('Algo deu errado. Tente novamente.', { type: 'error' });
    lastErrorToast = now;
  }
}

// ---------------------------------------------------------------------
// Shell rendering (B4.1, B6.0)
// ---------------------------------------------------------------------

function renderShell() {
  const app = document.getElementById('app');
  if (!app) {
    console.error('[main] #app não encontrado');
    return;
  }
  
  const navItems = [
    { href: '#/', icon: 'home', label: 'Início', nav: 'inicio' },
    { href: '#/estudos', icon: 'book', label: 'Estudos', nav: 'estudos' },
    { href: '#/treino', icon: 'dumbbell', label: 'Treino', nav: 'treino' },
    { href: '#/dieta', icon: 'apple', label: 'Dieta', nav: 'dieta' },
    { href: '#/mais', icon: 'menu', label: 'Mais', nav: 'mais' },
  ];
  
  const bottomNavHtml = html`
    <nav class="bottom-nav">
      ${raw(navItems.map(item => `
        <a href="${item.href}" data-nav="${item.nav}">
          ${renderIcon(item.icon)}
          <span>${item.label}</span>
        </a>
      `).join(''))}
    </nav>
  `;
  
  const sidebarGroups = [
    {
      title: 'Principal',
      items: [
        { href: '#/', icon: 'home', label: 'Início', nav: 'inicio' },
        { href: '#/estudos', icon: 'book', label: 'Estudos', nav: 'estudos' },
        { href: '#/simulado', icon: 'clipboard', label: 'Simulado', nav: 'estudos' },
        { href: '#/treino', icon: 'dumbbell', label: 'Treino', nav: 'treino' },
        { href: '#/dieta', icon: 'apple', label: 'Dieta', nav: 'dieta' },
      ],
    },
    {
      title: 'Saúde',
      items: [
        { href: '#/imc', icon: 'activity', label: 'IMC', nav: 'mais' },
        { href: '#/avaliacao', icon: 'clipboard', label: 'Avaliação', nav: 'mais' },
      ],
    },
    {
      title: 'Você',
      items: [
        { href: '#/progresso', icon: 'chart', label: 'Progresso', nav: 'mais' },
        { href: '#/perfil', icon: 'user', label: 'Perfil', nav: 'mais' },
      ],
    },
  ];
  
  const sidebarHtml = html`
    <aside class="sidebar">
      <a href="#/" class="sidebar-logo">
        EdFísica <span class="sidebar-logo-badge">PRO</span>
      </a>
      ${raw(sidebarGroups.map(group => `
        <div class="sidebar-section">
          <div class="sidebar-section-title">${group.title}</div>
          ${group.items.map(item => `
            <a href="${item.href}" data-nav="${item.nav}">
              ${renderIcon(item.icon)}
              <span>${item.label}</span>
            </a>
          `).join('')}
        </div>
      `).join(''))}
    </aside>
  `;
  
  app.innerHTML = html`
    <div class="app-shell">
      ${raw(sidebarHtml)}
      <main id="view"></main>
      ${raw(bottomNavHtml)}
    </div>
  `;
  
  document.documentElement.dataset.boot = 'ok';
}

// ---------------------------------------------------------------------
// Access gate rendering (B4.6)
// ---------------------------------------------------------------------

async function renderGate() {
  // Lazy import para não carregar crypto.subtle se o gate estiver desabilitado
  const { normalizeCode, hashCode } = await import('./access.js');
  
  const app = document.getElementById('app');
  if (!app) return;
  
  // Verifica se crypto.subtle está disponível (https, localhost, 127.0.0.1)
  if (!window.crypto?.subtle) {
    app.innerHTML = html`
      <div class="empty">
        <div class="empty-emoji">🔒</div>
        <h1 class="empty-title" tabindex="-1">Acesso restrito</h1>
        <p class="empty-text">Abra o app pelo endereço https:// para acessar com seu código.</p>
      </div>
    `;
    return;
  }
  
  app.innerHTML = html`
    <div class="empty">
      <div class="empty-emoji">🔒</div>
      <h1 class="empty-title" tabindex="-1">Digite seu código de acesso</h1>
      <form class="gate-form" style="width:100%;max-width:400px;margin-top:2rem">
        <div class="field">
          <label for="gate-code">Código</label>
          <input type="text" id="gate-code" autocomplete="off" required style="text-align:center;text-transform:uppercase">
          <p class="field-hint">Você recebeu este código no e-mail da sua compra.</p>
        </div>
        <button type="submit" class="btn btn--primary" style="width:100%">Entrar</button>
      </form>
    </div>
  `;
  
  const form = app.querySelector('.gate-form');
  const input = app.querySelector('#gate-code');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = input?.value || '';
    const normalized = normalizeCode(code);
    
    if (!normalized) {
      input?.focus();
      return;
    }
    
    try {
      const hash = await hashCode(normalized);
      const valid = CONFIG.access.codeHashes.includes(hash);
      
      if (valid) {
        store.set('access', 'ok');
        location.reload(); // Reinicia o boot sem o gate
      } else {
        // Campo error
        const errP = document.createElement('p');
        errP.className = 'field-error';
        errP.textContent = 'Código inválido. Confira o e-mail da sua compra.';
        input?.parentElement?.appendChild(errP);
        input?.focus();
      }
    } catch (err) {
      console.error('[gate] hash error', err);
      toast('Erro ao verificar o código. Tente novamente.', { type: 'error' });
    }
  });
  
  input?.focus();
}

// ---------------------------------------------------------------------
// Icon helper (inline SVG, B6.0)
// ---------------------------------------------------------------------

function renderIcon(name) {
  const icons = {
    home: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
    book: '<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>',
    dumbbell: '<path d="M17.5 4.5c-1.5-1.5-4-1.5-5.5 0s-1.5 4 0 5.5 4 1.5 5.5 0 1.5-4 0-5.5m-11 11c-1.5-1.5-1.5-4 0-5.5s4-1.5 5.5 0 1.5 4 0 5.5-4 1.5-5.5 0m4-9.5l5 5m-5 0l5-5"/>',
    apple: '<path d="M12 3v1m-6.364 1.636l.707.707M3 12h1m1.636 6.364l.707-.707M12 21v-1m6.364-1.636l-.707-.707M21 12h-1m-1.636-6.364l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    clipboard: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>',
    activity: '<path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>',
    whistle: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
    chart: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>',
    user: '<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>',
  };
  
  const path = icons[name] || '';
  return `<svg viewBox="0 0 24 24">${path}</svg>`;
}
