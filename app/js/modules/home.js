// home.js: tela inicial (B6.0, B4.4)
// Greeting, streak, hoje (kcal+água), quick actions, install banner, perfil incompleto
// Sem efeitos colaterais na importação

import { repo, MEALS } from '../repo.js';
import { html, raw, toast, confetti } from '../ui.js';
import { dateKey } from '../utils.js';
import { getInstallPrompt } from '../main.js';
import * as calc from '../calc.js';
import { icon } from '../icons.js';
import { todayMissions, level } from '../missions.js';

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
  const waterPct = (ml) => Math.min(100, (ml / waterGoal.ml) * 100);
  const initial = (name || 'A').trim().charAt(0).toUpperCase();
  const lv = level();
  const mission = todayMissions();
  const MR = 30;
  const MC = 2 * Math.PI * MR;
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  ctx.el.innerHTML = html`
    <div class="home-top">
      <div>
        <p class="home-date">${dateStr}</p>
        <h1 class="home-hello" tabindex="-1">${hello}, ${name}</h1>
      </div>
      <a href="#/progresso" class="lv-badge" aria-label="Nível ${lv.n}, ${lv.title}. Ver progresso">
        <span class="avatar">${initial}</span>
        <span class="lv-n">${lv.n}</span>
      </a>
    </div>

    <a href="#/progresso" class="lv-bar" aria-label="Experiência">
      <span><b>Nível ${lv.n}</b> · ${lv.title}</span>
      <span>${lv.into}/${lv.need} XP</span>
      <i><b style="width:${lv.pct}%"></b></i>
    </a>

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

    <section class="mission${mission.done === mission.total ? ' is-done' : ''}" aria-label="Missão de hoje">
      <div class="mission-head">
        <div>
          <small>Missão de hoje</small>
          <b>${mission.done === mission.total ? 'Dia completo!' : `${mission.done} de ${mission.total} feitas`}</b>
        </div>
        <div class="mission-ring">
          <svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="${MR}" class="trk"/><circle cx="36" cy="36" r="${MR}" class="val" stroke-dasharray="${MC.toFixed(1)}" stroke-dashoffset="${MC.toFixed(1)}" data-mring="${(MC * (1 - mission.done / mission.total)).toFixed(1)}"/></svg>
          <span>${Math.round((mission.done / mission.total) * 100)}%</span>
        </div>
      </div>
      <ul class="mission-list">
        ${raw(mission.items.map((m) => `
          <li class="${m.done ? 'is-done' : ''}">
            <a href="${m.href}">
              <span class="mission-check">${m.done ? icon('check', 14) : ''}</span>
              <span class="mission-t"><b>${m.label}</b><span>${m.done ? 'Feito' : m.hint}</span></span>
            </a>
          </li>`).join(''))}
      </ul>
    </section>

    <div class="mini-stats">
      <a href="#/progresso" class="mini"><span class="mini-ico">${raw(icon('flame', 18))}</span><b>${streak}</b><span>${streak === 1 ? 'dia seguido' : 'dias seguidos'}</span></a>
      <a href="#/dieta" class="mini"><span class="mini-ico">${raw(icon('apple', 18))}</span><b>${consumedKcal}</b><span>${kcalGoal ? `de ${kcalGoal} kcal` : 'kcal hoje'}</span></a>
    </div>

    <div class="water">
      <div class="water-ico">${raw(icon('droplet', 20))}</div>
      <div class="water-main">
        <div class="water-top"><strong>Água</strong><span data-water-txt>${habitDay.waterMl} / ${waterGoal.ml} ml</span></div>
        <div class="water-bar"><b data-water-bar style="width:${waterPct(habitDay.waterMl)}%"></b></div>
      </div>
      <button type="button" class="water-btn" data-water-undo aria-label="Desfazer último copo">${raw(icon('minus', 18))}</button>
      <button type="button" class="water-btn water-btn--add" data-water-add aria-label="Adicionar 250 ml">${raw(icon('plus', 18))}</button>
    </div>

    <a href="#/treino/player/full-body-iniciante" class="next-workout">
      <div class="next-workout-txt">
        <small>Treino sugerido</small>
        <strong>Full Body Iniciante</strong>
        <span>25 min · sem equipamento</span>
      </div>
      <div class="next-workout-play">${raw(icon('play', 22))}</div>
    </a>

    <p class="section-label" style="margin-top:1.25rem">Atalhos</p>
    <div class="quick-actions">
      ${raw(quickActions.map(action => `
        <a href="${action.href}" class="quick-action">
          <div class="quick-action-icon">${icon(action.icon, 20)}</div>
          <div class="quick-action-label">${action.label}</div>
        </a>
      `).join(''))}
    </div>

    <div class="tip">
      <span class="tip-tag">Dica do dia · ${tip.tag}</span>
      <p>${tip.text}</p>
    </div>
  `;

  // Anéis animam ao abrir
  const mring = ctx.el.querySelector('[data-mring]');
  if (mring) requestAnimationFrame(() => requestAnimationFrame(() => { mring.style.strokeDashoffset = mring.dataset.mring; }));

  // Missão completa: comemora uma vez por dia
  if (mission.done === mission.total) {
    const key = 'edf:celebrated:' + dateKey();
    let seen = false;
    try { seen = sessionStorage.getItem(key) === '1'; sessionStorage.setItem(key, '1'); } catch (e) { seen = true; }
    if (!seen) setTimeout(() => confetti(), 350);
  }

  // Água: +250 ml / desfazer
  const paintWater = (day) => {
    ctx.el.querySelector('[data-water-txt]').textContent = `${day.waterMl} / ${waterGoal.ml} ml`;
    ctx.el.querySelector('[data-water-bar]').style.width = waterPct(day.waterMl) + '%';
  };
  ctx.el.querySelector('[data-water-add]')?.addEventListener('click', () => {
    const { day, goalJustHit } = repo.habits.addWater(dateKey(), 250);
    paintWater(day);
    if (navigator.vibrate && settings.vibration) navigator.vibrate(10);
    if (goalJustHit) {
      confetti();
      toast('Meta de água batida hoje!', { type: 'success' });
      setTimeout(() => main(ctx), 900);
    }
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

// Dicas que mudam a cada dia
const TIPS = [
  { tag: 'Estudo', text: 'Revisar no dia seguinte fixa muito mais do que reler tudo de uma vez. Faça 10 flashcards hoje.' },
  { tag: 'Treino', text: 'Aqueça 5 minutos antes de treinar: mobilidade de quadril e ombros já reduz o risco de lesão.' },
  { tag: 'Dieta', text: 'Inclua uma fonte de proteína em cada refeição: ovo, frango, feijão ou iogurte.' },
  { tag: 'Hábito', text: 'Deixe uma garrafa de água à vista. Quem vê, bebe mais.' },
  { tag: 'Estudo', text: 'Errou uma questão? Ótimo: ela foi para o caderno de erros. Revise até acertar.' },
  { tag: 'Treino', text: 'Qualidade antes de quantidade: 10 repetições bem feitas valem mais que 20 mal feitas.' },
  { tag: 'Sono', text: 'Dormir 7 a 9 horas melhora a memória e a recuperação muscular.' },
  { tag: 'Dieta', text: 'Arroz com feijão é uma ótima combinação de proteína vegetal. Valorize o prato brasileiro.' },
  { tag: 'Estudo', text: 'Simulados com tempo treinam a cabeça para o dia da prova. Faça um por semana.' },
  { tag: 'Treino', text: 'Constância vence intensidade: 3 treinos curtos por semana já trazem resultado.' },
  { tag: 'Hábito', text: 'Marque um horário fixo para treinar ou estudar. Vira rotina em poucas semanas.' },
  { tag: 'Dieta', text: 'Frutas inteiras saciam mais do que suco. Prefira a fruta no lanche.' },
  { tag: 'Estudo', text: 'Explique o conteúdo em voz alta como se fosse dar aula: é o melhor teste de entendimento.' },
  { tag: 'Treino', text: 'Respire: solte o ar na fase de esforço do exercício, nunca prenda a respiração.' },
];
