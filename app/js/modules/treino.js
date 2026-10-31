// treino.js: Treino em Casa – biblioteca, detalhe, programas, construtor (B6.2)
// Views exportadas: main (biblioteca/detalhe), programas, construtor
// Sem efeitos colaterais na importação.

import { EXERCISES, EXERCISES_BY_ID, POSES } from '../../data/exercises.js';
import { PROGRAMS, PROGRAMS_BY_ID } from '../../data/programs.js';
import { repo } from '../repo.js';
import { html, raw, esc, toast } from '../ui.js';
import { uid } from '../utils.js';
import { icon } from '../icons.js';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

const DIFFICULTY_LABEL = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

// Cores de destaque por nível, alinhadas ao tema escuro + amarelo.
// Chips de superfície escura com texto/borda colorida (sem fundo chapado berrante).
const DIFFICULTY_ACCENT = {
  iniciante: '#4ADE80',          // verde suave (texto/borda)
  intermediario: 'var(--accent)', // amarelo/dourado (cor de destaque do app)
  avancado: 'var(--danger)',      // vermelho do tema (#FF6B6B)
};

/** Estilo inline de um chip de dificuldade on-theme (superfície escura + borda esquerda colorida). */
function difficultyBadgeStyle(difficulty) {
  const accent = DIFFICULTY_ACCENT[difficulty] || 'var(--accent)';
  return `display:inline-flex;align-items:center;background:var(--surface);color:var(--text);` +
    `border:1px solid var(--border);border-left:3px solid ${accent};` +
    `font-size:.7rem;font-weight:600;padding:.2em .6em;border-radius:.4em`;
}

function svgFigure(pose) {
  // Bonequinhos (stick-figures) removidos a pedido: não renderiza mais a figura.
  return '';
}

function exerciseCard(ex, faved) {
  return `
    <a href="#/treino/exercicio/${ex.id}" class="exercise-card card" aria-label="${ex.name}">
      <div class="exercise-card__info">
        <div class="exercise-card__name">${ex.name}</div>
        <div class="exercise-card__meta">
          <span class="lvl lvl--${ex.difficulty}">${DIFFICULTY_LABEL[ex.difficulty] || ex.difficulty}</span>
          <span class="text-muted text-small">${ex.muscles.slice(0, 2).join(', ')}</span>
        </div>
      </div>
      <span class="fav-icon" aria-label="${faved ? 'Favorito' : ''}">${faved ? icon('heart', 16) : icon('chevron', 16)}</span>
    </a>`;
}

// ---------------------------------------------------------------------
// View: main (biblioteca de exercícios ou detalhe de um exercício)
// ---------------------------------------------------------------------

export async function main(ctx) {
  const { params } = ctx;

  if (params && params.id) {
    return exercicioDetalhe(ctx, params.id);
  }

  return biblioteca(ctx);
}

// ---------------------------------------------------------------------
// Biblioteca de exercícios
// ---------------------------------------------------------------------

async function biblioteca(ctx) {
  let filter = 'todos';
  let search = '';

  function filtered() {
    let list = EXERCISES;
    if (filter !== 'todos') list = list.filter((e) => e.difficulty === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscles.some((m) => m.toLowerCase().includes(q))
      );
    }
    return list;
  }

  function listHtml() {
    const list = filtered();
    const favIds = repo.favs.list('exercises');
    return list.length === 0
      ? `<div class="empty"><p class="text-muted">Nenhum exercício encontrado.</p></div>`
      : `<div class="exercise-grid">${list.map((e) => exerciseCard(e, favIds.includes(e.id))).join('')}</div>`;
  }

  function render() {
    ctx.el.innerHTML = html`
      <h1 tabindex="-1">Treino em Casa</h1>

      <div class="module-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:1rem">
        <a href="#/treino/programas" class="btn btn--primary">${raw(icon('play', 18))} Programas</a>
        <a href="#/treino/construtor" class="btn btn--ghost">${raw(icon('wrench', 18))} Montar treino</a>
      </div>

      <div class="search-wrap">
        ${raw(icon('search', 18))}
        <input type="search" placeholder="Buscar exercício ou músculo" value="${search}" data-search aria-label="Buscar exercício">
      </div>

      <div class="chip-row" role="group" aria-label="Filtrar por nível">
        ${raw(['todos','iniciante','intermediario','avancado'].map((d) =>
          `<button type="button" class="chip${filter === d ? ' chip--active' : ''}" data-filter="${d}" aria-pressed="${filter === d}">${d === 'todos' ? 'Todos' : DIFFICULTY_LABEL[d]}</button>`
        ).join(''))}
      </div>

      <div data-list>${raw(listHtml())}</div>
    `;

    const listEl = ctx.el.querySelector('[data-list]');

    // Filtros: só troca a lista (sem redesenhar a tela)
    ctx.el.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        ctx.el.querySelectorAll('[data-filter]').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('chip--active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        listEl.innerHTML = listHtml();
      });
    });

    // Busca: atualiza a lista mantendo o foco no campo
    ctx.el.querySelector('[data-search]')?.addEventListener('input', (e) => {
      search = e.target.value;
      listEl.innerHTML = listHtml();
    });
  }

  render();
  return {};
}

// ---------------------------------------------------------------------
// Detalhe de exercício
// ---------------------------------------------------------------------

async function exercicioDetalhe(ctx, id) {
  const ex = EXERCISES_BY_ID[id];

  if (!ex) {
    ctx.el.innerHTML = html`
      <a href="#/treino" class="back-link">${raw(icon('back', 18))} Treino</a>
      <div class="done"><h1 tabindex="-1">Exercício não encontrado</h1><a href="#/treino" class="btn btn--primary">Voltar</a></div>`;
    return {};
  }

  function render(fav) {
    ctx.el.innerHTML = html`
      <a href="#/treino" class="back-link">${raw(icon('back', 18))} Exercícios</a>
      <div class="ex-head">
        <div>
          <span class="lvl lvl--${ex.difficulty}">${DIFFICULTY_LABEL[ex.difficulty] || ex.difficulty}</span>
          <h1 tabindex="-1">${ex.name}</h1>
        </div>
        <button type="button" class="fav-btn${fav ? ' is-on' : ''}" data-fav aria-pressed="${fav}" aria-label="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${raw(icon('heart', 20))}</button>
      </div>
      <div class="tags">${raw(ex.muscles.map((m) => `<span>${esc(m)}</span>`).join(''))}</div>

      <h2 class="section-title">Passo a passo</h2>
      <ol class="steps-list">
        ${raw(ex.steps.map((s, i) => `<li><span>${i + 1}</span><p>${esc(s)}</p></li>`).join(''))}
      </ol>

      <h2 class="section-title">Erros comuns</h2>
      <ul class="errors-list">
        ${raw(ex.errors.map((e) => `<li>${esc(e)}</li>`).join(''))}
      </ul>

      <h2 class="section-title">Variações</h2>
      <div class="var-grid">
        <div class="var-card"><small>Mais fácil</small><p>${ex.variations.easier}</p></div>
        <div class="var-card var-card--hard"><small>Mais difícil</small><p>${ex.variations.harder}</p></div>
      </div>
    `;

    ctx.el.querySelector('[data-fav]')?.addEventListener('click', () => {
      const newFav = repo.favs.toggle('exercises', id);
      render(newFav);
      toast(newFav ? 'Salvo nos favoritos' : 'Removido dos favoritos');
    });
  }

  render(repo.favs.has('exercises', id));
  return {};
}

// ---------------------------------------------------------------------
// View: programas
// ---------------------------------------------------------------------

// Capa de cada programa: cor e ícone
const PROGRAM_THEME = {
  'full-body-iniciante': { c: '#FFD60A', i: 'dumbbell' },
  'hiit-15min': { c: '#FF7A45', i: 'flame' },
  mobilidade: { c: '#4ADE80', i: 'heart' },
  core: { c: '#6BB4FF', i: 'timer' },
  'terceira-idade': { c: '#C084FC', i: 'user' },
};
const BONUS_PROGRAMS = ['mobilidade', 'terceira-idade'];

function programCard(p) {
  const t = PROGRAM_THEME[p.id] || { c: '#FFD60A', i: 'dumbbell' };
  return `
    <a href="#/treino/programas/${p.id}" class="prog" style="--c:${t.c}">
      <span class="prog-cover">${icon(t.i, 26)}${BONUS_PROGRAMS.includes(p.id) ? '<em>Bônus</em>' : ''}</span>
      <span class="prog-body">
        <b>${esc(p.name)}</b>
        <span class="prog-meta"><span>${p.durationMin} min</span><span>${DIFFICULTY_LABEL[p.level] || p.level}</span><span>${p.items.length} exercícios</span></span>
        <span class="prog-desc">${esc(p.description)}</span>
      </span>
    </a>`;
}

export async function programas(ctx) {
  const { params } = ctx;
  if (params && params.id) return programaDetalhe(ctx, params.id);
  return listaProgramas(ctx);
}

async function listaProgramas(ctx) {
  const customList = repo.workouts.listCustom();

  ctx.el.innerHTML = html`
    <a href="#/treino" class="back-link">${raw(icon('back', 18))} Treino</a>
    <h1 tabindex="-1">Programas</h1>
    <p class="page-sub">Escolha um e aperte play: o app guia cada série e descanso.</p>

    <div class="prog-list">${raw(PROGRAMS.map(programCard).join(''))}</div>

    ${customList.length > 0 ? raw(`
      <h2 class="section-title">Meus treinos</h2>
      <div class="subject-list">
        ${customList.map((w) => `
          <a href="#/treino/programas/custom-${w.id}" class="list-item">
            <span class="list-item-icon">${icon('wrench', 20)}</span>
            <span class="list-item-content"><span class="list-item-title">${esc(w.name || 'Treino personalizado')}</span><span class="list-item-subtitle">${w.items ? w.items.length : 0} exercícios</span></span>
            <span class="list-item-action">${icon('chevron', 18)}</span>
          </a>`).join('')}
      </div>`) : ''}

    <a href="#/treino/construtor" class="btn btn--ghost btn--block" style="margin-top:1.25rem">${raw(icon('wrench', 18))} Montar meu treino</a>
  `;
  return {};
}

async function programaDetalhe(ctx, id) {
  let program = null;
  let isCustom = false;

  if (id.startsWith('custom-')) {
    const c = repo.workouts.getCustom(id.slice(7));
    if (c) {
      isCustom = true;
      program = { id: 'custom-' + c.id, name: c.name || 'Treino personalizado', description: '', level: 'personalizado', durationMin: 0, prepareSec: c.prepareSec || 10, items: c.items || [] };
    }
  } else {
    program = PROGRAMS_BY_ID[id] || null;
  }

  if (!program) {
    ctx.el.innerHTML = html`
      <a href="#/treino/programas" class="back-link">${raw(icon('back', 18))} Programas</a>
      <div class="done"><h1 tabindex="-1">Programa não encontrado</h1><a href="#/treino/programas" class="btn btn--primary">Voltar</a></div>`;
    return {};
  }

  const t = PROGRAM_THEME[program.id] || { c: '#FFD60A', i: isCustom ? 'wrench' : 'dumbbell' };
  const exItems = program.items.map((item) => ({ item, ex: EXERCISES_BY_ID[item.exerciseId] }));
  const totalSec = program.items.reduce((s, it) => s + it.sets * (it.workSec + it.restSec), 0);
  const minutes = program.durationMin || Math.max(1, Math.round(totalSec / 60));

  ctx.el.innerHTML = html`
    <a href="#/treino/programas" class="back-link">${raw(icon('back', 18))} Programas</a>
    <div class="prog-hero" style="--c:${t.c}">
      <span class="prog-hero-ico">${raw(icon(t.i, 28))}</span>
      <h1 tabindex="-1">${program.name}</h1>
      ${program.description ? raw(`<p>${esc(program.description)}</p>`) : ''}
      <div class="prog-stats">
        <div><b>${minutes}</b><span>min</span></div>
        <div><b>${program.items.length}</b><span>exercícios</span></div>
        <div><b>${isCustom ? '—' : (DIFFICULTY_LABEL[program.level] || program.level)}</b><span>nível</span></div>
      </div>
    </div>

    <h2 class="section-title">Exercícios</h2>
    <ol class="prog-ex">
      ${raw(exItems.map(({ item, ex }, i) => ex ? `
        <li><a href="#/treino/exercicio/${ex.id}">
          <span class="prog-ex-n">${i + 1}</span>
          <span class="prog-ex-t"><b>${esc(ex.name)}</b><span>${item.sets} séries · ${item.workSec}s de treino · ${item.restSec}s de descanso</span></span>
          ${icon('chevron', 16)}
        </a></li>` : '').join(''))}
    </ol>

    <div class="sticky-action">
      <a href="#/treino/player/${program.id}" class="btn btn--primary btn--block btn--big">${raw(icon('play', 18))} Começar treino</a>
      ${isCustom ? raw(`<button type="button" class="link-danger" data-delete-custom>Excluir este treino</button>`) : ''}
    </div>
  `;

  if (isCustom) {
    ctx.el.querySelector('[data-delete-custom]')?.addEventListener('click', () => {
      repo.workouts.removeCustom(id.slice(7));
      toast('Treino excluído');
      ctx.navigate('#/treino/programas');
    });
  }
  return {};
}

// ---------------------------------------------------------------------
// View: construtor
// ---------------------------------------------------------------------

export async function construtor(ctx) {
  let items = [];
  let workoutName = '';

  function render() {
    ctx.el.innerHTML = html`
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:1rem">
        <a href="#/treino/programas" class="btn btn--small btn--secondary">← Voltar</a>
        <h1 tabindex="-1" style="margin:0;flex:1;font-size:1.25rem">Montar Treino</h1>
      </div>

      <div style="margin-bottom:1rem">
        <label for="workout-name" style="display:block;margin-bottom:.4rem;font-weight:600">Nome do treino</label>
        <input type="text" id="workout-name" class="input" value="${workoutName}" placeholder="Ex.: Treino de segunda" style="width:100%" data-name>
      </div>

      <h2 style="font-size:1rem;margin-bottom:.5rem">Exercícios adicionados (${items.length})</h2>

      ${items.length === 0
        ? raw(`<p class="text-muted text-small" style="margin-bottom:1rem">Nenhum exercício adicionado ainda.</p>`)
        : raw(`<div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem">
          ${items.map((item, i) => {
            const ex = EXERCISES_BY_ID[item.exerciseId];
            return `
              <div class="card" style="display:flex;gap:.75rem;align-items:center;padding:.6rem">
                <div style="flex:1">
                  <div style="font-weight:600">${ex ? ex.name : item.exerciseId}</div>
                  <div class="text-muted text-small">${item.sets} × ${item.workSec}s · descanso ${item.restSec}s</div>
                </div>
                <button type="button" class="btn btn--small btn--secondary" data-remove="${i}" aria-label="Remover">✕</button>
              </div>`;
          }).join('')}
        </div>`)
      }

      <h2 style="font-size:1rem;margin-bottom:.5rem">Adicionar exercício</h2>
      <div class="card" style="margin-bottom:1.5rem">
        <div style="margin-bottom:.75rem">
          <label for="ex-select" style="display:block;margin-bottom:.3rem">Exercício</label>
          <select id="ex-select" class="input" data-ex-select style="width:100%">
            ${raw(EXERCISES.map((e) => `<option value="${e.id}">${e.name}</option>`).join(''))}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;margin-bottom:.75rem">
          <div>
            <label for="sets-in" style="display:block;font-size:.8rem;margin-bottom:.2rem">Séries</label>
            <input type="number" id="sets-in" class="input" value="3" min="1" max="10" data-sets>
          </div>
          <div>
            <label for="work-in" style="display:block;font-size:.8rem;margin-bottom:.2rem">Trabalho (s)</label>
            <input type="number" id="work-in" class="input" value="40" min="10" max="300" data-work>
          </div>
          <div>
            <label for="rest-in" style="display:block;font-size:.8rem;margin-bottom:.2rem">Descanso (s)</label>
            <input type="number" id="rest-in" class="input" value="20" min="5" max="300" data-rest>
          </div>
        </div>
        <button type="button" class="btn btn--secondary" data-add-ex style="width:100%">+ Adicionar</button>
      </div>

      <div style="display:flex;gap:.75rem">
        <button type="button" class="btn btn--primary" data-save style="flex:1" ${items.length === 0 ? 'disabled' : ''}>
          💾 Salvar treino
        </button>
        ${items.length > 0 ? raw(`
          <a href="#/treino/player/builder-preview" class="btn btn--secondary" data-start>
            ▶ Iniciar agora
          </a>
        `) : ''}
      </div>
    `;

    // Name input
    ctx.el.querySelector('[data-name]')?.addEventListener('input', (e) => {
      workoutName = e.target.value;
    });

    // Remove item
    ctx.el.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        items.splice(Number(btn.dataset.remove), 1);
        render();
      });
    });

    // Add exercise
    ctx.el.querySelector('[data-add-ex]')?.addEventListener('click', () => {
      const exId = ctx.el.querySelector('[data-ex-select]')?.value;
      const sets = Math.max(1, Math.min(10, parseInt(ctx.el.querySelector('[data-sets]')?.value || '3', 10)));
      const workSec = Math.max(10, Math.min(300, parseInt(ctx.el.querySelector('[data-work]')?.value || '40', 10)));
      const restSec = Math.max(5, Math.min(300, parseInt(ctx.el.querySelector('[data-rest]')?.value || '20', 10)));
      if (!exId) return;
      items.push({ exerciseId: exId, sets, workSec, restSec });
      render();
    });

    // Save workout
    ctx.el.querySelector('[data-save]')?.addEventListener('click', () => {
      if (items.length === 0) return;
      const name = workoutName.trim() || 'Treino personalizado';
      const saved = repo.workouts.saveCustom({ name, items });
      if (saved) {
        toast('Treino salvo!');
        ctx.navigate('#/treino/programas/custom-' + saved.id);
      } else {
        toast('Limite de treinos personalizados atingido (30).', { type: 'error' });
      }
    });

    // Start now: save a temp program in sessionStorage for the player
    ctx.el.querySelector('[data-start]')?.addEventListener('click', (e) => {
      if (items.length === 0) { e.preventDefault(); return; }
      try {
        sessionStorage.setItem('edf-builder-preview', JSON.stringify({
          id: 'builder-preview',
          name: workoutName.trim() || 'Treino personalizado',
          prepareSec: 10,
          items,
        }));
      } catch (_) {}
    });
  }

  render();
  return {};
}
