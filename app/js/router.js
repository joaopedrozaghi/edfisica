// router.js: hash router + view lifecycle (B4.5)
// Exported: matchRoute (pura, testável), parseQuery, start(), destroy-before-render

import { CONFIG } from '../../config.js';
import { importErrorState } from './ui.js';

// ---------------------------------------------------------------------
// Route table (literal import() specifiers, B4.5, B11.1)
// ---------------------------------------------------------------------

const ROUTES = [
  // Onboarding
  { pattern: '/onboarding', load: () => import('./modules/onboarding.js'), view: 'main', title: 'Bem-vindo', chrome: false },

  // Home
  { pattern: '/', load: () => import('./modules/home.js'), view: 'main', title: 'Início', nav: 'inicio' },

  // Estudos
  { pattern: '/estudos', load: () => import('./modules/estudos.js'), view: 'main', title: 'Estudos', nav: 'estudos' },
  { pattern: '/estudos/caderno', load: () => import('./modules/estudos.js'), view: 'caderno', title: 'Caderno de Erros', nav: 'estudos' },
  { pattern: '/estudos/:subjectId', load: () => import('./modules/estudos.js'), view: 'main', title: 'Estudos', nav: 'estudos' },

  // Simulado
  { pattern: '/simulado', load: () => import('./modules/simulado.js'), view: 'main', title: 'Simulado', nav: 'estudos' },

  // Treino em Casa
  { pattern: '/treino', load: () => import('./modules/treino.js'), view: 'main', title: 'Treino em Casa', nav: 'treino' },
  { pattern: '/treino/programas', load: () => import('./modules/treino.js'), view: 'programas', title: 'Programas', nav: 'treino' },
  { pattern: '/treino/programas/:id', load: () => import('./modules/treino.js'), view: 'programas', title: 'Programa', nav: 'treino' },
  { pattern: '/treino/exercicio/:id', load: () => import('./modules/treino.js'), view: 'main', title: 'Exercício', nav: 'treino' },
  { pattern: '/treino/construtor', load: () => import('./modules/treino.js'), view: 'construtor', title: 'Montar Treino', nav: 'treino' },

  // Player
  { pattern: '/treino/player/:id', load: () => import('./modules/player.js'), view: 'main', title: 'Player', nav: 'treino' },

  // Mais
  { pattern: '/mais', load: () => import('./modules/mais.js'), view: 'main', title: 'Mais', nav: 'mais' },

  // Perfil
  { pattern: '/perfil', load: () => import('./modules/perfil.js'), view: 'main', title: 'Perfil', nav: 'mais' },

  // Dieta + Calculadora de Alimentos
  { pattern: '/dieta', load: () => import('./modules/dieta.js'), view: 'main', title: 'Dieta', nav: 'mais' },
  { pattern: '/dieta/metas', load: () => import('./modules/dieta.js'), view: 'metas', title: 'Metas de Dieta', nav: 'mais' },
  { pattern: '/dieta/planos', load: () => import('./modules/dieta.js'), view: 'planos', title: 'Planos Alimentares', nav: 'mais' },

  // Teste de IMC
  { pattern: '/imc', load: () => import('./modules/imc.js'), view: 'main', title: 'Teste de IMC', nav: 'mais' },

  // Avaliação Física
  { pattern: '/avaliacao', load: () => import('./modules/avaliacao.js'), view: 'main', title: 'Avaliação Física', nav: 'mais' },

  // Progresso / Dashboard
  { pattern: '/progresso', load: () => import('./modules/progresso.js'), view: 'main', title: 'Progresso', nav: 'mais' },
];

// ---------------------------------------------------------------------
// Matching (puro, exportado para testes, B4.5)
// ---------------------------------------------------------------------

export function matchRoute(routes, path) {
  const segments = path.split('/').filter(s => s);
  
  let bestMatch = null;
  let bestSpecificity = -1;
  
  for (const route of routes) {
    const pattern = route.pattern.split('/').filter(s => s);
    
    // Mesmo número de segmentos
    if (pattern.length !== segments.length) continue;
    
    const params = {};
    let matches = true;
    let specificity = 0;
    
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i].startsWith(':')) {
        // :param
        const paramName = pattern[i].slice(1);
        try {
          params[paramName] = decodeURIComponent(segments[i]);
        } catch (e) {
          matches = false;
          break;
        }
      } else {
        // static segment
        if (pattern[i] !== segments[i]) {
          matches = false;
          break;
        }
        specificity = specificity * 10 + (pattern.length - i); // mais peso à esquerda
      }
    }
    
    if (matches && specificity > bestSpecificity) {
      bestMatch = { route, params };
      bestSpecificity = specificity;
    }
  }
  
  return bestMatch;
}

// ---------------------------------------------------------------------
// Query parsing (exportado para testes)
// ---------------------------------------------------------------------

export function parseQuery(search) {
  const params = new URLSearchParams(search);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  return obj;
}

// ---------------------------------------------------------------------
// Router state
// ---------------------------------------------------------------------

let currentView = null;
let viewEl = null;

// ---------------------------------------------------------------------
// Router start (chamado por main.js após boot)
// ---------------------------------------------------------------------

export function start() {
  viewEl = document.getElementById('view');
  if (!viewEl) {
    console.error('[router] #view não encontrado');
    return;
  }
  
  // Navegação
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

// ---------------------------------------------------------------------
// Handle route (lifecycle: destroy → render, B4.5)
// ---------------------------------------------------------------------

async function handleRoute() {
  const hash = location.hash.slice(1) || '/';
  const [path, search] = hash.split('?');
  
  console.info('[router]', path);
  
  const matched = matchRoute(ROUTES, path);
  
  if (!matched) {
    // Unknown route → redirect to home
    console.warn('[router] rota desconhecida, redirecionando para #/');
    location.replace('#/');
    return;
  }
  
  const { route, params } = matched;
  const query = parseQuery(search || '');
  
  // Destroy current view
  if (currentView?.destroy) {
    try {
      currentView.destroy();
    } catch (e) {
      console.error('[router] destroy error', e);
    }
  }
  currentView = null;
  
  // Load module
  let module;
  try {
    module = await route.load();
  } catch (err) {
    console.error('[router] import error', err);
    const { contentHtml, retryFn } = importErrorState(() => handleRoute());
    viewEl.innerHTML = contentHtml;
    viewEl.querySelector('[data-retry]')?.addEventListener('click', retryFn);
    document.title = `Erro · ${CONFIG.product.name}`;
    return;
  }
  
  const viewFn = module[route.view];
  if (!viewFn) {
    console.error(`[router] view ${route.view} não encontrada em ${route.pattern}`);
    viewEl.innerHTML = '<p>Erro ao carregar a view.</p>';
    return;
  }
  
  // Render
  const ctx = {
    el: viewEl,
    params,
    query,
    navigate: (href) => location.href = href,
  };
  
  try {
    currentView = await viewFn(ctx);
  } catch (err) {
    console.error('[router] render error', err);
    viewEl.innerHTML = '<div class="empty"><h1 tabindex="-1">Algo deu errado</h1><p>Tente recarregar a página.</p></div>';
    document.title = `Erro · ${CONFIG.product.name}`;
    return;
  }
  
  // Post-render: title, focus, scroll, aria-current, transition
  document.title = `${route.title} · ${CONFIG.product.name}`;
  
  const h1 = viewEl.querySelector('h1');
  if (h1) {
    h1.setAttribute('tabindex', '-1');
    h1.focus();
  }
  
  viewEl.scrollTop = 0;
  window.scrollTo(0, 0);
  
  updateNavigation(route.nav);
  
  // Transition class (fade + slide, B6.0)
  viewEl.classList.remove('view-enter-active');
  viewEl.classList.add('view-enter');
  requestAnimationFrame(() => {
    viewEl.classList.remove('view-enter');
    viewEl.classList.add('view-enter-active');
    setTimeout(() => {
      viewEl.classList.remove('view-enter-active');
    }, 180);
  });
}

// ---------------------------------------------------------------------
// Update navigation aria-current (B4.5)
// ---------------------------------------------------------------------

function updateNavigation(nav) {
  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.dataset.nav === nav) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}
