// perfil.js: profile form, preferences, backup/import/reset, install, sobre/disclaimers, suporte (B6.9)
// Sem efeitos colaterais na importação

import { CONFIG } from '../../../config.js';
import { repo } from '../repo.js';
import { html, raw, toast, confirmDialog, openSheet, closeSheet, fieldError, clearErrors, DISCLAIMERS } from '../ui.js';
import { parseIntBR, parseNum, fmtBRL } from '../utils.js';
import { getInstallPrompt } from '../main.js';

export async function main(ctx) {
  const profile = repo.profile.get();
  const settings = repo.settings.get();
  
  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Perfil</h1>
    
    <div class="card mb-1">
      <h2 style="font-size:1.125rem;margin-bottom:1rem">Dados pessoais</h2>
      <form data-profile-form>
        <div class="field">
          <label for="name">Nome</label>
          <input type="text" id="name" value="${profile.name || ''}" autocomplete="name">
        </div>
        
        <div class="field">
          <label for="age">Idade</label>
          <input type="text" id="age" inputmode="numeric" value="${profile.age ?? ''}">
        </div>
        
        <div class="field">
          <label for="sex">Sexo</label>
          <select id="sex">
            <option value="">Não informado</option>
            <option value="M" ${profile.sex === 'M' ? 'selected' : ''}>Masculino</option>
            <option value="F" ${profile.sex === 'F' ? 'selected' : ''}>Feminino</option>
          </select>
        </div>
        
        <div class="field">
          <label for="weight">Peso (kg)</label>
          <input type="text" id="weight" inputmode="decimal" value="${profile.weightKg ?? ''}">
        </div>
        
        <div class="field">
          <label for="height">Altura (cm)</label>
          <input type="text" id="height" inputmode="numeric" value="${profile.heightCm ?? ''}">
        </div>
        
        <div class="field">
          <label for="goal">Meta</label>
          <select id="goal">
            <option value="">Não informada</option>
            <option value="perder" ${profile.goal === 'perder' ? 'selected' : ''}>Perder gordura</option>
            <option value="manter" ${profile.goal === 'manter' ? 'selected' : ''}>Manter o peso</option>
            <option value="ganhar" ${profile.goal === 'ganhar' ? 'selected' : ''}>Ganhar massa muscular</option>
          </select>
        </div>
        
        <div class="field">
          <label for="activity">Nível de atividade</label>
          <select id="activity">
            <option value="">Não informado</option>
            <option value="sedentario" ${profile.activity === 'sedentario' ? 'selected' : ''}>Sedentário</option>
            <option value="leve" ${profile.activity === 'leve' ? 'selected' : ''}>Levemente ativo</option>
            <option value="moderado" ${profile.activity === 'moderado' ? 'selected' : ''}>Moderadamente ativo</option>
            <option value="intenso" ${profile.activity === 'intenso' ? 'selected' : ''}>Muito ativo</option>
            <option value="muito_intenso" ${profile.activity === 'muito_intenso' ? 'selected' : ''}>Extremamente ativo</option>
          </select>
        </div>
        
        <button type="submit" class="btn btn--primary" style="width:100%">Salvar alterações</button>
      </form>
    </div>
    
    <div class="card mb-1">
      <h2 style="font-size:1.125rem;margin-bottom:1rem">Preferências</h2>
      
      <div class="field">
        <label for="theme">Tema</label>
        <select id="theme">
          <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Escuro</option>
          <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Claro</option>
        </select>
      </div>
      
      <div class="field">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer">
          <input type="checkbox" id="sound" ${settings.sound ? 'checked' : ''}>
          <span>Sons</span>
        </label>
      </div>
      
      <div class="field">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer">
          <input type="checkbox" id="voice" ${settings.voice ? 'checked' : ''}>
          <span>Voz durante o treino</span>
        </label>
        ${!window.speechSynthesis ? raw(`<p class="field-hint" style="color:var(--danger)">Seu navegador não tem voz em português.</p>`) : ''}
      </div>
      
      <div class="field">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer">
          <input type="checkbox" id="vibration" ${settings.vibration ? 'checked' : ''}>
          <span>Vibração</span>
        </label>
      </div>
      
      <button type="button" class="btn btn--primary" style="width:100%" data-save-prefs>Salvar preferências</button>
    </div>
    
    <div class="card mb-1">
      <h2 style="font-size:1.125rem;margin-bottom:1rem">Backup e dados</h2>
      
      <button type="button" class="btn btn--ghost" style="width:100%;margin-bottom:0.75rem" data-export>Exportar backup</button>
      <button type="button" class="btn btn--ghost" style="width:100%;margin-bottom:0.75rem" data-import>Importar backup</button>
      <button type="button" class="btn btn--danger" style="width:100%" data-reset>Apagar todos os dados</button>
      
      <input type="file" accept=".json" style="display:none" data-file-input>
    </div>
    
    ${getInstallPrompt() ? raw(`
      <div class="card mb-1">
        <h2 style="font-size:1.125rem;margin-bottom:1rem">Instalar app</h2>
        <p class="text-small text-muted mb-1">Use o app offline e acesse mais rápido</p>
        <button type="button" class="btn btn--primary" style="width:100%" data-install>Instalar agora</button>
      </div>
    `) : ''}
    
    ${CONFIG.support.whatsapp || CONFIG.support.email ? raw(`
      <div class="card mb-1">
        <h2 style="font-size:1.125rem;margin-bottom:1rem">Suporte</h2>
        ${CONFIG.support.whatsapp ? raw(`
          <a href="https://wa.me/${CONFIG.support.whatsapp}?text=${encodeURIComponent(CONFIG.support.message)}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost" style="width:100%;margin-bottom:0.75rem">
            WhatsApp
          </a>
        `) : ''}
        ${CONFIG.support.email ? raw(`
          <a href="mailto:${CONFIG.support.email}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost" style="width:100%">
            E-mail
          </a>
        `) : ''}
      </div>
    `) : ''}
    
    <div class="card mb-1">
      <h2 style="font-size:1.125rem;margin-bottom:1rem">Sobre o EdFísica PRO</h2>
      
      <button type="button" class="btn btn--ghost" style="width:100%;margin-bottom:0.75rem" data-credits>Créditos e licenças</button>
      <button type="button" class="btn btn--ghost" style="width:100%;margin-bottom:0.75rem" data-formulas>Fórmulas utilizadas</button>
      <button type="button" class="btn btn--ghost" style="width:100%" data-disclaimers>Avisos importantes</button>
      
      <p class="text-small text-muted mt-2" style="text-align:center;margin-bottom:0">
        ${CONFIG.product.name} · Versão 1.0.0
      </p>
    </div>
  `;
  
  // Profile form submit
  ctx.el.querySelector('[data-profile-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    clearErrors(form);
    
    const nameInput = form.querySelector('#name');
    const ageInput = form.querySelector('#age');
    const sexInput = form.querySelector('#sex');
    const weightInput = form.querySelector('#weight');
    const heightInput = form.querySelector('#height');
    const goalInput = form.querySelector('#goal');
    const activityInput = form.querySelector('#activity');
    
    const patch = {};
    
    if (nameInput?.value?.trim()) {
      patch.name = nameInput.value.trim();
    }
    
    if (ageInput?.value?.trim()) {
      const age = parseIntBR(ageInput.value);
      if (isNaN(age) || age < 10 || age > 120) {
        fieldError(ageInput, 'Digite uma idade válida entre 10 e 120 anos');
        return;
      }
      patch.age = age;
    }
    
    if (sexInput?.value) {
      patch.sex = sexInput.value;
    }
    
    if (goalInput?.value) {
      patch.goal = goalInput.value;
    }
    
    if (activityInput?.value) {
      patch.activity = activityInput.value;
    }
    
    // Weight/height via repo.body.log (B4.4 invariant)
    const weightVal = weightInput?.value?.trim();
    const heightVal = heightInput?.value?.trim();
    
    let weight = null;
    let height = null;
    
    if (weightVal) {
      weight = parseNum(weightVal);
      if (isNaN(weight) || weight < 30 || weight > 300) {
        fieldError(weightInput, 'Digite um peso válido entre 30 e 300 kg');
        return;
      }
    }
    
    if (heightVal) {
      height = parseIntBR(heightVal);
      if (isNaN(height) || height < 100 || height > 250) {
        fieldError(heightInput, 'Digite uma altura válida entre 100 e 250 cm');
        return;
      }
    }
    
    // Salva profile patch
    if (Object.keys(patch).length > 0) {
      repo.profile.update(patch);
    }
    
    // Salva weight/height
    if (weight && height) {
      repo.body.log({ weightKg: weight, heightCm: height });
    } else if (height) {
      repo.profile.update({ heightCm: height });
    }
    
    toast('Perfil atualizado', { type: 'success' });
  });
  
  // Preferences
  ctx.el.querySelector('[data-save-prefs]')?.addEventListener('click', () => {
    const themeSelect = ctx.el.querySelector('#theme');
    const soundCheck = ctx.el.querySelector('#sound');
    const voiceCheck = ctx.el.querySelector('#voice');
    const vibrationCheck = ctx.el.querySelector('#vibration');
    
    const patch = {
      theme: themeSelect?.value || 'dark',
      sound: soundCheck?.checked ?? true,
      voice: voiceCheck?.checked ?? false,
      vibration: vibrationCheck?.checked ?? true,
    };
    
    repo.settings.update(patch);
    document.documentElement.dataset.theme = patch.theme;
    
    toast('Preferências salvas', { type: 'success' });
  });
  
  // Export backup
  ctx.el.querySelector('[data-export]')?.addEventListener('click', () => {
    const data = repo.backup.export();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edfisica-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast('Backup exportado', { type: 'success' });
  });
  
  // Import backup
  ctx.el.querySelector('[data-import]')?.addEventListener('click', () => {
    ctx.el.querySelector('[data-file-input]')?.click();
  });
  
  ctx.el.querySelector('[data-file-input]')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const text = await file.text();
    
    // Validação de tamanho (≤ 2 MB, B6.9)
    if (text.length > 2 * 1024 * 1024) {
      toast('Arquivo muito grande (máximo 2 MB)', { type: 'error' });
      return;
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      toast('Arquivo inválido: não é um JSON válido', { type: 'error' });
      return;
    }
    
    const validation = repo.backup.validate(data);
    if (!validation.ok) {
      toast(validation.reason, { type: 'error', duration: 5000 });
      return;
    }
    
    const confirmed = await confirmDialog(
      'Importar este backup substituirá todos os seus dados atuais. Deseja continuar?',
      { confirmLabel: 'Importar', danger: true }
    );
    
    if (confirmed) {
      const ok = repo.backup.import(data);
      if (ok) {
        toast('Backup importado com sucesso. Recarregando...', { type: 'success' });
        setTimeout(() => location.reload(), 1500);
      } else {
        toast('Falha ao importar alguns dados. Verifique o backup.', { type: 'error' });
      }
    }
  });
  
  // Reset
  ctx.el.querySelector('[data-reset]')?.addEventListener('click', async () => {
    const confirmed = await confirmDialog(
      'Apagar todos os dados do app? Esta ação não pode ser desfeita.',
      { confirmLabel: 'Apagar tudo', danger: true }
    );
    
    if (confirmed) {
      repo.backup.import({ app: 'edfisica-pro', schema: 1, exportedAt: Date.now(), data: {} });
      toast('Dados apagados. Recarregando...', { type: 'success' });
      setTimeout(() => location.reload(), 1500);
    }
  });
  
  // Install
  ctx.el.querySelector('[data-install]')?.addEventListener('click', async () => {
    const prompt = getInstallPrompt();
    if (!prompt) return;
    
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    
    if (outcome === 'accepted') {
      toast('App instalado com sucesso!', { type: 'success' });
    }
  });
  
  // Credits
  ctx.el.querySelector('[data-credits]')?.addEventListener('click', () => {
    const content = `
      <h3>Fontes</h3>
      <p class="text-small text-muted mb-1">
        • Sora (Google Fonts, SIL Open Font License 1.1)<br>
        • Inter (Rasmus Andersson, SIL Open Font License 1.1)
      </p>
      
      <h3>Dados nutricionais</h3>
      <p class="text-small text-muted mb-1">
        • TACO 4ª edição (NEPA/UNICAMP, 2011)
      </p>
      
      <h3>Exercícios</h3>
      <p class="text-small text-muted mb-1">
        • Biblioteca de exercícios corporais baseada em fontes públicas de Educação Física
      </p>
      
      <h3>Conteúdo de Estudos</h3>
      <p class="text-small text-muted mb-0">
        • Material elaborado com base em bibliografia de Educação Física e na BNCC
      </p>
    `;
    openSheet(content, { title: 'Créditos e licenças' });
  });
  
  // Formulas
  ctx.el.querySelector('[data-formulas]')?.addEventListener('click', () => {
    const content = `
      <h3>TMB (Taxa Metabólica Basal)</h3>
      <p class="text-small text-muted mb-1">Mifflin-St Jeor (2005)</p>
      
      <h3>TDEE (gasto diário)</h3>
      <p class="text-small text-muted mb-1">TMB × fator de atividade (padrão Harris-Benedict)</p>
      
      <h3>IMC</h3>
      <p class="text-small text-muted mb-1">peso (kg) / altura² (m); classificação OMS</p>
      
      <h3>% de gordura</h3>
      <p class="text-small text-muted mb-1">US Navy (circunferências)</p>
      
      <h3>FC máxima</h3>
      <p class="text-small text-muted mb-1">220 − idade (Fox) ou Tanaka: 208 − 0,7 × idade</p>
      
      <h3>Zonas de FC</h3>
      <p class="text-small text-muted mb-1">Karvonen: FC alvo = (FC máx − FC repouso) × % + FC repouso</p>
      
      <h3>1RM (carga máxima)</h3>
      <p class="text-small text-muted mb-1">Epley: peso × (1 + reps/30)<br>Brzycki: peso / (1,0278 − 0,0278 × reps)</p>
      
      <h3>Água</h3>
      <p class="text-small text-muted mb-0">35 ml/kg/dia</p>
    `;
    openSheet(content, { title: 'Fórmulas utilizadas' });
  });
  
  // Disclaimers
  ctx.el.querySelector('[data-disclaimers]')?.addEventListener('click', () => {
    const content = `
      <h3>Aviso de saúde</h3>
      <p class="text-small text-muted mb-2">${DISCLAIMERS.health}</p>
      
      <h3>Dieta</h3>
      <p class="text-small text-muted mb-2">${DISCLAIMERS.diet}</p>
      
      <h3>IMC</h3>
      <p class="text-small text-muted mb-2">${DISCLAIMERS.imc}</p>
      
      <h3>% de gordura</h3>
      <p class="text-small text-muted mb-2">${DISCLAIMERS.bodyFat}</p>
      
      <h3>Exercícios</h3>
      <p class="text-small text-muted mb-2">${DISCLAIMERS.exercises}</p>
      
      <h3>Crianças e adolescentes</h3>
      <p class="text-small text-muted mb-2">${DISCLAIMERS.children}</p>
      
      <h3>Terceira idade</h3>
      <p class="text-small text-muted mb-0">${DISCLAIMERS.elderly}</p>
    `;
    openSheet(content, { title: 'Avisos importantes' });
  });
  
  return {};
}
