// home.js: tela inicial (B6.0, B4.4)
// Greeting, streak, hoje (kcal+água), quick actions, install banner, perfil incompleto
// Sem efeitos colaterais na importação

import { repo, MEALS } from '../repo.js';
import { html, raw, toast } from '../ui.js';
import { ring } from '../charts.js';
import { dateKey } from '../utils.js';
import { getInstallPrompt } from '../main.js';
import * as calc from '../calc.js';

export async function main(ctx) {
  const profile = repo.profile.get();
  const settings = repo.settings.get();
  const activityKeys = repo.activity.keys();
  const streak = activityKeys.length > 0 ? calc.streak(activityKeys, dateKey()) : 0;
  
  // Targets (pode ser null, B4.4)
  const targets = repo.diet.getTargets();
  
  // Water goal
  const waterGoal = repo.habits.waterGoal();
  const habitDay = repo.habits.getDay(dateKey());
  
  // Diet consumed hoje
  const todayDate = dateKey();
  const dietDay = repo.diet.getDay(todayDate);
  
  // Calcula kcal consumidas do dia usando foods data (lazy)
  let consumedKcal = 0;
  try {
    const { FOODS_BY_ID } = await import('../../data/foods.js');
    const allEntries = [];
    for (const meal of MEALS) {
      const entries = dietDay.meals[meal.key] || [];
      for (const e of entries) allEntries.push(e);
    }
    const totals = calc.foodTotals(allEntries, FOODS_BY_ID);
    consumedKcal = Math.round(totals.kcal);
  } catch (e) {
    consumedKcal = 0;
  }
  
  // Greeting
  const name = profile.name || 'atleta';
  const dateStr = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  
  // Incomplete profile banner
  const showProfileBanner = !repo.profile.isComplete();
  
  // Install banner (dismissible, iOS special)
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const showInstallBanner = !settings.installDismissed && (getInstallPrompt() || (isIOS && !isStandalone));
  
  // Persona-ordered quick actions (B6.0)
  const allActions = {
    estudante: [
      { href: '#/estudos', icon: '📚', label: 'Estudos' },
      { href: '#/simulado', icon: '⏱️', label: 'Simulado' },
      { href: '#/estudos/anatomia?tab=flashcards', icon: '🔄', label: 'Flashcards' },
      { href: '#/estudos/caderno', icon: '📓', label: 'Caderno de Erros' },
    ],
    professor: [
      { href: '#/estudos', icon: '📚', label: 'Estudos' },
      { href: '#/simulado', icon: '⏱️', label: 'Simulado' },
      { href: '#/avaliacao', icon: '📏', label: 'Avaliação' },
      { href: '#/perfil', icon: '👤', label: 'Perfil' },
    ],
    casa: [
      { href: '#/treino', icon: '💪', label: 'Treino' },
      { href: '#/dieta', icon: '🥗', label: 'Dieta' },
      { href: '#/imc', icon: '⚖️', label: 'IMC' },
      { href: '#/estudos', icon: '📚', label: 'Estudos' },
    ],
  };
  
  const quickActions = allActions[profile.persona] || allActions.casa;
  
  ctx.el.innerHTML = html`
    <h1 class="greeting" tabindex="-1">Olá, ${name} 👋</h1>
    <p class="home-date">${dateStr}</p>
    
    ${showProfileBanner ? raw(`
      <div class="banner">
        <div class="banner-content">
          <div class="banner-title">Complete seu perfil</div>
          <p class="banner-text">Para aproveitar melhor as calculadoras e metas</p>
        </div>
        <a href="#/perfil" class="btn btn--small btn--primary">Completar</a>
      </div>
    `) : ''}
    
    ${showInstallBanner ? raw(`
      <div class="banner" data-install-banner>
        <div class="banner-content">
          <div class="banner-title">${isIOS ? 'Adicione à tela inicial' : 'Instale o app'}</div>
          <p class="banner-text">${isIOS ? 'Toque em Compartilhar → Adicionar à Tela de Início' : 'Use o app offline e acesse mais rápido'}</p>
        </div>
        ${!isIOS ? `<button type="button" class="btn btn--small btn--primary" data-install>Instalar</button>` : ''}
        <button type="button" class="banner-close" aria-label="Dispensar" data-dismiss-install>
          <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    `) : ''}
    
    <div class="home-grid">
      <div class="card">
        <h2 style="font-size:1.125rem;margin-bottom:1rem">🔥 Sequência</h2>
        <div class="stat">
          <div class="stat-value">${streak}</div>
          <div class="stat-label">${streak === 1 ? 'dia seguido' : 'dias seguidos'}</div>
        </div>
      </div>
      
      <div class="card">
        <h2 style="font-size:1.125rem;margin-bottom:1rem">Hoje</h2>
        
        ${targets ? raw(`
          <div class="ring mb-1">
            ${ring(consumedKcal, targets.kcal, { size: 100, label: consumedKcal.toString(), sublabel: `de ${targets.kcal}` })}
            <p class="text-small text-muted" style="margin-top:0.5rem">kcal</p>
          </div>
        `) : raw(`
          <p class="text-muted text-small mb-1">
            Consumido: <strong>${consumedKcal} kcal</strong><br>
            <a href="#/dieta/metas">Defina sua meta →</a>
          </p>
        `)}
        
        <div style="margin-top:1rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <span class="text-small">Água</span>
            <span class="text-small text-muted">${habitDay.waterMl} / ${waterGoal.ml} ml</span>
          </div>
          <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
            <div style="height:100%;background:var(--accent);width:${Math.min(100, (habitDay.waterMl / waterGoal.ml) * 100)}%;transition:width 300ms"></div>
          </div>
          ${waterGoal.source === 'padrao' ? raw(`<p class="text-small text-muted" style="margin-top:0.25rem">padrão (complete seu peso)</p>`) : ''}
        </div>
      </div>
    </div>
    
    <h2 style="font-size:1.25rem;margin:2rem 0 1rem">Acesso rápido</h2>
    <div class="quick-actions">
      ${raw(quickActions.map(action => `
        <a href="${action.href}" class="quick-action">
          <div class="quick-action-icon">${action.icon}</div>
          <div class="quick-action-label">${action.label}</div>
        </a>
      `).join(''))}
    </div>

    <div class="card" style="margin-top:2rem">
      <h2 style="font-size:1rem;margin-bottom:.75rem">💪 Treino sugerido</h2>
      <p class="text-muted text-small" style="margin-bottom:.75rem">Full Body Iniciante · 25 min · Sem equipamento</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <a href="#/treino/player/full-body-iniciante" class="btn btn--primary btn--small">▶ Iniciar</a>
        <a href="#/treino/programas" class="btn btn--secondary btn--small">Ver todos</a>
      </div>
    </div>
  `;
  
  // Install button handler
  ctx.el.querySelector('[data-install]')?.addEventListener('click', async () => {
    const prompt = getInstallPrompt();
    if (!prompt) {
      toast('Não foi possível instalar. Tente pelo menu do navegador.', { type: 'info' });
      return;
    }
    
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    
    if (outcome === 'accepted') {
      toast('App instalado com sucesso!', { type: 'success' });
      repo.settings.update({ installDismissed: true });
      ctx.el.querySelector('[data-install-banner]')?.remove();
    }
  });
  
  // Dismiss install banner
  ctx.el.querySelector('[data-dismiss-install]')?.addEventListener('click', () => {
    repo.settings.update({ installDismissed: true });
    ctx.el.querySelector('[data-install-banner]')?.remove();
  });
  
  return {};
}
