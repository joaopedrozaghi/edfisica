// dieta.js: Dieta + Calculadora de Alimentos (FR-8)
// Views: main (diário), metas (calculadora de metas), planos (planos prontos)
// Sem efeitos colaterais na importação

import { repo, MEALS } from '../repo.js';
import { icon } from '../icons.js';
import { html, raw, toast, openSheet, closeSheet } from '../ui.js';
import { ring, donut } from '../charts.js';
import { dateKey, addDays, labelShort, normalize, parseNum, parseIntBR, fmtInt, fmt1 } from '../utils.js';
import * as calc from '../calc.js';

// Cores de macros
const MACRO_COLORS = { prot: '#4ade80', carb: '#60a5fa', gord: '#f97316' };

// Carrega alimentos de forma lazy (cached após 1ª importação)
let _foods = null;
let _foodsById = null;
async function getFoods() {
  if (!_foods) {
    const m = await import('../../data/foods.js');
    _foods = m.FOODS;
    _foodsById = m.FOODS_BY_ID;
  }
  return { foods: _foods, foodsById: _foodsById };
}

// ── Helper: totais do dia ─────────────────────────────────────────────────

function computeTotals(dayData, foodsById) {
  const all = [];
  for (const meal of MEALS) {
    const entries = dayData.meals[meal.key] || [];
    for (const e of entries) all.push(e);
  }
  return calc.foodTotals(all, foodsById);
}

// ── Renderiza um anel de macro (ring pequeno) ─────────────────────────────

function macroRing(value, max, color, label) {
  const radius = 26;
  const stroke = 6;
  const size = (radius + stroke) * 2;
  const c = size / 2;
  const circ = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(1, value / max) : 0;
  const offset = circ * (1 - progress);
  return `
    <div class="macro-ring">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${c}" cy="${c}" r="${radius}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
        <circle cx="${c}" cy="${c}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
          transform="rotate(-90 ${c} ${c})"/>
        <text x="${c}" y="${c + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text)">${Math.round(value)}</text>
      </svg>
      <div class="macro-ring-label">${label}</div>
    </div>
  `;
}

// ── VIEW PRINCIPAL: diário ─────────────────────────────────────────────────

export async function main(ctx) {
  const { foods, foodsById } = await getFoods();

  const todayKey = dateKey();
  let currentDate = ctx.query.d || todayKey;
  // Valida a data: só aceita os últimos 60 dias
  if (!/^\d{4}-\d{2}-\d{2}$/.test(currentDate) || currentDate > todayKey) {
    currentDate = todayKey;
  }

  const targets = repo.diet.getTargets();
  const waterGoal = repo.habits.waterGoal();

  function render() {
    const dayData = repo.diet.getDay(currentDate);
    const habitDay = repo.habits.getDay(currentDate);
    const totals = computeTotals(dayData, foodsById);
    const isToday = currentDate === todayKey;
    const dateLabel = isToday ? 'Hoje' : labelShort(currentDate);

    const kcalTarget = targets ? targets.kcal : 0;
    const kcalConsumed = Math.round(totals.kcal);

    const protTarget = targets ? targets.prot : 0;
    const carbTarget = targets ? targets.carb : 0;
    const gordTarget = targets ? targets.gord : 0;

    ctx.el.innerHTML = html`
      <div class="dieta-header">
        <button type="button" class="btn btn--ghost btn--small" data-prev-day aria-label="Dia anterior">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4l-6 6 6 6"/></svg>
        </button>
        <h1 style="font-size:1.25rem;margin:0" tabindex="-1">${dateLabel}</h1>
        <button type="button" class="btn btn--ghost btn--small" data-next-day aria-label="Próximo dia" ${isToday ? 'disabled' : ''}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4l6 6-6 6"/></svg>
        </button>
      </div>

      <div class="diet-sum">
        <div class="diet-ring">
          ${raw(ring(kcalConsumed, kcalTarget || 2000, { size: 104, strokeWidth: 10, label: String(kcalConsumed), sublabel: kcalTarget ? 'de ' + fmtInt(kcalTarget) : 'kcal' }))}
        </div>
        <div class="diet-macros">
          ${raw([
            ['Proteínas', totals.prot, protTarget, MACRO_COLORS.prot],
            ['Carboidratos', totals.carb, carbTarget, MACRO_COLORS.carb],
            ['Gorduras', totals.gord, gordTarget, MACRO_COLORS.gord],
          ].map(([label, val, tgt, color]) => `
            <div class="diet-macro">
              <p><span>${label}</span><span>${Math.round(val)}${tgt ? ' / ' + Math.round(tgt) : ''} g</span></p>
              <div class="diet-bar"><i style="width:${tgt ? Math.min(100, (val / tgt) * 100) : 0}%;background:${color}"></i></div>
            </div>`).join(''))}
          ${!targets ? raw(`<a class="today-link" href="#/dieta/metas">Definir metas →</a>`) : ''}
        </div>
      </div>
      <div class="water" style="margin-bottom:1rem">
        <div class="water-ico">${raw(icon('droplet', 20))}</div>
        <div class="water-main">
          <div class="water-top"><strong>Água</strong><span>${habitDay.waterMl} / ${waterGoal.ml} ml</span></div>
          <div class="water-bar"><b style="width:${Math.min(100, (habitDay.waterMl / waterGoal.ml) * 100)}%"></b></div>
        </div>
      </div>

      ${raw(MEALS.map(meal => {
        const entries = dayData.meals[meal.key] || [];
        return `
          <div class="card mb-1">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
              <h2 style="font-size:1rem;margin:0">${meal.label}</h2>
              <button type="button" class="add-btn" data-add-meal="${meal.key}" aria-label="Adicionar alimento em ${meal.label}">${icon('plus', 18)}</button>
            </div>
            ${entries.length === 0
              ? '<p class="text-muted text-small">Toque em + para registrar</p>'
              : entries.map(e => {
                  const f = foodsById[e.foodId];
                  if (!f) return '';
                  const entryKcal = Math.round(f.kcal * e.grams / 100);
                  const portionLabel = e.portion ? `${e.portion.label}` : `${Math.round(e.grams)} g`;
                  return `
                    <div class="list-item list-item--compact" style="padding:0.5rem 0;border-bottom:1px solid var(--border)">
                      <div class="list-item-content" style="margin-left:0">
                        <div class="list-item-title" style="font-size:0.9rem">${f.name}</div>
                        <div class="list-item-subtitle">${portionLabel} · ${entryKcal} kcal</div>
                      </div>
                      <button type="button" class="btn btn--ghost btn--small" data-remove-entry data-meal="${meal.key}" data-id="${e.id}" aria-label="Remover ${f.name}">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5L15 15M15 5L5 15"/></svg>
                      </button>
                    </div>
                  `;
                }).join('')
            }
          </div>
        `;
      }).join(''))}

      <div class="card mb-2">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">Fibras</h2>
        <div style="display:flex;gap:1rem">
          <div>
            <div style="font-size:1.5rem;font-weight:700">${fmt1(totals.fibra)}<span style="font-size:0.875rem;font-weight:400"> g</span></div>
            <div class="text-muted text-small">consumidas</div>
          </div>
          <div>
            <div style="font-size:1.5rem;font-weight:700">25<span style="font-size:0.875rem;font-weight:400"> g</span></div>
            <div class="text-muted text-small">meta diária</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:2rem">
        <a href="#/dieta/metas" class="btn btn--secondary">⚙️ Metas</a>
        <a href="#/dieta/planos" class="btn btn--secondary">📋 Planos prontos</a>
      </div>

      <p class="text-small text-muted" style="text-align:center;margin-bottom:2rem">
        ⚠️ Este app não substitui a avaliação de um nutricionista.
      </p>
    `;

    // Navegação de dia
    ctx.el.querySelector('[data-prev-day]').addEventListener('click', () => {
      const prev = addDays(currentDate, -1);
      currentDate = prev;
      render();
    });
    ctx.el.querySelector('[data-next-day]').addEventListener('click', () => {
      if (currentDate < todayKey) {
        currentDate = addDays(currentDate, 1);
        render();
      }
    });

    // Remover entrada
    ctx.el.querySelectorAll('[data-remove-entry]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mealKey = btn.dataset.meal;
        const id = btn.dataset.id;
        repo.diet.removeEntry(currentDate, mealKey, id);
        render();
      });
    });

    // Adicionar alimento — abre sheet de busca
    ctx.el.querySelectorAll('[data-add-meal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mealKey = btn.dataset.addMeal;
        openAddSheet(mealKey, currentDate, foods, foodsById, () => render());
      });
    });
  }

  render();
  return {};
}

// ── Sheet de adição de alimento ─────────────────────────────────────────────

function openAddSheet(mealKey, date, foods, foodsById, onAdded) {
  const mealLabel = MEALS.find(m => m.key === mealKey)?.label || mealKey;

  openSheet(buildSearchSheetHTML(), { title: `Adicionar em ${mealLabel}` });

  // openSheet insere o conteúdo em .sheet-body; pegamos esse elemento para ligar os eventos.
  const el = document.querySelector('.sheet .sheet-body');
  if (el) {
    (function setup() {
      const input = el.querySelector('[data-food-search]');
      const results = el.querySelector('[data-search-results]');
      const addForm = el.querySelector('[data-add-form]');
      let selectedFood = null;

      function search(q) {
        const norm = normalize(q);
        if (!norm) {
          results.innerHTML = buildRecentHTML(foodsById);
          return;
        }
        const matches = foods.filter(f => normalize(f.name).includes(norm)).slice(0, 12);
        results.innerHTML = matches.length === 0
          ? '<p class="text-muted text-small">Nenhum alimento encontrado</p>'
          : matches.map(f => `
              <button type="button" class="list-item list-item--compact" data-food-id="${f.id}" style="width:100%;text-align:left">
                <div class="list-item-content" style="margin-left:0">
                  <div class="list-item-title" style="font-size:0.9rem">${f.name}</div>
                  <div class="list-item-subtitle">${Math.round(f.kcal)} kcal/100 g · ${f.prot} g prot</div>
                </div>
              </button>
            `).join('');
        bindFoodButtons();
      }

      function buildRecentHTML(fbId) {
        const recentIds = repo.diet.recentFoodIds(6);
        if (recentIds.length === 0) {
          return '<p class="text-muted text-small">Digite para buscar alimentos</p>';
        }
        return '<p class="text-small text-muted" style="margin-bottom:0.5rem">Recentes:</p>' +
          recentIds.map(id => {
            const f = fbId[id];
            if (!f) return '';
            return `<button type="button" class="list-item list-item--compact" data-food-id="${f.id}" style="width:100%;text-align:left">
              <div class="list-item-content" style="margin-left:0">
                <div class="list-item-title" style="font-size:0.9rem">${f.name}</div>
                <div class="list-item-subtitle">${Math.round(f.kcal)} kcal/100 g</div>
              </div>
            </button>`;
          }).join('');
      }

      function bindFoodButtons() {
        results.querySelectorAll('[data-food-id]').forEach(btn => {
          btn.addEventListener('click', () => {
            selectedFood = foodsById[btn.dataset.foodId];
            if (!selectedFood) return;
            showAddForm(selectedFood);
          });
        });
      }

      function showAddForm(food) {
        addForm.innerHTML = `
          <h3 style="font-size:1rem;margin-bottom:0.5rem">${food.name}</h3>
          <p class="text-small text-muted" style="margin-bottom:1rem">
            Por 100 g: ${Math.round(food.kcal)} kcal · ${food.prot} g prot · ${food.carb} g carb · ${food.gord} g gord
          </p>
          <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
            <button type="button" class="btn btn--small ${!el._portionMode ? 'btn--primary' : 'btn--secondary'}" data-mode-grams>Por gramas</button>
            <button type="button" class="btn btn--small ${el._portionMode ? 'btn--primary' : 'btn--secondary'}" data-mode-portion>Por porção</button>
          </div>
          <div data-input-grams ${el._portionMode ? 'style="display:none"' : ''}>
            <label class="text-small" for="qty-grams">Quantidade (g)</label>
            <input type="text" id="qty-grams" inputmode="numeric" value="100" style="margin-top:0.25rem;margin-bottom:0.75rem;width:100%">
          </div>
          <div data-input-portion ${!el._portionMode ? 'style="display:none"' : ''}>
            <label class="text-small" for="qty-portion">Porção</label>
            <select id="qty-portion" style="margin-top:0.25rem;margin-bottom:0.5rem;width:100%">
              ${food.portions.map((p, i) => `<option value="${i}">${p.label}</option>`).join('')}
            </select>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
              <span class="text-small text-muted">Quantidade:</span>
              <button type="button" class="btn btn--ghost btn--small" data-portion-dec>−</button>
              <span data-portion-qty style="min-width:2ch;text-align:center">1</span>
              <button type="button" class="btn btn--ghost btn--small" data-portion-inc>+</button>
            </div>
          </div>
          <div data-kcal-preview class="text-small text-muted" style="margin-bottom:0.75rem"></div>
          <button type="button" class="btn btn--primary" style="width:100%" data-confirm-add>Adicionar</button>
        `;

        el._portionMode = el._portionMode || false;
        let portionQty = 1;

        function updatePreview() {
          const prev = addForm.querySelector('[data-kcal-preview]');
          if (!prev) return;
          let g = 0;
          if (el._portionMode) {
            const selEl = addForm.querySelector('#qty-portion');
            if (!selEl) return;
            const idx = parseInt(selEl.value, 10);
            const portion = food.portions[idx];
            if (portion) g = portion.g * portionQty;
          } else {
            const gramsEl = addForm.querySelector('#qty-grams');
            if (!gramsEl) return;
            g = parseIntBR(gramsEl.value);
            if (isNaN(g)) g = 0;
          }
          const kcal = Math.round(food.kcal * g / 100);
          prev.textContent = g > 0 ? `≈ ${kcal} kcal (${Math.round(g)} g)` : '';
        }

        addForm.querySelector('[data-mode-grams]').addEventListener('click', () => {
          el._portionMode = false;
          showAddForm(food);
        });
        addForm.querySelector('[data-mode-portion]').addEventListener('click', () => {
          el._portionMode = true;
          showAddForm(food);
        });
        addForm.querySelector('#qty-grams')?.addEventListener('input', updatePreview);
        addForm.querySelector('#qty-portion')?.addEventListener('change', updatePreview);
        addForm.querySelector('[data-portion-dec]')?.addEventListener('click', () => {
          if (portionQty > 0.5) portionQty = Math.round((portionQty - 0.5) * 10) / 10;
          const span = addForm.querySelector('[data-portion-qty]');
          if (span) span.textContent = portionQty;
          updatePreview();
        });
        addForm.querySelector('[data-portion-inc]')?.addEventListener('click', () => {
          portionQty = Math.round((portionQty + 0.5) * 10) / 10;
          const span = addForm.querySelector('[data-portion-qty]');
          if (span) span.textContent = portionQty;
          updatePreview();
        });

        addForm.querySelector('[data-confirm-add]').addEventListener('click', () => {
          try {
            if (el._portionMode) {
              const selEl = addForm.querySelector('#qty-portion');
              const idx = parseInt(selEl.value, 10);
              const portion = food.portions[idx];
              if (!portion) { toast('Porção inválida', { type: 'error' }); return; }
              repo.diet.addEntry(date, mealKey, {
                foodId: food.id,
                portion: { label: portion.label, g: portion.g, qty: portionQty },
              });
            } else {
              const gramsEl = addForm.querySelector('#qty-grams');
              const g = parseIntBR(gramsEl.value);
              if (isNaN(g) || g <= 0) { toast('Informe uma quantidade válida', { type: 'error' }); return; }
              repo.diet.addEntry(date, mealKey, { foodId: food.id, grams: g });
            }
            toast(`${food.name} adicionado`, { type: 'success' });
            closeSheet();
            onAdded();
          } catch (err) {
            toast('Erro ao adicionar alimento', { type: 'error' });
          }
        });

        updatePreview();
      }

      // Init
      results.innerHTML = buildRecentHTML(foodsById);
      bindFoodButtons();

      // Debounced search
      let searchTimer = null;
      input.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => search(input.value), 250);
      });
    })();
  }
}

function buildSearchSheetHTML() {
  return `
    <div style="margin-bottom:1rem">
      <input type="search" data-food-search placeholder="Buscar alimento…" autocomplete="off"
        style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)">
    </div>
    <div data-search-results style="max-height:220px;overflow-y:auto;margin-bottom:1rem"></div>
    <div data-add-form></div>
  `;
}

// ── VIEW: Metas / Calculadora ──────────────────────────────────────────────

export async function metas(ctx) {
  const profile = repo.profile.get();
  const targets = repo.diet.getTargets();

  function calcAuto() {
    if (!profile.sex || !profile.weightKg || !profile.heightCm || !profile.age) return null;
    try {
      const bmrVal = calc.bmr({ sex: profile.sex, kg: profile.weightKg, cm: profile.heightCm, age: profile.age });
      const act = profile.activity || 'sedentario';
      const tdeeVal = calc.tdee(bmrVal, act);
      const goal = profile.goal || 'manter';
      const { kcal, floored } = calc.goalCalories(tdeeVal, goal, bmrVal);
      const macros = calc.macroTargets({ kcal, kg: profile.weightKg, goal });
      const water = calc.waterMl(profile.weightKg);
      return { bmr: Math.round(bmrVal), tdee: Math.round(tdeeVal), kcal, macros, water, floored, goal, act };
    } catch (e) {
      return null;
    }
  }

  let autoCalc = calcAuto();

  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Metas de Dieta</h1>

    ${!profile.sex || !profile.weightKg || !profile.heightCm || !profile.age ? raw(`
      <div class="banner">
        <div class="banner-content">
          <div class="banner-title">Perfil incompleto</div>
          <p class="banner-text">Complete seus dados para calcular suas metas automaticamente.</p>
        </div>
        <a href="#/perfil" class="btn btn--small btn--primary">Completar perfil</a>
      </div>
    `) : ''}

    <div class="card mb-1">
      <h2 style="font-size:1rem;margin-bottom:1rem">Calculadora de Metas (Mifflin-St Jeor)</h2>

      <div class="field">
        <label for="mc-sex">Sexo</label>
        <select id="mc-sex">
          <option value="">—</option>
          <option value="M" ${profile.sex === 'M' ? 'selected' : ''}>Masculino</option>
          <option value="F" ${profile.sex === 'F' ? 'selected' : ''}>Feminino</option>
        </select>
      </div>
      <div class="field">
        <label for="mc-age">Idade (anos)</label>
        <input type="text" id="mc-age" inputmode="numeric" value="${profile.age ?? ''}">
      </div>
      <div class="field">
        <label for="mc-weight">Peso (kg)</label>
        <input type="text" id="mc-weight" inputmode="decimal" value="${profile.weightKg ?? ''}">
      </div>
      <div class="field">
        <label for="mc-height">Altura (cm)</label>
        <input type="text" id="mc-height" inputmode="numeric" value="${profile.heightCm ?? ''}">
      </div>
      <div class="field">
        <label for="mc-activity">Nível de atividade</label>
        <select id="mc-activity">
          <option value="sedentario" ${(profile.activity || 'sedentario') === 'sedentario' ? 'selected' : ''}>Sedentário (sem exercício)</option>
          <option value="leve" ${profile.activity === 'leve' ? 'selected' : ''}>Leve (1–3 dias/semana)</option>
          <option value="moderado" ${profile.activity === 'moderado' ? 'selected' : ''}>Moderado (3–5 dias/semana)</option>
          <option value="intenso" ${profile.activity === 'intenso' ? 'selected' : ''}>Intenso (6–7 dias/semana)</option>
          <option value="muito_intenso" ${profile.activity === 'muito_intenso' ? 'selected' : ''}>Muito intenso (2× ao dia)</option>
        </select>
      </div>
      <div class="field">
        <label for="mc-goal">Objetivo</label>
        <select id="mc-goal">
          <option value="perder" ${(profile.goal || 'manter') === 'perder' ? 'selected' : ''}>Emagrecer (−20% kcal)</option>
          <option value="manter" ${(profile.goal || 'manter') === 'manter' ? 'selected' : ''}>Manter o peso</option>
          <option value="ganhar" ${(profile.goal || 'manter') === 'ganhar' ? 'selected' : ''}>Ganhar massa (+10% kcal)</option>
        </select>
      </div>

      <button type="button" class="btn btn--primary" style="width:100%;margin-top:0.5rem" data-calc-btn>Calcular</button>
    </div>

    <div data-calc-result style="margin-bottom:1.5rem"></div>

    ${targets ? raw(`
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:0.75rem">Metas atuais</h2>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem">
          <div class="stat"><div class="stat-value" style="font-size:1.5rem">${fmtInt(targets.kcal)}</div><div class="stat-label">kcal/dia</div></div>
          <div class="stat"><div class="stat-value" style="font-size:1.5rem">${targets.prot}g</div><div class="stat-label">Proteína</div></div>
          <div class="stat"><div class="stat-value" style="font-size:1.5rem">${targets.carb}g</div><div class="stat-label">Carboidrato</div></div>
          <div class="stat"><div class="stat-value" style="font-size:1.5rem">${targets.gord}g</div><div class="stat-label">Gordura</div></div>
        </div>
        ${targets.bmr ? `<p class="text-small text-muted" style="margin-top:0.75rem">TMB: ${fmtInt(targets.bmr)} kcal · GET: ${fmtInt(targets.tdee)} kcal</p>` : ''}
      </div>
    `) : ''}

    <p class="text-small text-muted" style="text-align:center;margin-bottom:2rem">
      ⚠️ Este cálculo é uma estimativa. Consulte um nutricionista para orientação personalizada.
    </p>
  `;

  const calcBtn = ctx.el.querySelector('[data-calc-btn]');
  const resultEl = ctx.el.querySelector('[data-calc-result]');

  calcBtn.addEventListener('click', () => {
    const sex = ctx.el.querySelector('#mc-sex').value;
    const age = parseIntBR(ctx.el.querySelector('#mc-age').value);
    const weight = parseNum(ctx.el.querySelector('#mc-weight').value);
    const height = parseIntBR(ctx.el.querySelector('#mc-height').value);
    const activity = ctx.el.querySelector('#mc-activity').value;
    const goal = ctx.el.querySelector('#mc-goal').value;

    if (!sex || isNaN(age) || isNaN(weight) || isNaN(height) || age <= 0 || weight <= 0 || height <= 0) {
      toast('Preencha todos os campos corretamente', { type: 'error' });
      return;
    }

    try {
      const bmrVal = calc.bmr({ sex, kg: weight, cm: height, age });
      const tdeeVal = calc.tdee(bmrVal, activity);
      const { kcal, floored } = calc.goalCalories(tdeeVal, goal, bmrVal);
      const macros = calc.macroTargets({ kcal, kg: weight, goal });
      const water = calc.waterMl(weight);

      resultEl.innerHTML = `
        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:0.75rem">Resultado</h3>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem;margin-bottom:0.75rem">
            <div class="stat"><div class="stat-value" style="font-size:1.5rem">${fmtInt(Math.round(bmrVal))}</div><div class="stat-label">TMB (kcal/dia)</div></div>
            <div class="stat"><div class="stat-value" style="font-size:1.5rem">${fmtInt(Math.round(tdeeVal))}</div><div class="stat-label">GET (kcal/dia)</div></div>
            <div class="stat"><div class="stat-value" style="font-size:1.5rem;color:var(--accent)">${fmtInt(kcal)}</div><div class="stat-label">Meta calórica</div></div>
            <div class="stat"><div class="stat-value" style="font-size:1.5rem">${water}</div><div class="stat-label">Água (ml/dia)</div></div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-bottom:1rem">
            <div class="stat"><div class="stat-value" style="font-size:1.25rem;color:${MACRO_COLORS.prot}">${macros.prot}g</div><div class="stat-label">Proteína</div></div>
            <div class="stat"><div class="stat-value" style="font-size:1.25rem;color:${MACRO_COLORS.carb}">${macros.carb}g</div><div class="stat-label">Carb.</div></div>
            <div class="stat"><div class="stat-value" style="font-size:1.25rem;color:${MACRO_COLORS.gord}">${macros.gord}g</div><div class="stat-label">Gordura</div></div>
          </div>
          ${floored ? '<p class="text-small text-muted" style="margin-bottom:0.75rem">⚠️ Meta ajustada para não ficar abaixo da TMB.</p>' : ''}
          <button type="button" class="btn btn--primary" style="width:100%" data-apply-targets
            data-kcal="${kcal}" data-prot="${macros.prot}" data-carb="${macros.carb}" data-gord="${macros.gord}"
            data-bmr="${Math.round(bmrVal)}" data-tdee="${Math.round(tdeeVal)}">
            Usar estas metas
          </button>
        </div>
      `;

      resultEl.querySelector('[data-apply-targets]').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        repo.diet.setManualTargets({
          kcal: parseInt(btn.dataset.kcal, 10),
          splitPct: null,
        });
        // Usa o setter mais completo via recomputeTargets após salvar no perfil
        // Atualiza perfil com os dados calculados
        if (sex && age && weight && height) {
          repo.profile.update({ sex, age, weightKg: weight, heightCm: height, goal, activity });
        }
        toast('Metas salvas!', { type: 'success' });
      });

    } catch (err) {
      toast('Erro no cálculo: ' + err.message, { type: 'error' });
    }
  });

  return {};
}

// ── VIEW: Planos alimentares ──────────────────────────────────────────────

export async function planos(ctx) {
  const { MEAL_PLANS } = await import('../../data/meal-plans.js');
  const { foodsById } = await getFoods();

  function calcPlanKcal(plan) {
    const all = [];
    for (const key of Object.keys(plan.meals)) {
      for (const e of plan.meals[key]) all.push(e);
    }
    const t = calc.foodTotals(all, foodsById);
    return Math.round(t.kcal);
  }

  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Planos Alimentares</h1>
    <p class="text-muted" style="margin-bottom:1.5rem">Aplique um plano ao dia de hoje para ver como ficaria sua alimentação.</p>

    ${raw(MEAL_PLANS.map(plan => {
      const kcal = calcPlanKcal(plan);
      return `
        <div class="card mb-1">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
            <span style="font-size:2rem">${plan.emoji}</span>
            <div>
              <h2 style="font-size:1.125rem;margin:0">${plan.name}</h2>
              <p class="text-small text-muted">≈ ${kcal} kcal</p>
            </div>
          </div>
          <p class="text-muted text-small" style="margin-bottom:1rem">${plan.description}</p>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            <button type="button" class="btn btn--primary btn--small" data-apply-plan data-plan-id="${plan.id}" data-mode="replace">Aplicar hoje</button>
            <button type="button" class="btn btn--secondary btn--small" data-apply-plan data-plan-id="${plan.id}" data-mode="append">Adicionar ao dia</button>
          </div>
        </div>
      `;
    }).join(''))}

    <p class="text-small text-muted" style="text-align:center;margin-bottom:2rem">
      ⚠️ Os planos são exemplos ilustrativos. Consulte um nutricionista para orientação personalizada.
    </p>
  `;

  ctx.el.querySelectorAll('[data-apply-plan]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const planId = btn.dataset.planId;
      const mode = btn.dataset.mode;
      const plan = MEAL_PLANS.find(p => p.id === planId);
      if (!plan) return;

      const today = dateKey();
      const n = repo.diet.applyPlan(today, plan, mode);
      toast(`Plano aplicado (${n} alimentos)!`, { type: 'success' });
      setTimeout(() => { location.href = '#/dieta'; }, 500);
    });
  });

  return {};
}
