// player.js: player guiado de treino (B6.2.4)
// Timeline: prepare → (work → rest) × exercícios × séries
// Web Audio beeps, vibração, Wake Lock, log no repo.
// Sem efeitos colaterais na importação.

import { EXERCISES_BY_ID, POSES } from '../../data/exercises.js';
import { PROGRAMS_BY_ID } from '../../data/programs.js';
import { repo } from '../repo.js';
import { html, raw, toast } from '../ui.js';
import { beep, countdown321 } from '../audio.js';
import { acquireWakeLock, releaseWakeLock } from '../wakelock.js';
import { dateKey } from '../utils.js';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function svgFigure(pose) {
  // Bonequinhos removidos a pedido.
  return '';
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}`;
}

/** Carrega programa pelo id (ready ou custom-xxx ou builder-preview). */
function loadProgram(id) {
  if (id === 'builder-preview') {
    try {
      const raw = sessionStorage.getItem('edf-builder-preview');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }
  if (id.startsWith('custom-')) {
    const customId = id.slice(7);
    const c = repo.workouts.getCustom(customId);
    if (!c) return null;
    return {
      id: 'custom-' + c.id,
      name: c.name || 'Treino personalizado',
      prepareSec: c.prepareSec || 10,
      items: c.items || [],
    };
  }
  return PROGRAMS_BY_ID[id] || null;
}

/**
 * Gera timeline plana de fases a partir do programa.
 * Fase: { type:'prepare'|'work'|'rest', label, durationSec, exerciseId?, setNum?, totalSets?, nextExerciseId? }
 */
function buildTimeline(program) {
  const phases = [];
  const prepareSec = program.prepareSec || 10;
  const items = program.items || [];

  phases.push({ type: 'prepare', label: 'Prepare-se', durationSec: prepareSec });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const ex = EXERCISES_BY_ID[item.exerciseId];
    const name = ex ? ex.name : item.exerciseId;

    for (let s = 1; s <= item.sets; s++) {
      // work phase
      const nextExercise = (() => {
        if (s < item.sets) return item.exerciseId;
        if (i + 1 < items.length) return items[i + 1].exerciseId;
        return null;
      })();

      phases.push({
        type: 'work',
        label: name,
        durationSec: item.workSec,
        exerciseId: item.exerciseId,
        setNum: s,
        totalSets: item.sets,
        nextExerciseId: nextExercise,
      });

      // rest phase (except after last set of last exercise)
      const isLastPhase = s === item.sets && i === items.length - 1;
      if (!isLastPhase) {
        phases.push({
          type: 'rest',
          label: 'Descanso',
          durationSec: item.restSec,
          nextExerciseId: nextExercise,
        });
      }
    }
  }

  return phases;
}

// ---------------------------------------------------------------------
// View: main (player)
// ---------------------------------------------------------------------

export async function main(ctx) {
  const { params } = ctx;
  const programId = params && params.id ? params.id : null;

  if (!programId) {
    ctx.el.innerHTML = html`
      <div class="empty">
        <h1 tabindex="-1">Nenhum treino selecionado</h1>
        <a href="#/treino/programas" class="btn btn--primary">Ver programas</a>
      </div>`;
    return {};
  }

  const program = loadProgram(programId);

  if (!program) {
    ctx.el.innerHTML = html`
      <div class="empty">
        <h1 tabindex="-1">Programa não encontrado</h1>
        <p>O programa "${programId}" não existe.</p>
        <a href="#/treino/programas" class="btn btn--primary">Ver programas</a>
      </div>`;
    return {};
  }

  const timeline = buildTimeline(program);
  if (timeline.length === 0) {
    ctx.el.innerHTML = html`
      <div class="empty">
        <h1 tabindex="-1">Treino vazio</h1>
        <a href="#/treino/programas" class="btn btn--primary">Voltar</a>
      </div>`;
    return {};
  }

  // Player state
  let phaseIdx = 0;
  let timeLeft = 0;
  let paused = true;
  let intervalId = null;
  let destroyed = false;
  let startTs = null;
  let totalElapsedSec = 0;
  const settings = repo.settings.get();

  // Health disclaimer shown once per session
  const shownDisclaimer = sessionStorage.getItem('edf-player-disclaimer') === '1';

  function vibrate(pattern) {
    if (!settings.vibration) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  }

  function currentPhase() {
    return timeline[phaseIdx] || null;
  }

  function nextExerciseName(phase) {
    if (!phase || !phase.nextExerciseId) return null;
    const ex = EXERCISES_BY_ID[phase.nextExerciseId];
    return ex ? ex.name : null;
  }

  function progressPct() {
    if (phaseIdx >= timeline.length) return 100;
    const phase = currentPhase();
    if (!phase) return 100;
    const total = phase.durationSec || 1;
    const elapsed = total - timeLeft;
    return Math.round((elapsed / total) * 100);
  }

  function renderPhase() {
    if (destroyed) return;
    const phase = currentPhase();
    if (!phase) {
      renderFinished();
      return;
    }

    const nextName = nextExerciseName(phase);
    const ex = phase.exerciseId ? EXERCISES_BY_ID[phase.exerciseId] : null;
    const phasePct = progressPct();

    const phaseColors = {
      prepare: 'var(--accent, #6366f1)',
      work: 'var(--success, #22c55e)',
      rest: 'var(--warning, #f59e0b)',
    };

    ctx.el.innerHTML = html`
      <div class="player" style="min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;padding:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <button type="button" class="btn btn--small btn--secondary" data-quit aria-label="Encerrar treino">✕ Sair</button>
          <div class="text-muted text-small">${program.name}</div>
          <div class="text-muted text-small">${phaseIdx + 1}/${timeline.length}</div>
        </div>

        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">

          <div style="
            width:160px;height:160px;border-radius:50%;
            border:6px solid ${phaseColors[phase.type]};
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            margin-bottom:1.5rem;position:relative
          ">
            <div style="
              position:absolute;top:0;left:0;width:100%;height:100%;border-radius:50%;
              background:conic-gradient(${phaseColors[phase.type]} ${phasePct}%, transparent ${phasePct}%);
              opacity:.18;
            " aria-hidden="true"></div>
            <div style="font-size:3rem;font-weight:700;line-height:1;z-index:1">${formatTime(timeLeft)}</div>
          </div>

          <div style="
            font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
            color:${phaseColors[phase.type]};margin-bottom:.5rem
          ">${phase.type === 'work' ? 'Exercício' : phase.type === 'rest' ? 'Descanso' : 'Preparar'}</div>

          <h1 tabindex="-1" style="font-size:1.6rem;margin:0 0 .25rem">${phase.label}</h1>

          ${phase.type === 'work' ? raw(`
            <div class="text-muted text-small" style="margin-bottom:1rem">
              Série ${phase.setNum} de ${phase.totalSets}
            </div>
          `) : raw('<div style="margin-bottom:1rem"></div>')}

          ${nextName ? raw(`
            <div style="margin-top:1.5rem;padding:.75rem;background:var(--surface);border-radius:.5rem;width:100%;max-width:320px">
              <div class="text-muted text-small">Próximo</div>
              <div style="font-weight:600">${nextName}</div>
            </div>
          `) : ''}

        </div>

        <div style="margin-top:1rem">
          <div style="height:4px;background:var(--border);border-radius:2px;margin-bottom:1rem;overflow:hidden">
            <div style="height:100%;background:${phaseColors[phase.type]};width:${phasePct}%;transition:width .5s linear"></div>
          </div>
          <div style="display:flex;gap:.75rem;justify-content:center">
            <button type="button" class="btn btn--secondary" data-skip aria-label="Pular fase">⏭ Pular</button>
            <button type="button" class="btn btn--primary" style="min-width:120px" data-playpause aria-label="${paused ? 'Iniciar' : 'Pausar'}">
              ${paused ? '▶ Iniciar' : '⏸ Pausar'}
            </button>
          </div>
        </div>
      </div>
    `;

    ctx.el.querySelector('[data-quit]')?.addEventListener('click', () => {
      stopTimer();
      releaseWakeLock();
      ctx.navigate('#/treino/programas');
    });

    ctx.el.querySelector('[data-playpause]')?.addEventListener('click', () => {
      if (paused) startTimer();
      else pauseTimer();
    });

    ctx.el.querySelector('[data-skip]')?.addEventListener('click', () => {
      advancePhase();
    });
  }

  function renderFinished() {
    if (destroyed) return;
    stopTimer();
    releaseWakeLock();

    const totalMin = Math.round(totalElapsedSec / 60) || 1;
    const workouts = program.items ? program.items.reduce((s, i) => s + i.sets, 0) : 0;

    repo.workouts.log({
      programId: program.id,
      programName: program.name,
      date: dateKey(),
      durationSec: totalElapsedSec,
      totalSets: workouts,
    });

    ctx.el.innerHTML = html`
      <div style="min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem">
        <div style="font-size:4rem;margin-bottom:1rem">🎉</div>
        <h1 tabindex="-1" style="margin-bottom:.5rem">Treino concluído!</h1>
        <p class="text-muted" style="margin-bottom:1.5rem">${program.name}</p>
        <div class="card" style="display:flex;gap:2rem;justify-content:center;padding:1rem 2rem;margin-bottom:2rem">
          <div>
            <div style="font-size:1.75rem;font-weight:700">${totalMin}</div>
            <div class="text-muted text-small">min</div>
          </div>
          <div>
            <div style="font-size:1.75rem;font-weight:700">${workouts}</div>
            <div class="text-muted text-small">séries</div>
          </div>
        </div>
        <a href="#/treino/programas" class="btn btn--primary" style="margin-bottom:.75rem;width:100%;max-width:280px">Ver programas</a>
        <a href="#/treino" class="btn btn--secondary" style="width:100%;max-width:280px">Biblioteca</a>
      </div>
    `;
  }

  function startTimer() {
    if (!paused) return;
    paused = false;
    const phase = currentPhase();
    if (!phase) return;
    if (timeLeft <= 0) timeLeft = phase.durationSec;
    if (!startTs) startTs = Date.now();
    acquireWakeLock();
    beep('start');
    vibrate([100]);
    intervalId = setInterval(tick, 1000);
    renderPhase();
  }

  function pauseTimer() {
    if (paused) return;
    paused = true;
    clearInterval(intervalId);
    intervalId = null;
    renderPhase();
  }

  function stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
    paused = true;
    if (startTs) {
      totalElapsedSec += Math.round((Date.now() - startTs) / 1000);
      startTs = null;
    }
  }

  function tick() {
    if (destroyed) return;
    timeLeft--;
    if (timeLeft <= 3 && timeLeft > 0) {
      beep('countdown');
      vibrate([50]);
    }
    if (timeLeft <= 0) {
      advancePhase();
      return;
    }
    renderPhase();
  }

  function advancePhase() {
    stopTimer();
    const phase = currentPhase();
    if (phase) {
      if (phase.type === 'work') beep('rest');
      else if (phase.type === 'rest') beep('start');
    }
    phaseIdx++;
    timeLeft = 0;
    if (phaseIdx >= timeline.length) {
      renderFinished();
      return;
    }
    const next = currentPhase();
    if (next) timeLeft = next.durationSec;
    renderPhase();
    // Auto-start next phase after brief delay
    setTimeout(() => {
      if (!destroyed && !paused && phaseIdx < timeline.length) return;
      // keep paused, user must press play
    }, 500);
  }

  // Show disclaimer before starting if not shown
  if (!shownDisclaimer) {
    sessionStorage.setItem('edf-player-disclaimer', '1');
    ctx.el.innerHTML = html`
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;text-align:center">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h1 tabindex="-1" style="font-size:1.4rem;margin-bottom:1rem">Aviso de saúde</h1>
        <div class="card" style="text-align:left;margin-bottom:1.5rem;max-width:420px">
          <p style="margin:0">Consulte um profissional de saúde antes de iniciar qualquer programa de exercícios. Interrompa imediatamente se sentir dor, tontura ou mal-estar. Este app não substitui a orientação de um educador físico.</p>
        </div>
        <button type="button" class="btn btn--primary" style="width:100%;max-width:280px" data-ok>Entendi, iniciar treino</button>
        <a href="#/treino/programas" class="btn btn--secondary" style="margin-top:.75rem;width:100%;max-width:280px">Cancelar</a>
      </div>
    `;
    ctx.el.querySelector('[data-ok]')?.addEventListener('click', () => {
      // Initialize player
      timeLeft = timeline[0].durationSec;
      renderPhase();
    });
    return {
      destroy() {
        destroyed = true;
        stopTimer();
        releaseWakeLock();
      },
    };
  }

  // Initialize
  timeLeft = timeline[0].durationSec;
  renderPhase();

  return {
    destroy() {
      destroyed = true;
      stopTimer();
      releaseWakeLock();
    },
  };
}
