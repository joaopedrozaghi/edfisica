// avaliacao.js: Avaliação Física (FR-10)
// % gordura (US Navy), RCQ, FC máx + zonas Karvonen, 1RM (Epley/Brzycki)
// Sem efeitos colaterais na importação

import { repo } from '../repo.js';
import { html, raw, toast } from '../ui.js';
import { parseNum, parseIntBR, fmt1, fmtInt } from '../utils.js';
import * as calc from '../calc.js';

// Abas disponíveis
const TABS = [
  { id: 'gordura', label: '% Gordura' },
  { id: 'rcq', label: 'RCQ' },
  { id: 'fc', label: 'FC Zonas' },
  { id: 'rm', label: '1RM' },
];

export async function main(ctx) {
  const profile = repo.profile.get();
  let activeTab = ctx.query.tab || 'gordura';

  function renderTabs() {
    return TABS.map(t => `
      <button type="button" class="tab-btn ${activeTab === t.id ? 'tab-btn--active' : ''}" data-tab="${t.id}">
        ${t.label}
      </button>
    `).join('');
  }

  function render() {
    ctx.el.innerHTML = `
      <h1 tabindex="-1" style="font-size:1.5rem;margin-bottom:1rem">Avaliação Física</h1>
      <div class="tab-bar" style="display:flex;gap:0.25rem;overflow-x:auto;margin-bottom:1.5rem;padding-bottom:0.25rem">
        ${renderTabs()}
      </div>
      <div data-tab-content></div>
    `;

    ctx.el.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        ctx.el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('tab-btn--active', b.dataset.tab === activeTab));
        renderTabContent();
      });
    });

    renderTabContent();
  }

  function renderTabContent() {
    const el = ctx.el.querySelector('[data-tab-content]');
    if (!el) return;

    if (activeTab === 'gordura') renderGordura(el);
    else if (activeTab === 'rcq') renderRCQ(el);
    else if (activeTab === 'fc') renderFC(el);
    else if (activeTab === 'rm') renderRM(el);
  }

  // ── % Gordura (US Navy) ──────────────────────────────────────────────────

  function renderGordura(el) {
    el.innerHTML = `
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:1rem">% Gordura Corporal (US Navy)</h2>
        <p class="text-small text-muted" style="margin-bottom:1rem">
          Meça com fita métrica na manhã, respirando normalmente. Repita 3× e use a média.
        </p>
        <div class="field">
          <label for="gord-sex">Sexo</label>
          <select id="gord-sex">
            <option value="M" ${profile.sex === 'M' ? 'selected' : ''}>Masculino</option>
            <option value="F" ${profile.sex === 'F' ? 'selected' : ''}>Feminino</option>
          </select>
        </div>
        <div class="field">
          <label for="gord-height">Altura (cm)</label>
          <input type="text" id="gord-height" inputmode="numeric" value="${profile.heightCm ?? ''}">
        </div>
        <div class="field">
          <label for="gord-neck">Pescoço (cm) — na maior circunferência, abaixo da laringe</label>
          <input type="text" id="gord-neck" inputmode="decimal" value="">
        </div>
        <div class="field">
          <label for="gord-waist">Cintura (cm) — ponto mais estreito (homem: umbigo)</label>
          <input type="text" id="gord-waist" inputmode="decimal" value="">
        </div>
        <div id="hip-field" class="field" ${profile.sex !== 'F' ? 'style="display:none"' : ''}>
          <label for="gord-hip">Quadril (cm) — ponto mais largo (mulher)</label>
          <input type="text" id="gord-hip" inputmode="decimal" value="">
        </div>
        <button type="button" class="btn btn--primary" style="width:100%;margin-top:0.5rem" data-calc-gord>Calcular</button>
      </div>
      <div data-gord-result></div>
    `;

    // Mostrar/ocultar campo quadril
    el.querySelector('#gord-sex').addEventListener('change', (e) => {
      el.querySelector('#hip-field').style.display = e.target.value === 'F' ? '' : 'none';
    });

    el.querySelector('[data-calc-gord]').addEventListener('click', () => {
      const sex = el.querySelector('#gord-sex').value;
      const height = parseIntBR(el.querySelector('#gord-height').value);
      const neck = parseNum(el.querySelector('#gord-neck').value);
      const waist = parseNum(el.querySelector('#gord-waist').value);
      const hip = sex === 'F' ? parseNum(el.querySelector('#gord-hip').value) : undefined;

      if (isNaN(height) || isNaN(neck) || isNaN(waist) || (sex === 'F' && isNaN(hip))) {
        toast('Preencha todos os campos', { type: 'error' });
        return;
      }
      if (sex === 'M' && waist <= neck) {
        toast('Cintura deve ser maior que o pescoço', { type: 'error' });
        return;
      }
      if (sex === 'F' && (waist + hip) <= neck) {
        toast('Cintura + quadril deve ser maior que o pescoço', { type: 'error' });
        return;
      }

      try {
        const pct = calc.bodyFatNavy({ sex, cm: height, neck, waist, hip });
        const cls = calc.bodyFatClass(sex, pct);

        repo.assess.add({ type: 'gordura', inputs: { sex, height, neck, waist, hip }, result: { pct, class: cls.key } });

        const gordResult = el.querySelector('[data-gord-result]');
        gordResult.innerHTML = `
          <div class="card">
            <div style="text-align:center;margin-bottom:0.75rem">
              <div style="font-size:3rem;font-weight:800;color:var(--accent)">${fmt1(pct)}%</div>
              <div style="font-size:1.125rem;color:var(--accent);margin-bottom:0.5rem">${cls.label}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
              <caption style="text-align:left;font-weight:600;margin-bottom:0.5rem">Referência ACE (${sex === 'M' ? 'homens' : 'mulheres'})</caption>
              <tr><td style="padding:0.2rem 0">Atleta</td><td style="text-align:right">${sex === 'M' ? '6–13%' : '14–20%'}</td></tr>
              <tr><td style="padding:0.2rem 0">Boa forma</td><td style="text-align:right">${sex === 'M' ? '14–17%' : '21–24%'}</td></tr>
              <tr><td style="padding:0.2rem 0">Média</td><td style="text-align:right">${sex === 'M' ? '18–24%' : '25–31%'}</td></tr>
              <tr><td style="padding:0.2rem 0">Acima da média</td><td style="text-align:right">${sex === 'M' ? '≥25%' : '≥32%'}</td></tr>
            </table>
            <p class="text-small text-muted" style="margin-top:0.75rem">Resultado salvo no histórico.</p>
          </div>
        `;
        toast('Resultado calculado!', { type: 'success' });
      } catch (err) {
        toast('Erro: ' + err.message, { type: 'error' });
      }
    });
  }

  // ── RCQ ─────────────────────────────────────────────────────────────────

  function renderRCQ(el) {
    el.innerHTML = `
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:1rem">Relação Cintura-Quadril (RCQ)</h2>
        <p class="text-small text-muted" style="margin-bottom:1rem">
          RCQ = Cintura ÷ Quadril. Risco cardiovascular aumentado: homens ≥ 0,90; mulheres ≥ 0,85 (OMS).
        </p>
        <div class="field">
          <label for="rcq-sex">Sexo</label>
          <select id="rcq-sex">
            <option value="M" ${profile.sex === 'M' ? 'selected' : ''}>Masculino</option>
            <option value="F" ${profile.sex === 'F' ? 'selected' : ''}>Feminino</option>
          </select>
        </div>
        <div class="field">
          <label for="rcq-waist">Cintura (cm)</label>
          <input type="text" id="rcq-waist" inputmode="decimal" value="">
        </div>
        <div class="field">
          <label for="rcq-hip">Quadril (cm)</label>
          <input type="text" id="rcq-hip" inputmode="decimal" value="">
        </div>
        <button type="button" class="btn btn--primary" style="width:100%;margin-top:0.5rem" data-calc-rcq>Calcular</button>
      </div>
      <div data-rcq-result></div>
    `;

    el.querySelector('[data-calc-rcq]').addEventListener('click', () => {
      const sex = el.querySelector('#rcq-sex').value;
      const waist = parseNum(el.querySelector('#rcq-waist').value);
      const hip = parseNum(el.querySelector('#rcq-hip').value);

      if (isNaN(waist) || isNaN(hip) || waist <= 0 || hip <= 0) {
        toast('Preencha cintura e quadril', { type: 'error' });
        return;
      }

      const ratio = calc.whr(waist, hip);
      const risk = calc.whrRisk(sex, ratio);
      const limit = sex === 'M' ? 0.90 : 0.85;

      repo.assess.add({ type: 'rcq', inputs: { sex, waist, hip }, result: { ratio, risk } });

      const resultEl = el.querySelector('[data-rcq-result]');
      const riskColor = risk === 'aumentado' ? '#ef4444' : '#4ade80';
      resultEl.innerHTML = `
        <div class="card">
          <div style="text-align:center">
            <div style="font-size:3rem;font-weight:800;color:${riskColor}">${ratio.toFixed(2)}</div>
            <div style="font-size:1.125rem;color:${riskColor};margin-bottom:0.5rem">Risco ${risk}</div>
            <p class="text-small text-muted">Limite para risco aumentado (${sex === 'M' ? 'homens' : 'mulheres'}): ${limit}</p>
          </div>
        </div>
      `;
      toast('Resultado calculado!', { type: 'success' });
    });
  }

  // ── FC Máxima + Zonas ────────────────────────────────────────────────────

  function renderFC(el) {
    el.innerHTML = `
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:1rem">Frequência Cardíaca e Zonas de Treinamento</h2>
        <div class="field">
          <label for="fc-age">Idade (anos)</label>
          <input type="text" id="fc-age" inputmode="numeric" value="${profile.age ?? ''}">
        </div>
        <div class="field">
          <label for="fc-rest">FC de repouso (bpm) — meça ao acordar por 1 minuto</label>
          <input type="text" id="fc-rest" inputmode="numeric" value="" placeholder="ex: 60">
        </div>
        <div class="field">
          <label for="fc-formula">Fórmula FC máxima</label>
          <select id="fc-formula">
            <option value="fox">Fox (220 − idade) — padrão</option>
            <option value="tanaka">Tanaka (208 − 0,7 × idade) — mais precisa para adultos</option>
          </select>
        </div>
        <button type="button" class="btn btn--primary" style="width:100%;margin-top:0.5rem" data-calc-fc>Calcular</button>
      </div>
      <div data-fc-result></div>
    `;

    el.querySelector('[data-calc-fc]').addEventListener('click', () => {
      const age = parseIntBR(el.querySelector('#fc-age').value);
      const rest = parseIntBR(el.querySelector('#fc-rest').value);
      const formula = el.querySelector('#fc-formula').value;

      if (isNaN(age) || age <= 0) { toast('Informe sua idade', { type: 'error' }); return; }
      if (isNaN(rest) || rest <= 0 || rest >= 220) { toast('FC de repouso inválida (ex: 60)', { type: 'error' }); return; }

      try {
        const maxHR = calc.hrMax(age, formula);
        if (rest >= maxHR) { toast('FC de repouso deve ser menor que a FC máxima', { type: 'error' }); return; }
        const zones = calc.hrZones(maxHR, rest);

        repo.assess.add({ type: 'fc', inputs: { age, rest, formula }, result: { maxHR, zones } });

        const ZONE_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#f97316', '#ef4444'];
        const resultEl = el.querySelector('[data-fc-result]');
        resultEl.innerHTML = `
          <div class="card">
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem;margin-bottom:1rem">
              <div class="stat"><div class="stat-value" style="font-size:1.5rem">${maxHR}</div><div class="stat-label">FC máx (bpm)</div></div>
              <div class="stat"><div class="stat-value" style="font-size:1.5rem">${rest}</div><div class="stat-label">FC repouso (bpm)</div></div>
            </div>
            <h3 style="font-size:0.9rem;margin-bottom:0.5rem">Zonas de Karvonen</h3>
            <div style="display:flex;flex-direction:column;gap:0.5rem">
              ${zones.map((z, i) => `
                <div style="border-left:4px solid ${ZONE_COLORS[i]};padding-left:0.75rem">
                  <div style="font-weight:600;font-size:0.875rem">${z.key} · ${z.name}</div>
                  <div class="text-small text-muted">${Math.round(z.minPct * 100)}–${Math.round(z.maxPct * 100)}% · <strong>${z.min}–${z.max} bpm</strong></div>
                </div>
              `).join('')}
            </div>
            <p class="text-small text-muted" style="margin-top:0.75rem">Resultado salvo no histórico.</p>
          </div>
        `;
        toast('Zonas calculadas!', { type: 'success' });
      } catch (err) {
        toast('Erro: ' + err.message, { type: 'error' });
      }
    });
  }

  // ── 1RM ──────────────────────────────────────────────────────────────────

  function renderRM(el) {
    el.innerHTML = `
      <div class="card mb-1">
        <h2 style="font-size:1rem;margin-bottom:1rem">Carga Máxima (1RM)</h2>
        <p class="text-small text-muted" style="margin-bottom:1rem">
          Informe a carga (kg) e o número de repetições feitas com boa técnica para estimar seu 1RM.
        </p>
        <div class="field">
          <label for="rm-weight">Carga utilizada (kg)</label>
          <input type="text" id="rm-weight" inputmode="decimal" value="" placeholder="ex: 100">
        </div>
        <div class="field">
          <label for="rm-reps">Repetições realizadas</label>
          <input type="text" id="rm-reps" inputmode="numeric" value="" placeholder="ex: 10">
        </div>
        <button type="button" class="btn btn--primary" style="width:100%;margin-top:0.5rem" data-calc-rm>Calcular</button>
      </div>
      <div data-rm-result></div>
    `;

    el.querySelector('[data-calc-rm]').addEventListener('click', () => {
      const weight = parseNum(el.querySelector('#rm-weight').value);
      const reps = parseIntBR(el.querySelector('#rm-reps').value);

      if (isNaN(weight) || weight <= 0) { toast('Informe a carga', { type: 'error' }); return; }
      if (isNaN(reps) || reps < 1) { toast('Informe as repetições (mín. 1)', { type: 'error' }); return; }
      if (reps > 12) { toast('Brzycki funciona até 12 repetições. Use até 12 para maior precisão.', { type: 'info' }); }

      try {
        const epley = calc.oneRmEpley(weight, reps);
        let brzycki = null;
        if (reps <= 12) {
          try { brzycki = calc.oneRmBrzycki(weight, reps); } catch (e) { /* ignora */ }
        }
        const avg = brzycki !== null ? (epley + brzycki) / 2 : epley;

        repo.assess.add({ type: '1rm', inputs: { weight, reps }, result: { epley: Math.round(epley), brzycki: brzycki ? Math.round(brzycki) : null, avg: Math.round(avg) } });

        // Tabela de %1RM
        const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];

        const resultEl = el.querySelector('[data-rm-result]');
        resultEl.innerHTML = `
          <div class="card">
            <div style="display:grid;grid-template-columns:repeat(${brzycki !== null ? '3' : '2'},1fr);gap:0.75rem;margin-bottom:1rem">
              <div class="stat"><div class="stat-value" style="font-size:1.5rem;color:var(--accent)">${Math.round(avg)}</div><div class="stat-label">1RM est. médio (kg)</div></div>
              <div class="stat"><div class="stat-value" style="font-size:1.25rem">${Math.round(epley)}</div><div class="stat-label">Epley</div></div>
              ${brzycki !== null ? `<div class="stat"><div class="stat-value" style="font-size:1.25rem">${Math.round(brzycki)}</div><div class="stat-label">Brzycki</div></div>` : ''}
            </div>
            <h3 style="font-size:0.9rem;margin-bottom:0.5rem">Tabela %1RM</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.875rem">
              <thead>
                <tr>
                  <th style="text-align:left;padding:0.2rem 0;border-bottom:1px solid var(--border)">%1RM</th>
                  <th style="text-align:right;padding:0.2rem 0;border-bottom:1px solid var(--border)">Carga (kg)</th>
                  <th style="text-align:right;padding:0.2rem 0;border-bottom:1px solid var(--border)">Reps est.</th>
                </tr>
              </thead>
              <tbody>
                ${pcts.map(pct => {
                  const load = Math.round(avg * pct / 100 * 10) / 10;
                  const repsEst = pct === 100 ? 1 : Math.round(30 * (1 - pct / 100));
                  return `<tr>
                    <td style="padding:0.2rem 0">${pct}%</td>
                    <td style="text-align:right;padding:0.2rem 0">${load}</td>
                    <td style="text-align:right;padding:0.2rem 0">~${Math.max(1, repsEst)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
            <p class="text-small text-muted" style="margin-top:0.75rem">Resultado salvo no histórico.</p>
          </div>
        `;
        toast('1RM calculado!', { type: 'success' });
      } catch (err) {
        toast('Erro: ' + err.message, { type: 'error' });
      }
    });
  }

  render();
  return {};
}
