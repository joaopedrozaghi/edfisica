// main.js: boot sequence
// 1. sessão: sem usuário logado → tela de login (login.js)
// 2. store.init com o prefixo da conta + repo.init
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
import { currentUser, userPrefix } from './auth.js';
import { icon } from './icons.js';

const user = currentUser();

if (!user) {
  // Sem conta logada: só a tela de login (o resto do app nem inicia).
  import('./login.js').then((m) => m.renderLogin(document.getElementById('app')));
  document.documentElement.dataset.boot = 'login';
} else {
  store.init({
    prefix: userPrefix(user.id),
    onWarn: (msg) => toast(msg, { type: 'info', duration: 5000 }),
    onError: (msg) => toast(msg, { type: 'error', duration: 5000 }),
  });
  repo.init();

  // Conta nova: já começa com o nome usado no cadastro.
  const profile = repo.profile.get();
  if (!profile.name && user.name) repo.profile.update({ name: user.name.split(' ')[0] });

  renderShell();

  if (profile.onboarded !== true && location.hash !== '#/onboarding') {
    location.replace('#/onboarding');
  }

  router.start();
}

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
    { href: '#/mais', icon: 'grid', label: 'Mais', nav: 'mais' },
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
        { href: '#/simulado', icon: 'timer', label: 'Simulado', nav: 'estudos' },
        { href: '#/treino', icon: 'dumbbell', label: 'Treino', nav: 'treino' },
        { href: '#/dieta', icon: 'apple', label: 'Dieta', nav: 'dieta' },
      ],
    },
    {
      title: 'Saúde',
      items: [
        { href: '#/imc', icon: 'scale', label: 'IMC', nav: 'mais' },
        { href: '#/avaliacao', icon: 'ruler', label: 'Avaliação', nav: 'mais' },
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
        <svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true"><rect width="48" height="48" rx="13" fill="#1E3A8A"/><g fill="none" stroke="#BFDBFE" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 38V17h7l11-6.5"/><path d="M15 38h16M15 27.5h11"/><path d="M27.5 9.5l6 .7-1.7 5.8"/></g></svg> Educa<span class="wm-fit">Fit</span>
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

function renderIcon(name) {
  return icon(name, 22);
}
