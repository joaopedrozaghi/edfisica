// estudos.js: Estudos para Prova — lista de matérias, resumo, flashcards e quiz (B6.0)
// Sem efeitos colaterais na importação

import { repo } from '../repo.js';
import { html, raw, toast } from '../ui.js';
import { SUBJECTS, LOADERS } from '../../data/subjects/index.js';
import { icon } from '../icons.js';

// ─────────────────────────────────────────────────────────────────────
// Entrada principal: roteada por ctx.params.subjectId e ctx.query.tab
// ─────────────────────────────────────────────────────────────────────

export async function main(ctx) {
  const { subjectId } = ctx.params || {};
  const { tab } = ctx.query || {};

  if (!subjectId) {
    return renderList(ctx);
  }

  const loader = LOADERS[subjectId];
  if (!loader) {
    ctx.el.innerHTML = html`
      <div class="empty">
        <div class="empty-emoji">🔎</div>
        <h1 class="empty-title" tabindex="-1">Matéria não encontrada</h1>
        <a href="#/estudos" class="btn btn--primary">Voltar</a>
      </div>`;
    return {};
  }

  const { subject } = await loader();
  const activeTab = tab === 'flashcards' ? 'flashcards' : tab === 'quiz' ? 'quiz' : 'resumo';
  return renderSubject(ctx, subject, activeTab);
}

// ─────────────────────────────────────────────────────────────────────
// Lista de matérias
// ─────────────────────────────────────────────────────────────────────

const SUBJECT_ICON = {
  anatomia: 'user',
  fisiologia: 'heart',
  treinamento: 'dumbbell',
  'primeiros-socorros': 'plus',
  avaliacao: 'ruler',
  'regras-esportes': 'clipboard',
};

function renderList(ctx) {
  const studyData = repo.study.get();
  const wrongCount = studyData.wrong ? Object.keys(studyData.wrong).length : 0;

  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Estudos</h1>
    <p class="page-sub">Escolha uma matéria. Resumo, flashcards e quiz em cada uma.</p>

    <div class="study-cta">
      <a href="#/simulado" class="btn btn--primary">${raw(icon('timer', 18))} Fazer simulado</a>
      <a href="#/estudos/caderno" class="btn btn--ghost">${raw(icon('notebook', 18))} Erros${wrongCount ? raw(` <span class="badge">${wrongCount}</span>`) : ''}</a>
    </div>

    <div class="subject-list">
      ${raw(SUBJECTS.map((s) => {
        const quiz = studyData.quiz[s.id] || { answered: 0, correct: 0 };
        const pct = quiz.answered > 0 ? Math.round((quiz.correct / quiz.answered) * 100) : 0;
        return `
          <a href="#/estudos/${s.id}" class="list-item subject">
            <span class="list-item-icon">${icon(SUBJECT_ICON[s.id] || 'book', 20)}</span>
            <span class="list-item-content">
              <span class="list-item-title">${s.title}</span>
              <span class="list-item-subtitle">${quiz.answered ? `${quiz.correct} de ${quiz.answered} certas` : 'Ainda não começou'}</span>
              <span class="subject-bar"><i style="width:${pct}%"></i></span>
            </span>
            <span class="list-item-action">${icon('chevron', 18)}</span>
          </a>`;
      }).join(''))}
    </div>
  `;

  return {};
}

// ─────────────────────────────────────────────────────────────────────
// View de matéria (tabs: resumo | flashcards | quiz)
// ─────────────────────────────────────────────────────────────────────

function renderSubject(ctx, subject, activeTab) {
  ctx.el.innerHTML = html`
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
      <a href="#/estudos" style="color:var(--text-muted);text-decoration:none;font-size:0.9rem">← Matérias</a>
    </div>

    <h1 tabindex="-1">${subject.icon} ${subject.title}</h1>

    <div class="tab-bar" role="tablist" style="display:flex;gap:0.5rem;margin:1.5rem 0;border-bottom:2px solid var(--border);padding-bottom:0">
      ${raw(['resumo', 'flashcards', 'quiz'].map(tab => {
        const labels = { resumo: '📖 Resumo', flashcards: '🃏 Flashcards', quiz: '✅ Quiz' };
        const isActive = tab === activeTab;
        return `<button type="button" role="tab" aria-selected="${isActive}" data-tab="${tab}"
          style="padding:0.5rem 1rem;border:none;background:transparent;cursor:pointer;font-size:0.95rem;
          border-bottom:3px solid ${isActive ? 'var(--accent)' : 'transparent'};
          color:${isActive ? 'var(--accent)' : 'var(--text-muted)'};font-weight:${isActive ? '600' : '400'};
          margin-bottom:-2px">
          ${labels[tab]}
        </button>`;
      }).join(''))}
    </div>

    <div data-tab-content></div>
  `;

  // Tab click
  ctx.el.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      ctx.navigate(`#/estudos/${subject.id}?tab=${tab}`);
    });
  });

  // Render content
  const contentEl = ctx.el.querySelector('[data-tab-content]');
  if (activeTab === 'resumo') renderResumo(contentEl, subject);
  else if (activeTab === 'flashcards') renderFlashcards(contentEl, subject);
  else renderQuiz(contentEl, subject);

  return {};
}

// ─────────────────────────────────────────────────────────────────────
// Resumo + pontos-chave
// ─────────────────────────────────────────────────────────────────────

function renderResumo(el, subject) {
  el.innerHTML = html`
    <div class="card mb-1" style="white-space:pre-line;line-height:1.7">${subject.resumo}</div>
    <div class="card">
      <h2 style="font-size:1.1rem;margin-bottom:1rem">🔑 Pontos-chave</h2>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.75rem">
        ${raw(subject.pontosChave.map(pt =>
          `<li style="display:flex;gap:0.75rem;align-items:flex-start">
            <span style="color:var(--accent);flex-shrink:0;margin-top:0.1rem">✓</span>
            <span>${pt}</span>
          </li>`
        ).join(''))}
      </ul>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// Flashcards (flip, Errei/Acertei, Leitner)
// ─────────────────────────────────────────────────────────────────────

function renderFlashcards(el, subject) {
  const cards = subject.flashcards;
  let idx = 0;
  let flipped = false;

  function render() {
    const card = cards[idx];
    el.innerHTML = html`
      <p class="text-muted text-small mb-1" style="text-align:center">${idx + 1} / ${cards.length}</p>

      <div data-flashcard style="
        background:var(--surface);border:1px solid var(--border);border-radius:1rem;
        padding:2rem;min-height:160px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;text-align:center;
        cursor:pointer;transition:transform 120ms;user-select:none;gap:1rem">
        ${flipped
          ? raw(`<div style="font-size:0.8rem;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Resposta</div>
                 <div style="font-size:1.1rem;line-height:1.6">${card.verso}</div>`)
          : raw(`<div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Pergunta</div>
                 <div style="font-size:1.1rem;font-weight:500;line-height:1.5">${card.frente}</div>
                 <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.5rem">Toque para revelar</div>`)
        }
      </div>

      ${flipped ? raw(`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.25rem">
          <button type="button" data-grade="wrong" class="btn btn--danger">❌ Errei</button>
          <button type="button" data-grade="right" class="btn btn--primary">✅ Acertei</button>
        </div>
      `) : raw(`
        <div style="text-align:center;margin-top:1.25rem">
          <button type="button" data-flip class="btn btn--ghost">Virar 🔄</button>
        </div>
      `)}

      <div style="display:flex;justify-content:center;gap:1.5rem;margin-top:1.5rem">
        <button type="button" data-prev class="btn btn--ghost btn--small" ${idx === 0 ? 'disabled' : ''}>← Anterior</button>
        <button type="button" data-next class="btn btn--ghost btn--small" ${idx === cards.length - 1 ? 'disabled' : ''}>Próximo →</button>
      </div>
    `;

    el.querySelector('[data-flashcard]')?.addEventListener('click', () => {
      flipped = !flipped;
      render();
    });

    el.querySelector('[data-flip]')?.addEventListener('click', () => {
      flipped = true;
      render();
    });

    el.querySelector('[data-grade="wrong"]')?.addEventListener('click', () => {
      repo.study.gradeCard(card.id, false);
      toast('Adicionado ao caderno de erros', { type: 'info', duration: 1500 });
      if (idx < cards.length - 1) { idx++; flipped = false; render(); }
    });

    el.querySelector('[data-grade="right"]')?.addEventListener('click', () => {
      repo.study.gradeCard(card.id, true);
      if (idx < cards.length - 1) { idx++; flipped = false; render(); }
      else {
        repo.study.finishSession({ kind: 'flashcards', subjectId: subject.id, count: cards.length });
        el.innerHTML = html`
          <div class="empty" style="padding:2rem 0">
            <div class="empty-emoji">🎉</div>
            <h2 class="empty-title">Flashcards concluídos!</h2>
            <p class="empty-text">Ótimo trabalho. Revise os erros ou faça o quiz.</p>
            <div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center">
              <button type="button" data-restart class="btn btn--ghost">Recomeçar</button>
              <a href="#/estudos/${subject.id}?tab=quiz" class="btn btn--primary">Fazer Quiz</a>
            </div>
          </div>`;
        el.querySelector('[data-restart]')?.addEventListener('click', () => {
          idx = 0; flipped = false; render();
        });
      }
    });

    el.querySelector('[data-prev]')?.addEventListener('click', () => {
      if (idx > 0) { idx--; flipped = false; render(); }
    });
    el.querySelector('[data-next]')?.addEventListener('click', () => {
      if (idx < cards.length - 1) { idx++; flipped = false; render(); }
    });
  }

  render();
}

// ─────────────────────────────────────────────────────────────────────
// Quiz (resposta trava + revelação de explicação + caderno de erros)
// ─────────────────────────────────────────────────────────────────────

function renderQuiz(el, subject) {
  const questoes = subject.questoes;
  let idx = 0;
  let answered = false;
  let score = 0;

  function renderQuestion() {
    const q = questoes[idx];
    el.innerHTML = html`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <span class="text-small text-muted">Questão ${idx + 1} de ${questoes.length}</span>
        <span class="text-small">Acertos: <strong>${score}</strong></span>
      </div>

      <div class="card mb-1">
        <p style="font-weight:500;line-height:1.6;margin:0">${q.texto}</p>
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
    `;

    el.querySelectorAll('[data-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const chosen = parseInt(btn.dataset.opt, 10);
        const correct = chosen === q.correta;

        if (correct) score++;

        // Persiste no repo
        repo.study.recordAnswer(subject.id, q.id, correct);

        // Colorir opções
        el.querySelectorAll('[data-opt]').forEach(b => {
          const i = parseInt(b.dataset.opt, 10);
          if (i === q.correta) {
            b.style.borderColor = 'var(--success, #22c55e)';
            b.style.background = 'rgba(34,197,94,0.12)';
          } else if (i === chosen && !correct) {
            b.style.borderColor = 'var(--danger, #ef4444)';
            b.style.background = 'rgba(239,68,68,0.12)';
          }
          b.style.cursor = 'default';
        });

        // Explicação
        const expEl = el.querySelector('[data-explanation]');
        expEl.style.display = 'block';
        expEl.innerHTML = `
          <div class="card" style="border-left:4px solid ${correct ? 'var(--success,#22c55e)' : 'var(--danger,#ef4444)'};padding:1rem">
            <p style="font-weight:600;margin:0 0 0.5rem">${correct ? '✅ Correto!' : '❌ Incorreto'}</p>
            <p style="margin:0;line-height:1.6;font-size:0.95rem">${q.explicacao}</p>
          </div>`;

        // Botão próxima
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'btn btn--primary';
        nextBtn.style.cssText = 'width:100%;margin-top:1rem';
        nextBtn.textContent = idx < questoes.length - 1 ? 'Próxima →' : 'Ver resultado';
        nextBtn.addEventListener('click', () => {
          idx++;
          answered = false;
          if (idx < questoes.length) {
            renderQuestion();
          } else {
            renderResult();
          }
        });
        expEl.appendChild(nextBtn);
      });
    });
  }

  function renderResult() {
    repo.study.finishSession({ kind: 'quiz', subjectId: subject.id, count: questoes.length });
    const pct = Math.round((score / questoes.length) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📖';

    el.innerHTML = html`
      <div class="empty" style="padding:2rem 0">
        <div class="empty-emoji">${emoji}</div>
        <h2 class="empty-title">Quiz concluído!</h2>
        <p class="empty-text">${score} de ${questoes.length} corretas — ${pct}%</p>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-top:1rem">
          <button type="button" data-restart class="btn btn--ghost">Refazer quiz</button>
          <a href="#/estudos" class="btn btn--primary">Outras matérias</a>
        </div>
      </div>
    `;

    el.querySelector('[data-restart]')?.addEventListener('click', () => {
      idx = 0; answered = false; score = 0; renderQuestion();
    });
  }

  renderQuestion();
}

// ─────────────────────────────────────────────────────────────────────
// Caderno de erros
// ─────────────────────────────────────────────────────────────────────

export async function caderno(ctx) {
  const wrongList = repo.study.wrongList();

  if (wrongList.length === 0) {
    ctx.el.innerHTML = html`
      <div class="empty">
        <div class="empty-emoji">🎉</div>
        <h1 class="empty-title" tabindex="-1">Caderno de Erros</h1>
        <p class="empty-text">Nenhum erro registrado — continue assim!</p>
        <a href="#/estudos" class="btn btn--primary">Ir para Estudos</a>
      </div>`;
    return {};
  }

  // Encontrar as questões erradas em todas as matérias
  const allSubjects = [
    (await LOADERS['anatomia']()).subject,
    (await LOADERS['fisiologia']()).subject,
    (await LOADERS['treinamento']()).subject,
    (await LOADERS['primeiros-socorros']()).subject,
    (await LOADERS['avaliacao']()).subject,
    (await LOADERS['regras-esportes']()).subject,
  ];

  const qMap = {};
  for (const s of allSubjects) {
    for (const q of s.questoes) {
      qMap[q.id] = { ...q, subjectTitle: s.title, subjectId: s.id };
    }
  }

  const wrongQuestoes = wrongList.map(w => qMap[w.qid]).filter(Boolean);

  ctx.el.innerHTML = html`
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
      <a href="#/estudos" style="color:var(--text-muted);text-decoration:none;font-size:0.9rem">← Estudos</a>
    </div>
    <h1 tabindex="-1">📓 Caderno de Erros</h1>
    <p class="text-muted mb-2">${wrongQuestoes.length} questão(ões) para revisar</p>
    <div data-caderno-content></div>
  `;

  const contentEl = ctx.el.querySelector('[data-caderno-content]');
  let idx = 0;
  let answered = false;

  function renderWrongQuestion() {
    const q = wrongQuestoes[idx];

    contentEl.innerHTML = html`
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem">
        <span class="text-small text-muted">${idx + 1} / ${wrongQuestoes.length}</span>
        <span class="text-small text-muted">${q.subjectTitle}</span>
      </div>
      <div class="card mb-1">
        <p style="font-weight:500;line-height:1.6;margin:0">${q.texto}</p>
      </div>
      <div data-opts style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1rem">
        ${raw(q.opcoes.map((op, i) =>
          `<button type="button" data-opt="${i}"
            style="text-align:left;padding:1rem;border-radius:0.75rem;border:2px solid var(--border);
            background:var(--surface);cursor:pointer;line-height:1.5;transition:all 120ms">
            <span style="font-weight:600;margin-right:0.5rem">${String.fromCharCode(65 + i)})</span>${op}
          </button>`
        ).join(''))}
      </div>
      <div data-exp style="display:none"></div>
    `;

    contentEl.querySelectorAll('[data-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const chosen = parseInt(btn.dataset.opt, 10);
        const correct = chosen === q.correta;

        repo.study.recordAnswer(q.subjectId, q.id, correct);

        contentEl.querySelectorAll('[data-opt]').forEach(b => {
          const i = parseInt(b.dataset.opt, 10);
          if (i === q.correta) {
            b.style.borderColor = 'var(--success, #22c55e)';
            b.style.background = 'rgba(34,197,94,0.12)';
          } else if (i === chosen && !correct) {
            b.style.borderColor = 'var(--danger, #ef4444)';
            b.style.background = 'rgba(239,68,68,0.12)';
          }
          b.style.cursor = 'default';
        });

        const expEl = contentEl.querySelector('[data-exp]');
        expEl.style.display = 'block';
        expEl.innerHTML = `
          <div class="card" style="border-left:4px solid ${correct ? 'var(--success,#22c55e)' : 'var(--danger,#ef4444)'}">
            <p style="font-weight:600;margin:0 0 0.5rem">${correct ? '✅ Correto!' : '❌ Incorreto'}</p>
            <p style="margin:0;line-height:1.6;font-size:0.95rem">${q.explicacao}</p>
          </div>`;

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'btn btn--primary';
        nextBtn.style.cssText = 'width:100%;margin-top:1rem';
        nextBtn.textContent = idx < wrongQuestoes.length - 1 ? 'Próxima →' : 'Finalizar';
        nextBtn.addEventListener('click', () => {
          idx++;
          answered = false;
          if (idx < wrongQuestoes.length) renderWrongQuestion();
          else {
            contentEl.innerHTML = html`
              <div class="empty" style="padding:2rem 0">
                <div class="empty-emoji">🎉</div>
                <h2 class="empty-title">Caderno concluído!</h2>
                <a href="#/estudos" class="btn btn--primary" style="margin-top:1rem">Voltar aos Estudos</a>
              </div>`;
          }
        });
        expEl.appendChild(nextBtn);
      });
    });
  }

  renderWrongQuestion();
  return {};
}
