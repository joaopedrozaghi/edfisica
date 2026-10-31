// estudos.js: Estudos para Prova — lista de matérias, resumo, flashcards e quiz (B6.0)
// Sem efeitos colaterais na importação

import { repo } from '../repo.js';
import { html, raw, esc } from '../ui.js';
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
// View de matéria (abas: resumo | flashcards | quiz)
// ─────────────────────────────────────────────────────────────────────

const TAB_LABELS = { resumo: 'Resumo', flashcards: 'Flashcards', quiz: 'Quiz' };

function renderSubject(ctx, subject, activeTab) {
  const studyData = repo.study.get();
  const quiz = studyData.quiz[subject.id] || { answered: 0, correct: 0 };
  const pct = quiz.answered ? Math.round((quiz.correct / quiz.answered) * 100) : null;
  const tabs = ['resumo', 'flashcards', 'quiz'];
  const tabIdx = tabs.indexOf(activeTab);

  ctx.el.innerHTML = html`
    <a href="#/estudos" class="back-link">${raw(icon('back', 18))} Matérias</a>
    <div class="subj-head">
      <span class="subj-ico">${raw(icon(SUBJECT_ICON[subject.id] || 'book', 24))}</span>
      <div>
        <h1 tabindex="-1">${subject.title}</h1>
        <p class="subj-meta">${subject.flashcards.length} flashcards · ${subject.questoes.length} questões${pct !== null ? ` · ${pct}% de acerto` : ''}</p>
      </div>
    </div>

    <div class="seg" role="tablist" style="--n:3;--i:${tabIdx}">
      ${raw(tabs.map((t) => `<button type="button" role="tab" aria-selected="${t === activeTab}" data-tab="${t}">${TAB_LABELS[t]}</button>`).join(''))}
      <span class="seg-ind" aria-hidden="true"></span>
    </div>

    <div data-tab-content></div>
  `;

  ctx.el.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => ctx.navigate(`#/estudos/${subject.id}?tab=${btn.dataset.tab}`));
  });

  const contentEl = ctx.el.querySelector('[data-tab-content]');
  if (activeTab === 'resumo') renderResumo(contentEl, subject);
  else if (activeTab === 'flashcards') renderFlashcards(contentEl, subject);
  else renderQuiz(contentEl, subject);

  return {};
}

// ─────────────────────────────────────────────────────────────────────
// Resumo: introdução em destaque, parágrafos curtos e pontos-chave
// ─────────────────────────────────────────────────────────────────────

function splitSentences(text) {
  return String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9(])/);
}

function renderResumo(el, subject) {
  const sentences = splitSentences(subject.resumo);
  const lead = sentences.shift() || '';
  const paras = [];
  for (let i = 0; i < sentences.length; i += 2) paras.push(sentences.slice(i, i + 2).join(' '));
  const minutes = Math.max(1, Math.round(String(subject.resumo).split(/\s+/).length / 180));

  el.innerHTML = html`
    <p class="read-time">${raw(icon('timer', 14))} Leitura de ${minutes} min</p>
    <p class="resumo-lead">${lead}</p>
    <div class="resumo-body">
      ${raw(paras.map((p) => `<p>${esc(p)}</p>`).join(''))}
    </div>

    <h2 class="section-title">Pontos-chave</h2>
    <ol class="keypoints">
      ${raw(subject.pontosChave.map((pt, i) => `<li><span>${i + 1}</span><p>${esc(pt)}</p></li>`).join(''))}
    </ol>

    <div class="practice">
      <p>Agora fixe o conteúdo:</p>
      <div class="practice-row">
        <a href="#/estudos/${subject.id}?tab=flashcards" class="btn btn--ghost">${raw(icon('cards', 18))} Flashcards</a>
        <a href="#/estudos/${subject.id}?tab=quiz" class="btn btn--primary">${raw(icon('clipboard', 18))} Fazer quiz</a>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────
// Flashcards: cartão que vira em 3D, Errei/Acertei (Leitner)
// ─────────────────────────────────────────────────────────────────────

function renderFlashcards(el, subject) {
  const cards = subject.flashcards;
  let idx = 0;
  let right = 0;

  function render() {
    const card = cards[idx];
    el.innerHTML = html`
      <div class="run-top"><span>Cartão ${idx + 1} de ${cards.length}</span><span>${right} acertos</span></div>
      <div class="run-bar"><i style="width:${(idx / cards.length) * 100}%"></i></div>

      <button type="button" class="fc" data-flashcard aria-label="Virar o cartão">
        <span class="fc-in">
          <span class="fc-face">
            <span class="fc-lbl">Pergunta</span>
            <span class="fc-txt">${card.frente}</span>
            <span class="fc-hint">${raw(icon('cards', 14))} Toque para ver a resposta</span>
          </span>
          <span class="fc-face fc-back">
            <span class="fc-lbl fc-lbl--y">Resposta</span>
            <span class="fc-txt fc-txt--a">${card.verso}</span>
          </span>
        </span>
      </button>

      <div class="grade" data-grade-row hidden>
        <button type="button" data-grade="wrong" class="grade-btn grade-btn--no">Errei</button>
        <button type="button" data-grade="right" class="grade-btn grade-btn--yes">Acertei</button>
      </div>
      <p class="grade-help" data-grade-help>Pense na resposta e toque no cartão.</p>

      <div class="run-nav">
        <button type="button" data-prev class="btn btn--ghost btn--small" ${idx === 0 ? 'disabled' : ''}>${raw(icon('back', 16))} Anterior</button>
        <button type="button" data-next class="btn btn--ghost btn--small" ${idx === cards.length - 1 ? 'disabled' : ''}>Pular ${raw(icon('chevron', 16))}</button>
      </div>
    `;

    const fc = el.querySelector('[data-flashcard]');
    fc.addEventListener('click', () => {
      const on = fc.classList.toggle('is-flipped');
      el.querySelector('[data-grade-row]').hidden = !on;
      el.querySelector('[data-grade-help]').hidden = on;
    });

    const advance = () => {
      if (idx < cards.length - 1) { idx++; render(); return; }
      repo.study.finishSession({ kind: 'flashcards', subjectId: subject.id, count: cards.length });
      el.innerHTML = html`
        <div class="done">
          ${raw(scoreRing(right, cards.length))}
          <h2>Rodada concluída</h2>
          <p class="text-muted">Você acertou ${right} de ${cards.length} cartões. Os que errou voltam com mais frequência.</p>
          <div class="practice-row">
            <button type="button" data-restart class="btn btn--ghost">Recomeçar</button>
            <a href="#/estudos/${subject.id}?tab=quiz" class="btn btn--primary">Fazer quiz</a>
          </div>
        </div>`;
      el.querySelector('[data-restart]')?.addEventListener('click', () => { idx = 0; right = 0; render(); });
    };

    el.querySelector('[data-grade="wrong"]')?.addEventListener('click', () => {
      repo.study.gradeCard(card.id, false);
      advance();
    });
    el.querySelector('[data-grade="right"]')?.addEventListener('click', () => {
      repo.study.gradeCard(card.id, true);
      right++;
      advance();
    });
    el.querySelector('[data-prev]')?.addEventListener('click', () => { if (idx > 0) { idx--; render(); } });
    el.querySelector('[data-next]')?.addEventListener('click', () => { if (idx < cards.length - 1) { idx++; render(); } });
  }

  render();
}

// ─────────────────────────────────────────────────────────────────────
// Quiz e caderno de erros (mesmo componente)
// ─────────────────────────────────────────────────────────────────────

function scoreRing(score, total) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const C = 2 * Math.PI * 46;
  return `
    <div class="score-ring">
      <svg viewBox="0 0 108 108" aria-hidden="true"><circle cx="54" cy="54" r="46" class="trk"/><circle cx="54" cy="54" r="46" class="val" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - pct / 100)).toFixed(1)}"/></svg>
      <div><b>${pct}%</b><span>${score}/${total}</span></div>
    </div>`;
}

/**
 * Roda uma lista de questões. opts: { subjectIdOf(q), labelOf(q), onFinish(score), finishHtml(score) }
 */
function runQuestions(el, questoes, opts) {
  let idx = 0;
  let score = 0;

  function renderQuestion() {
    const q = questoes[idx];
    el.innerHTML = html`
      <div class="run-top"><span>Questão ${idx + 1} de ${questoes.length}</span><span>${opts.labelOf ? opts.labelOf(q) : `${score} acertos`}</span></div>
      <div class="run-bar"><i style="width:${(idx / questoes.length) * 100}%"></i></div>
      <p class="q-text">${q.texto}</p>
      <div class="opts">
        ${raw(q.opcoes.map((op, i) => `<button type="button" class="opt" data-opt="${i}"><span class="opt-l">${String.fromCharCode(65 + i)}</span><span class="opt-t">${esc(op)}</span></button>`).join(''))}
      </div>
      <div data-explanation></div>
    `;

    el.querySelectorAll('[data-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (el.querySelector('.opts.is-locked')) return;
        el.querySelector('.opts').classList.add('is-locked');
        const chosen = parseInt(btn.dataset.opt, 10);
        const correct = chosen === q.correta;
        if (correct) score++;
        repo.study.recordAnswer(opts.subjectIdOf(q), q.id, correct);

        el.querySelectorAll('[data-opt]').forEach((b) => {
          const i = parseInt(b.dataset.opt, 10);
          if (i === q.correta) b.classList.add('is-right');
          else if (i === chosen) b.classList.add('is-wrong');
          else b.classList.add('is-dim');
        });
        if (navigator.vibrate) navigator.vibrate(correct ? 15 : [20, 40, 20]);

        const exp = el.querySelector('[data-explanation]');
        exp.innerHTML = `
          <div class="explain ${correct ? 'explain--ok' : 'explain--no'}">
            <b>${correct ? 'Certo!' : 'Não foi dessa vez'}</b>
            <p>${esc(q.explicacao)}</p>
          </div>
          <button type="button" class="btn btn--primary btn--block" data-next-q>${idx < questoes.length - 1 ? 'Próxima questão' : 'Ver resultado'}</button>`;
        exp.querySelector('[data-next-q]').addEventListener('click', () => {
          idx++;
          if (idx < questoes.length) renderQuestion();
          else finish();
        });
        exp.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  function finish() {
    if (opts.onFinish) opts.onFinish(score);
    el.innerHTML = `<div class="done">${scoreRing(score, questoes.length)}${opts.finishHtml(score)}</div>`;
    el.querySelector('[data-restart]')?.addEventListener('click', () => { idx = 0; score = 0; renderQuestion(); });
  }

  renderQuestion();
}

function renderQuiz(el, subject) {
  runQuestions(el, subject.questoes, {
    subjectIdOf: () => subject.id,
    onFinish: () => repo.study.finishSession({ kind: 'quiz', subjectId: subject.id, count: subject.questoes.length }),
    finishHtml: (score) => {
      const pct = Math.round((score / subject.questoes.length) * 100);
      const msg = pct >= 80 ? 'Mandou muito bem. Você está pronto para essa matéria.' : pct >= 60 ? 'Bom resultado. Revise os erros e tente de novo.' : 'Leia o resumo de novo e refaça: a segunda vez rende muito mais.';
      return `<h2>Quiz concluído</h2><p class="text-muted">${msg}</p>
        <div class="practice-row">
          <button type="button" data-restart class="btn btn--ghost">Refazer</button>
          <a href="#/estudos/caderno" class="btn btn--primary">Revisar erros</a>
        </div>`;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// Caderno de erros
// ─────────────────────────────────────────────────────────────────────

export async function caderno(ctx) {
  const wrongList = repo.study.wrongList();

  if (wrongList.length === 0) {
    ctx.el.innerHTML = html`
      <a href="#/estudos" class="back-link">${raw(icon('back', 18))} Estudos</a>
      <div class="done">
        <span class="done-ico">${raw(icon('notebook', 28))}</span>
        <h1 tabindex="-1">Caderno de erros vazio</h1>
        <p class="text-muted">Quando você errar uma questão, ela aparece aqui para revisar até acertar.</p>
        <a href="#/estudos" class="btn btn--primary">Ir para Estudos</a>
      </div>`;
    return {};
  }

  const allSubjects = await Promise.all(Object.keys(LOADERS).map(async (k) => (await LOADERS[k]()).subject));
  const qMap = {};
  for (const s of allSubjects) {
    for (const q of s.questoes) qMap[q.id] = { ...q, subjectTitle: s.title, subjectId: s.id };
  }
  const wrongQuestoes = wrongList.map((w) => qMap[w.qid]).filter(Boolean);

  ctx.el.innerHTML = html`
    <a href="#/estudos" class="back-link">${raw(icon('back', 18))} Estudos</a>
    <h1 tabindex="-1">Caderno de erros</h1>
    <p class="page-sub">${wrongQuestoes.length} ${wrongQuestoes.length === 1 ? 'questão' : 'questões'} para revisar. Acertou, sai da lista.</p>
    <div data-caderno-content></div>
  `;

  runQuestions(ctx.el.querySelector('[data-caderno-content]'), wrongQuestoes, {
    subjectIdOf: (q) => q.subjectId,
    labelOf: (q) => q.subjectTitle,
    finishHtml: () => `<h2>Revisão concluída</h2><p class="text-muted">As que você acertou saíram do caderno.</p>
      <div class="practice-row"><a href="#/estudos/caderno" class="btn btn--ghost">Revisar de novo</a><a href="#/estudos" class="btn btn--primary">Voltar</a></div>`,
  });
  return {};
}
