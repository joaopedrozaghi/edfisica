// progresso.js: Dashboard de Progresso (FR-12, parcial)
// Streak, treinos, gráfico peso/IMC, stats de estudo, favoritos
// Sem efeitos colaterais na importação

import { repo } from '../repo.js';
import { html, raw } from '../ui.js';
import { line } from '../charts.js';
import { dateKey, labelShort, fmtInt, fmt1 } from '../utils.js';
import * as calc from '../calc.js';

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
  const minThisWeek = logsThisWeek.reduce((s, l) => s + (l.durationMin || 0), 0);

  // Estatísticas de estudo
  const subjects = Object.keys(studyData.quiz);
  const totalAnswered = subjects.reduce((s, k) => s + (studyData.quiz[k].answered || 0), 0);
  const totalCorrect = subjects.reduce((s, k) => s + (studyData.quiz[k].correct || 0), 0);
  const wrongCount = Object.keys(studyData.wrong).length;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Gráfico peso/IMC
  const bodyPoints = bodyHistory.slice(-15);
  const weightPoints = bodyPoints.map(e => ({ y: e.weightKg }));
  const imcPoints = bodyPoints.filter(e => e.bmi !== null).map(e => ({ y: e.bmi }));
  const xLabels = bodyPoints.map(e => labelShort(e.date));

  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Progresso</h1>

    <div class="home-grid" style="margin-bottom:1.5rem">
      <div class="card">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">🔥 Sequência</h2>
        <div class="stat">
          <div class="stat-value" style="font-size:2.5rem">${streakVal}</div>
          <div class="stat-label">${streakVal === 1 ? 'dia seguido' : 'dias seguidos'}</div>
        </div>
      </div>

      <div class="card">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">💪 Treinos</h2>
        <div class="stat">
          <div class="stat-value" style="font-size:2.5rem">${totalWorkouts}</div>
          <div class="stat-label">no total</div>
        </div>
        <p class="text-small text-muted" style="margin-top:0.5rem">${minThisWeek} min esta semana</p>
      </div>
    </div>

    <div class="card mb-1">
      <h2 style="font-size:1rem;margin-bottom:0.75rem">📊 Estudos</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem">
        <div class="stat">
          <div class="stat-value" style="font-size:1.75rem">${totalAnswered}</div>
          <div class="stat-label">questões respondidas</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="font-size:1.75rem">${accuracy}%</div>
          <div class="stat-label">aproveitamento</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="font-size:1.75rem">${wrongCount}</div>
          <div class="stat-label">para revisar</div>
        </div>
      </div>
      ${wrongCount > 0 ? raw(`<a href="#/estudos/caderno" class="btn btn--secondary btn--small" style="margin-top:0.75rem">Revisar erros →</a>`) : ''}
    </div>

    ${bodyPoints.length > 1 ? raw(`
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">⚖️ Evolução do Peso</h2>
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
        <a href="#/imc" class="btn btn--secondary btn--small" style="margin-top:0.75rem">Registrar peso →</a>
      </div>
    `) : raw(`
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:0.5rem">⚖️ Evolução do Peso</h2>
        <p class="text-muted text-small">Faça seu primeiro teste de IMC para iniciar o acompanhamento.</p>
        <a href="#/imc" class="btn btn--secondary btn--small" style="margin-top:0.75rem">Testar IMC →</a>
      </div>
    `)}

    ${(favExercises.length + favPrograms.length + favFoods.length) > 0 ? raw(`
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">⭐ Favoritos</h2>
        ${favExercises.length > 0 ? `<p class="text-small" style="margin-bottom:0.25rem"><strong>Exercícios:</strong> ${favExercises.length} favoritos · <a href="#/treino">Ver →</a></p>` : ''}
        ${favPrograms.length > 0 ? `<p class="text-small" style="margin-bottom:0.25rem"><strong>Programas:</strong> ${favPrograms.length} favoritos · <a href="#/treino/programas">Ver →</a></p>` : ''}
        ${favFoods.length > 0 ? `<p class="text-small"><strong>Alimentos:</strong> ${favFoods.length} favoritos · <a href="#/dieta">Ver →</a></p>` : ''}
      </div>
    `) : ''}

    <div class="card mb-2">
      <h2 style="font-size:1rem;margin-bottom:0.75rem">🗂️ Gestão de dados</h2>
      <p class="text-small text-muted" style="margin-bottom:0.75rem">Exporte, importe ou redefina seus dados em Perfil.</p>
      <a href="#/perfil" class="btn btn--secondary btn--small">Ir para Perfil →</a>
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
