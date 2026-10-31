// imc.js: Teste de IMC (FR-9)
// Classificação OMS, gauge visual, faixa saudável, histórico, limitações
// Sem efeitos colaterais na importação

import { repo } from '../repo.js';
import { html, raw, toast } from '../ui.js';
import { gauge, line } from '../charts.js';
import { parseNum, parseIntBR, fmt1, fmtInt, labelShort } from '../utils.js';
import * as calc from '../calc.js';

// Faixas OMS para o gauge
const IMC_BANDS = [
  { min: 10, max: 18.5, color: '#60a5fa', label: 'Abaixo do peso' },
  { min: 18.5, max: 25, color: '#4ade80', label: 'Peso normal' },
  { min: 25, max: 30, color: '#fbbf24', label: 'Sobrepeso' },
  { min: 30, max: 35, color: '#f97316', label: 'Obesidade I' },
  { min: 35, max: 40, color: '#ef4444', label: 'Obesidade II' },
  { min: 40, max: 50, color: '#7c3aed', label: 'Obesidade III' },
];

export async function main(ctx) {
  const profile = repo.profile.get();
  const history = repo.assess.list('imc');

  function render(result = null) {
    const historyPoints = history.slice().reverse().slice(-10);

    ctx.el.innerHTML = html`
      <h1 tabindex="-1">Teste de IMC</h1>

      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:1rem">Calcular IMC</h2>
        <div class="field">
          <label for="imc-weight">Peso (kg)</label>
          <input type="text" id="imc-weight" inputmode="decimal" value="${profile.weightKg ?? ''}" autocomplete="off">
        </div>
        <div class="field">
          <label for="imc-height">Altura (cm)</label>
          <input type="text" id="imc-height" inputmode="numeric" value="${profile.heightCm ?? ''}" autocomplete="off">
        </div>
        <button type="button" class="btn btn--primary" style="width:100%;margin-top:0.5rem" data-calc-btn>Calcular</button>
      </div>

      <div data-result-area></div>

      ${historyPoints.length > 0 ? raw(`
        <div class="card mb-1">
          <h2 style="font-size:1rem;margin-bottom:0.75rem">Histórico</h2>
          <div style="overflow-x:auto">
            ${line(
              historyPoints.map(e => ({ y: e.result.bmi })),
              {
                width: 300, height: 160,
                xLabels: historyPoints.map(e => labelShort(e.date)),
                yUnit: '',
                yMin: 15, yMax: 40,
              }
            )}
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:0.75rem;font-size:0.875rem">
            <thead>
              <tr>
                <th style="text-align:left;padding:0.25rem 0;border-bottom:1px solid var(--border)">Data</th>
                <th style="text-align:right;padding:0.25rem 0;border-bottom:1px solid var(--border)">IMC</th>
                <th style="text-align:right;padding:0.25rem 0;border-bottom:1px solid var(--border)">Peso</th>
                <th style="padding:0.25rem 0;border-bottom:1px solid var(--border)"></th>
              </tr>
            </thead>
            <tbody>
              ${historyPoints.reverse().map(e => `
                <tr>
                  <td style="padding:0.25rem 0">${e.date}</td>
                  <td style="text-align:right;padding:0.25rem 0">${fmt1(e.result.bmi)}</td>
                  <td style="text-align:right;padding:0.25rem 0">${e.result.weight} kg</td>
                  <td style="text-align:right;padding:0.25rem 0">
                    <button type="button" class="btn btn--ghost btn--small" data-remove-entry="${e.id}" aria-label="Remover">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5L15 15M15 5L5 15"/></svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `) : ''}

      <div class="card mb-2" style="background:var(--card-alt,var(--card))">
        <h2 style="font-size:1rem;margin-bottom:0.5rem">Limitações do IMC</h2>
        <p class="text-small text-muted">
          O IMC não distingue gordura de massa muscular e pode classificar incorretamente atletas,
          idosos e pessoas com diferentes biotipos. Crianças, gestantes e idosos devem usar referências específicas.
          Procure um profissional de saúde para uma avaliação completa.
        </p>
      </div>
    `;

    // Mostrar resultado pré-calculado
    if (result) showResult(result);

    // Remover do histórico
    ctx.el.querySelectorAll('[data-remove-entry]').forEach(btn => {
      btn.addEventListener('click', () => {
        repo.assess.remove(btn.dataset.removeEntry);
        // Atualiza lista
        const idx = history.findIndex(e => e.id === btn.dataset.removeEntry);
        if (idx !== -1) history.splice(idx, 1);
        render();
      });
    });

    // Calcular
    ctx.el.querySelector('[data-calc-btn]').addEventListener('click', () => {
      const weight = parseNum(ctx.el.querySelector('#imc-weight').value);
      const height = parseIntBR(ctx.el.querySelector('#imc-height').value);

      if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
        toast('Preencha peso e altura corretamente', { type: 'error' });
        return;
      }

      const bmiVal = calc.round1(calc.bmi(weight, height));
      const classification = calc.bmiClass(bmiVal);
      const range = calc.healthyWeightRange(height);

      const entry = repo.assess.add({
        type: 'imc',
        inputs: { weight, height },
        result: { bmi: bmiVal, class: classification.key, weight, height },
      });
      history.unshift(entry);

      // Sincroniza perfil
      repo.body.log({ weightKg: weight, heightCm: height });

      showResult({ bmiVal, classification, range, weight, height });
    });
  }

  function showResult({ bmiVal, classification, range, weight, height }) {
    const resultArea = ctx.el.querySelector('[data-result-area]');
    if (!resultArea) return;

    const COLOR_MAP = {
      abaixo: '#60a5fa', normal: '#4ade80', sobrepeso: '#fbbf24',
      obesidade1: '#f97316', obesidade2: '#ef4444', obesidade3: '#7c3aed',
    };
    const color = COLOR_MAP[classification.key] || 'var(--accent)';

    resultArea.innerHTML = `
      <div class="card mb-1">
        <div style="text-align:center;margin-bottom:0.75rem">
          ${gauge(bmiVal, { size: 280, min: 10, max: 50, bands: IMC_BANDS })}
        </div>
        <div style="text-align:center">
          <div style="font-size:3rem;font-weight:800;color:${color}">${fmt1(bmiVal)}</div>
          <div style="font-size:1.25rem;color:${color};margin-bottom:0.5rem">${classification.label}</div>
          <p class="text-small text-muted">
            Peso saudável para ${height} cm: <strong>${range.min} kg a ${range.max} kg</strong>
          </p>
          <p class="text-small text-muted">
            Seu peso atual: <strong>${weight} kg</strong>
            ${weight < range.min ? ` (${fmt1(range.min - weight)} kg abaixo do ideal)` : weight > range.max ? ` (${fmt1(weight - range.max)} kg acima do ideal)` : ' ✓'}
          </p>
        </div>
      </div>
    `;
  }

  render();
  return {};
}
