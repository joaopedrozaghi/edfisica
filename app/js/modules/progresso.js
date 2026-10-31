// progresso.js: Dashboard de Progresso (FR-12, parcial)
// Streak, treinos, gráfico peso/IMC, stats de estudo, favoritos
// Sem efeitos colaterais na importação

import { repo } from '../repo.js';
import { html, raw } from '../ui.js';
import { line } from '../charts.js';
import { dateKey, labelShort, fmtInt, fmt1 } from '../utils.js';
import * as calc from '../calc.js';
import { icon } from '../icons.js';
import { level, achievements, stats } from '../missions.js';

const calcStreak = calc.streak;

export async function main(ctx) {
  const today = dateKey();

  // Dados
  const profile = repo.profile.get();
  const activityKeys = repo.activity.keys();
  const streakVal = activityKeys.length > 0 ? calcStreak(activityKeys, today) : 0;
  const workoutLogs = repo.workouts.listLogs();
  const studyData = repo.study.get();
  const bodyHistory = repo.body.list();
  const favExercises = repo.favs.list('exercises');
  const favPrograms = repo.favs.list('programs');
  const favFoods = repo.favs.list('foods');

  // Estatísticas de treino
  const thisWeekStart = addDays7(today);
  const logsThisWeek = workoutLogs.filter(l => l.date >= thisWeekStart);
  const totalWorkouts = workoutLogs.length;
  const minThisWeek = logsThisWeek.reduce((s, l) => s + (l.durationMin || Math.round((l.durationSec || 0) / 60)), 0);

  // Estatísticas de estudo
  const subjects = Object.keys(studyData.quiz);
  const totalAnswered = subjects.reduce((s, k) => s + (studyData.quiz[k].answered || 0), 0);
  const totalCorrect = subjects.reduce((s, k) => s + (studyData.quiz[k].correct || 0), 0);
  const wrongCount = Object.keys(studyData.wrong).length;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Últimos 7 dias (ativo = treinou, estudou ou bateu a meta de água)
  const actSet = new Set(activityKeys);
  const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const [y, m, d] = today.split('-').map(Number);
    const dt = new Date(y, m - 1, d - i, 12);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    week.push({ label: DOW[dt.getDay()], on: actSet.has(key), today: i === 0 });
  }

  // Gráfico peso/IMC
  const bodyPoints = bodyHistory.slice(-15);
  const weightPoints = bodyPoints.map(e => ({ y: e.weightKg }));
  const imcPoints = bodyPoints.filter(e => e.bmi !== null).map(e => ({ y: e.bmi }));
  const xLabels = bodyPoints.map(e => labelShort(e.date));

  const st = stats();
  const lv = level(st);
  const badges = achievements(st);
  const unlocked = badges.filter((b) => b.done).length;

  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Progresso</h1>
    <p class="page-sub">Sua constância nos últimos dias.</p>

    <div class="week">
      ${raw(week.map((d) => `<div class="week-d${d.on ? ' is-on' : ''}${d.today ? ' is-today' : ''}"><i></i><span>${d.label}</span></div>`).join(''))}
    </div>

    <div class="kpis">
      <div class="kpi kpi--y"><b>${streakVal}</b><span>${streakVal === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
      <div class="kpi"><b>${totalWorkouts}</b><span>treinos feitos</span></div>
      <div class="kpi"><b>${minThisWeek}</b><span>min nesta semana</span></div>
      <div class="kpi"><b>${totalAnswered}</b><span>questões respondidas</span></div>
      <div class="kpi"><b>${accuracy}%</b><span>de acerto</span></div>
      <a class="kpi kpi--link" href="#/estudos/caderno"><b>${wrongCount}</b><span>para revisar →</span></a>
    </div>

    <section class="lv-card" aria-label="Seu nível">
      <span class="lv-card-n">${lv.n}</span>
      <div class="lv-card-t">
        <small>Nível ${lv.n}</small>
        <b>${lv.title}</b>
        <i><b style="width:${lv.pct}%"></b></i>
        <span>${lv.xp} XP · faltam ${lv.need - lv.into} para o nível ${lv.n + 1}</span>
      </div>
    </section>

    <h2 class="section-title">Conquistas <span class="text-muted" style="font-weight:600">${unlocked}/${badges.length}</span></h2>
    <div class="badges">
      ${raw(badges.map((b) => `
        <div class="badge-card${b.done ? ' is-done' : ''}">
          <span class="badge-ico">${icon(b.icon, 20)}</span>
          <b>${b.title}</b>
          <span>${b.done ? 'Conquistada' : `${b.desc} · ${b.progress}`}</span>
        </div>`).join(''))}
    </div>

    ${bodyPoints.length > 1 ? raw(`
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">Evolução do Peso</h2>
        <div style="overflow-x:auto">
          ${line(weightPoints, {
            width: 300, height: 160,
            xLabels,
            yUnit: ' kg',
          })}
        </div>
        ${imcPoints.length > 1 ? `
          <p class="text-small text-muted" style="margin-top:0.75rem;margin-bottom:0.25rem">IMC</p>
          <div style="overflow-x:auto">
            ${line(imcPoints, {
              width: 300, height: 120,
              yMin: 15, yMax: 40,
              goalLine: 21.75,
            })}
          </div>
        ` : ''}
        ${bodyPoints.length > 0 ? `
          <p class="text-small text-muted" style="margin-top:0.5rem">
            Último registro: ${bodyPoints[bodyPoints.length - 1].weightKg} kg
            ${bodyPoints[bodyPoints.length - 1].bmi ? '· IMC ' + fmt1(bodyPoints[bodyPoints.length - 1].bmi) : ''}
          </p>
        ` : ''}
        <a href="#/imc" class="btn btn--ghost btn--small" style="margin-top:0.75rem">Registrar peso →</a>
      </div>
    `) : raw(`
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:0.5rem">Evolução do Peso</h2>
        <p class="text-muted text-small">Faça seu primeiro teste de IMC para iniciar o acompanhamento.</p>
        <a href="#/imc" class="btn btn--ghost btn--small" style="margin-top:0.75rem">Testar IMC →</a>
      </div>
    `)}

    ${(favExercises.length + favPrograms.length + favFoods.length) > 0 ? raw(`
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">Favoritos</h2>
        ${favExercises.length > 0 ? `<p class="text-small" style="margin-bottom:0.25rem"><strong>Exercícios:</strong> ${favExercises.length} favoritos · <a href="#/treino">Ver →</a></p>` : ''}
        ${favPrograms.length > 0 ? `<p class="text-small" style="margin-bottom:0.25rem"><strong>Programas:</strong> ${favPrograms.length} favoritos · <a href="#/treino/programas">Ver →</a></p>` : ''}
        ${favFoods.length > 0 ? `<p class="text-small"><strong>Alimentos:</strong> ${favFoods.length} favoritos · <a href="#/dieta">Ver →</a></p>` : ''}
      </div>
    `) : ''}

    <div class="card mb-2">
      <h2 style="font-size:1rem;margin-bottom:0.75rem">Gestão de dados</h2>
      <p class="text-small text-muted" style="margin-bottom:0.75rem">Exporte, importe ou redefina seus dados em Perfil.</p>
      <a href="#/perfil" class="btn btn--ghost btn--small">Ir para Perfil →</a>
    </div>
  `;

  return {};
}

// Retorna a chave de data de 7 dias atrás
function addDays7(today) {
  // Importar addDays geraria dependência circular se importado de utils no topo —
  // mas utils.js não importa este módulo, então está OK.
  // Reimplementa aqui para ficar autossuficiente:
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12);
  dt.setDate(dt.getDate() - 7);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
