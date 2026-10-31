// simulado.js: Simulado cronometrado — escolha matérias e nº de questões (B6.0)
// Sem efeitos colaterais na importação

import { repo } from '../repo.js';
import { html, raw, toast, confetti } from '../ui.js';
import { markStudy } from '../missions.js';
import { uid } from '../utils.js';
import { SUBJECTS, LOADERS } from '../../data/subjects/index.js';

// ─────────────────────────────────────────────────────────────────────
// Entrada principal
// ─────────────────────────────────────────────────────────────────────

export async function main(ctx) {
  // Verificar se há simulado ativo salvo
  const active = repo.study.getActive();
  if (active) {
    return renderRun(ctx, active);
  }

  return renderSetup(ctx);
}

// ─────────────────────────────────────────────────────────────────────
// Setup: escolher matérias e nº de questões
// ─────────────────────────────────────────────────────────────────────

function renderSetup(ctx) {
  const history = repo.study.listSimulados();

  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Simulado</h1>
    <p class="text-muted mb-2">Escolha as matérias e o número de questões.</p>

    <div class="card mb-1">
      <h2 style="font-size:1.05rem;margin-bottom:1rem">Matérias</h2>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        ${raw(SUBJECTS.map(s => `
          <label style="display:flex;align-items:center;gap:0.75rem;cursor:pointer;padding:0.5rem 0">
            <input type="checkbox" name="subject" value="${s.id}" checked
              style="width:1.1rem;height:1.1rem;cursor:pointer">
            <span>${s.title}</span>
          </label>
        `).join(''))}
      </div>
    </div>

    <div class="card mb-1">
      <h2 style="font-size:1.05rem;margin-bottom:1rem">Número de questões</h2>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        ${raw(['10', '20', '30', 'todas'].map(v => `
          <label style="cursor:pointer">
            <input type="radio" name="count" value="${v}" ${v === '20' ? 'checked' : ''} style="display:none">
            <span data-count-label="${v}" style="
              display:inline-block;padding:0.5rem 1.1rem;border-radius:2rem;
              border:2px solid var(--border);cursor:pointer;font-weight:500;font-size:0.95rem;
              ${v === '20' ? 'border-color:var(--accent);background:rgba(var(--accent-rgb,99,102,241),0.1);' : ''}
            ">${v === 'todas' ? 'Todas' : v}</span>
          </label>
        `).join(''))}
      </div>
    </div>

    <button type="button" data-start class="btn btn--primary" style="width:100%;margin-bottom:2rem">
      Iniciar Simulado
    </button>

    ${history.length > 0 ? raw(`
      <h2 style="font-size:1.05rem;margin-bottom:1rem">Histórico</h2>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        ${history.slice(0, 5).map(s => {
          const pct = Math.round((s.score / s.total) * 100);
          const date = new Date(s.finishedAt).toLocaleDateString('pt-BR');
          return `
            <div class="card" style="padding:1rem">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-weight:600">${s.score}/${s.total} corretas (${pct}%)</div>
                  <div style="font-size:0.85rem;color:var(--text-muted)">${date} · ${s.items.length} questões</div>
                </div>
                <div class="sim-pct ${pct >= 70 ? 'is-good' : pct >= 50 ? 'is-mid' : 'is-low'}">${pct}%</div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `) : ''}
  `;

  // Radio visual update
  ctx.el.querySelectorAll('input[name="count"]').forEach(radio => {
    radio.addEventListener('change', () => {
      ctx.el.querySelectorAll('[data-count-label]').forEach(span => {
        const v = span.dataset.countLabel;
        if (v === radio.value) {
          span.style.borderColor = 'var(--accent)';
          span.style.background = 'rgba(var(--accent-rgb,99,102,241),0.1)';
        } else {
          span.style.borderColor = 'var(--border)';
          span.style.background = 'transparent';
        }
      });
    });
  });

  ctx.el.querySelector('[data-start]')?.addEventListener('click', async () => {
    const selectedSubjects = Array.from(ctx.el.querySelectorAll('input[name="subject"]:checked'))
      .map(c => c.value);

    if (selectedSubjects.length === 0) {
      toast('Selecione ao menos uma matéria.', { type: 'error' });
      return;
    }

    const countVal = ctx.el.querySelector('input[name="count"]:checked')?.value || '20';

    // Carregar questões das matérias selecionadas
    const allQuestoes = [];
    for (const id of selectedSubjects) {
      const { subject } = await LOADERS[id]();
      for (const q of subject.questoes) {
        allQuestoes.push({ ...q, subjectId: id, subjectTitle: subject.title });
      }
    }

    // Embaralhar
    shuffle(allQuestoes);

    const limit = countVal === 'todas' ? allQuestoes.length : parseInt(countVal, 10);
    const questoes = allQuestoes.slice(0, limit);

    if (questoes.length === 0) {
      toast('Nenhuma questão encontrada.', { type: 'error' });
      return;
    }

    const active = {
      id: uid(),
      startedAt: Date.now(),
      questoes,
      answers: [],
      subjects: selectedSubjects,
    };

    repo.study.saveActive(active);
    renderRun(ctx, active);
  });

  return {};
}

// ─────────────────────────────────────────────────────────────────────
// Execução do simulado (timed)
// ─────────────────────────────────────────────────────────────────────

function renderRun(ctx, active) {
  const total = active.questoes.length;
  let currentIdx = active.answers.length; // retoma de onde parou
  let timerInterval = null;
  const timeLimit = total * 90; // 90s por questão = generous limit

  function getElapsed() {
    return Math.floor((Date.now() - active.startedAt) / 1000);
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function render() {
    if (currentIdx >= total) {
      clearInterval(timerInterval);
      finishSimulado();
      return;
    }

    const q = active.questoes[currentIdx];

    ctx.el.innerHTML = html`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
        <span style="font-size:0.9rem;color:var(--text-muted)">Questão ${currentIdx + 1}/${total}</span>
        <span data-timer style="font-variant-numeric:tabular-nums;font-weight:600;
          color:var(--accent);font-size:1rem">${formatTime(getElapsed())}</span>
      </div>

      <div style="height:6px;background:var(--border);border-radius:3px;margin-bottom:1.5rem;overflow:hidden">
        <div style="height:100%;background:var(--accent);width:${Math.round((currentIdx / total) * 100)}%;transition:width 300ms"></div>
      </div>

      <div class="card mb-1" style="font-size:0.8rem;color:var(--text-muted);padding-bottom:0.5rem">
        ${q.subjectTitle}
      </div>

      <div class="card mb-1">
        <p style="font-weight:500;line-height:1.65;margin:0">${q.texto}</p>
      </div>

      <div data-options style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1rem">
        ${raw(q.opcoes.map((op, i) =>
          `<button type="button" data-opt="${i}"
            style="text-align:left;padding:1rem;border-radius:0.75rem;border:2px solid var(--border);
            background:var(--surface);cursor:pointer;line-height:1.5;transition:all 120ms">
            <span style="font-weight:600;margin-right:0.5rem">${String.fromCharCode(65 + i)})</span>${op}
          </button>`
        ).join(''))}
      </div>

      <div data-explanation style="display:none"></div>

      <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:0.5rem">
        <button type="button" data-abandon style="
          background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;
          padding:0.4rem 0.75rem;border-radius:0.5rem">
          Abandonar
        </button>
      </div>
    `;

    // Timer
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const timerEl = ctx.el.querySelector('[data-timer]');
      if (timerEl) timerEl.textContent = formatTime(getElapsed());
    }, 1000);

    // Answer
    ctx.el.querySelectorAll('[data-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        ctx.el.querySelectorAll('[data-opt]').forEach(b => { b.style.cursor = 'default'; });

        const chosen = parseInt(btn.dataset.opt, 10);
        const correct = chosen === q.correta;

        active.answers.push({ qid: q.id, subjectId: q.subjectId, chosen, correct });
        repo.study.saveActive(active);

        ctx.el.querySelectorAll('[data-opt]').forEach(b => {
          const i = parseInt(b.dataset.opt, 10);
          if (i === q.correta) {
            b.style.borderColor = 'var(--success, #22c55e)';
            b.style.background = 'rgba(34,197,94,0.12)';
          } else if (i === chosen && !correct) {
            b.style.borderColor = 'var(--danger, #ef4444)';
            b.style.background = 'rgba(239,68,68,0.12)';
          }
        });

        const expEl = ctx.el.querySelector('[data-explanation]');
        expEl.style.display = 'block';
        expEl.innerHTML = `
          <div class="card" style="border-left:4px solid ${correct ? 'var(--success,#22c55e)' : 'var(--danger,#ef4444)'};margin-bottom:1rem">
            <p style="font-weight:600;margin:0 0 0.5rem">${correct ? '✅ Correto!' : '❌ Incorreto'}</p>
            <p style="margin:0;line-height:1.6;font-size:0.95rem">${q.explicacao}</p>
          </div>`;

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'btn btn--primary';
        nextBtn.style.cssText = 'width:100%;margin-top:0.5rem';
        nextBtn.textContent = currentIdx < total - 1 ? 'Próxima →' : 'Ver resultado';
        nextBtn.addEventListener('click', () => {
          currentIdx++;
          if (currentIdx < total) {
            render();
          } else {
            clearInterval(timerInterval);
            finishSimulado();
          }
        });
        expEl.appendChild(nextBtn);
      });
    });

    // Abandon
    ctx.el.querySelector('[data-abandon]')?.addEventListener('click', () => {
      clearInterval(timerInterval);
      repo.study.clearActive();
      ctx.navigate('#/simulado');
    });
  }

  function finishSimulado() {
    const elapsed = getElapsed();
    const score = active.answers.filter(a => a.correct).length;
    const items = active.answers.map(a => ({
      qid: a.qid,
      subjectId: a.subjectId,
      correct: a.correct,
    }));

    const result = {
      id: active.id,
      score,
      total: active.answers.length,
      elapsed,
      finishedAt: Date.now(),
      subjects: active.subjects,
      items,
    };

    repo.study.saveSimulado(result);
    markStudy();
    if (result.total && result.score / result.total >= 0.7) setTimeout(() => confetti(), 300);

    const pct = Math.round((score / result.total) * 100);

    ctx.el.innerHTML = html`
      <h1 tabindex="-1">Resultado do simulado</h1>

      <div class="card" style="text-align:center;padding:2rem;margin-bottom:1.5rem">
        <div style="margin:0 auto .75rem;width:120px">${raw(scoreRingHtml(pct))}</div>
        <div style="font-size:2.5rem;font-weight:800;color:${pct >= 70 ? 'var(--success,#22c55e)' : pct >= 50 ? 'var(--accent)' : 'var(--danger,#ef4444)'}">${pct}%</div>
        <div style="font-size:1.1rem;margin-top:0.5rem">${score} de ${result.total} corretas</div>
        <div style="font-size:0.9rem;color:var(--text-muted);margin-top:0.25rem">Tempo: ${formatTime(elapsed)}</div>
      </div>

      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <a href="#/simulado" class="btn btn--ghost" style="flex:1">Novo Simulado</a>
        <a href="#/estudos" class="btn btn--primary" style="flex:1">Estudar matérias</a>
      </div>
    `;
  }

  render();
  return {};
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function scoreRingHtml(pct) {
  const C = 2 * Math.PI * 46;
  return `<div class="score-ring"><svg viewBox="0 0 108 108" aria-hidden="true"><circle cx="54" cy="54" r="46" class="trk"/><circle cx="54" cy="54" r="46" class="val" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - pct / 100)).toFixed(1)}"/></svg><div><b>${pct}%</b><span>de acerto</span></div></div>`;
}
