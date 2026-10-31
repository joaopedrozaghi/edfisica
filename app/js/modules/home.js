// home.js: tela inicial (B6.0, B4.4)
// Greeting, streak, hoje (kcal+água), quick actions, install banner, perfil incompleto
// Sem efeitos colaterais na importação

import { repo, MEALS } from '../repo.js';
import { html, raw, toast } from '../ui.js';
import { dateKey } from '../utils.js';
import { getInstallPrompt } from '../main.js';
import * as calc from '../calc.js';
import { icon } from '../icons.js';

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
  
  // Atalhos por persona (B6.0)
  const allActions = {
    estudante: [
      { href: '#/estudos', icon: 'book', label: 'Estudos' },
      { href: '#/simulado', icon: 'timer', label: 'Simulado' },
      { href: '#/estudos/anatomia?tab=flashcards', icon: 'cards', label: 'Flashcards' },
      { href: '#/estudos/caderno', icon: 'notebook', label: 'Erros' },
    ],
    professor: [
      { href: '#/estudos', icon: 'book', label: 'Estudos' },
      { href: '#/simulado', icon: 'timer', label: 'Simulado' },
      { href: '#/avaliacao', icon: 'ruler', label: 'Avaliação' },
      { href: '#/progresso', icon: 'chart', label: 'Progresso' },
    ],
    casa: [
      { href: '#/treino', icon: 'dumbbell', label: 'Treino' },
      { href: '#/dieta', icon: 'apple', label: 'Dieta' },
      { href: '#/imc', icon: 'scale', label: 'IMC' },
      { href: '#/estudos', icon: 'book', label: 'Estudos' },
    ],
  };
  const quickActions = allActions[profile.persona] || allActions.casa;

  const kcalGoal = targets ? targets.kcal : 0;
  const R = 46;
  const C = 2 * Math.PI * R;
  const kcalPct = kcalGoal > 0 ? Math.min(1, consumedKcal / kcalGoal) : 0;
  const waterPct = (ml) => Math.min(100, (ml / waterGoal.ml) * 100);
  const initial = (name || 'A').trim().charAt(0).toUpperCase();

  ctx.el.innerHTML = html`
    <div class="home-top">
      <div>
        <h1 class="home-hello" tabindex="-1">Olá, ${name}</h1>
        <p class="home-date">${dateStr}</p>
      </div>
      <a href="#/perfil" class="avatar" aria-label="Seu perfil">${initial}</a>
    </div>

    ${showProfileBanner ? raw(`
      <div class="banner">
        <div class="banner-content">
          <div class="banner-title">Complete seu perfil</div>
          <p class="banner-text">Assim as metas e calculadoras ficam certas para você.</p>
        </div>
        <a href="#/perfil" class="btn btn--small btn--primary">Completar</a>
      </div>
    `) : ''}

    ${showInstallBanner ? raw(`
      <div class="banner" data-install-banner>
        <div class="banner-content">
          <div class="banner-title">${isIOS ? 'Adicione à tela inicial' : 'Instale o app'}</div>
          <p class="banner-text">${isIOS ? 'Toque em Compartilhar → Adicionar à Tela de Início' : 'Abre mais rápido e funciona sem internet.'}</p>
        </div>
        ${!isIOS ? `<button type="button" class="btn btn--small btn--primary" data-install>Instalar</button>` : ''}
        <button type="button" class="banner-close" aria-label="Dispensar" data-dismiss-install>
          <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    `) : ''}

    <section class="today" aria-label="Resumo de hoje">
      <div class="today-ring">
        <svg viewBox="0 0 108 108" aria-hidden="true">
          <circle cx="54" cy="54" r="${R}" fill="none" class="trk" stroke-width="10"/>
          <circle cx="54" cy="54" r="${R}" fill="none" class="val" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-ring="${(C * (1 - kcalPct)).toFixed(1)}"/>
        </svg>
        <div class="today-ring-c"><b>${consumedKcal}</b><span>${kcalGoal ? `de ${kcalGoal} kcal` : 'kcal hoje'}</span></div>
      </div>
      <div class="today-side">
        <div>
          <div class="today-k">Sequência</div>
          <div class="today-v">${raw(icon('flame', 18))} ${streak} ${streak === 1 ? 'dia' : 'dias'}</div>
        </div>
        <div>
          <div class="today-k">${kcalGoal ? 'Restam' : 'Meta'}</div>
          ${kcalGoal
            ? raw(`<div class="today-v">${Math.max(0, kcalGoal - consumedKcal)} kcal</div>`)
            : raw(`<a class="today-link" href="#/dieta/metas">Definir meta →</a>`)}
        </div>
        <a class="today-link" href="#/dieta">Registrar refeição →</a>
      </div>
    </section>

    <div class="water">
      <div class="water-ico">${raw(icon('droplet', 20))}</div>
      <div class="water-main">
        <div class="water-top"><strong>Água</strong><span data-water-txt>${habitDay.waterMl} / ${waterGoal.ml} ml</span></div>
        <div class="water-bar"><b data-water-bar style="width:${waterPct(habitDay.waterMl)}%"></b></div>
      </div>
      <button type="button" class="water-btn" data-water-undo aria-label="Desfazer último copo">${raw(icon('minus', 18))}</button>
      <button type="button" class="water-btn" data-water-add aria-label="Adicionar 250 ml">${raw(icon('plus', 18))}</button>
    </div>

    <p class="section-label">Atalhos</p>
    <div class="quick-actions">
      ${raw(quickActions.map(action => `
        <a href="${action.href}" class="quick-action">
          <div class="quick-action-icon">${icon(action.icon, 20)}</div>
          <div class="quick-action-label">${action.label}</div>
        </a>
      `).join(''))}
    </div>

    <a href="#/treino/player/full-body-iniciante" class="next-workout">
      <div class="next-workout-txt">
        <small>Treino sugerido</small>
        <strong>Full Body Iniciante</strong>
        <span>25 min · sem equipamento</span>
      </div>
      <div class="next-workout-play">${raw(icon('play', 22))}</div>
    </a>
  `;

  // Anel de calorias anima ao abrir
  const ringEl = ctx.el.querySelector('[data-ring]');
  if (ringEl) requestAnimationFrame(() => requestAnimationFrame(() => { ringEl.style.strokeDashoffset = ringEl.dataset.ring; }));

  // Água: +250 ml / desfazer, sem recarregar a tela
  const paintWater = (day) => {
    ctx.el.querySelector('[data-water-txt]').textContent = `${day.waterMl} / ${waterGoal.ml} ml`;
    ctx.el.querySelector('[data-water-bar]').style.width = waterPct(day.waterMl) + '%';
  };
  ctx.el.querySelector('[data-water-add]')?.addEventListener('click', () => {
    const { day, goalJustHit } = repo.habits.addWater(dateKey(), 250);
    paintWater(day);
    if (navigator.vibrate && settings.vibration) navigator.vibrate(10);
    if (goalJustHit) toast('Meta de água batida hoje!', { type: 'success' });
  });
  ctx.el.querySelector('[data-water-undo]')?.addEventListener('click', () => {
    paintWater(repo.habits.undoWater(dateKey()));
  });

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
