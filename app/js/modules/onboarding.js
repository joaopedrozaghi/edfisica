// onboarding.js: 3 telas de onboarding (B4.4)
// Sem efeitos colaterais na importação

import { repo } from '../repo.js';
import { html, raw, fieldError, clearErrors, DISCLAIMERS } from '../ui.js';
import { parseIntBR, parseNum } from '../utils.js';

let currentScreen = 1;
let formData = {
  persona: null,
  name: '',
  age: null,
  sex: null,
  weightKg: null,
  heightCm: null,
  goal: null,
  activity: null,
};

export async function main(ctx) {
  const profile = repo.profile.get();
  
  // Se já onboarded, redireciona (B4.4)
  if (profile.onboarded === true) {
    location.replace('#/');
    return {};
  }
  
  currentScreen = 1;
  formData = {
    persona: null,
    name: profile.name || '',
    age: null,
    sex: null,
    weightKg: null,
    heightCm: null,
    goal: null,
    activity: null,
  };
  
  render(ctx);
  
  return {};
}

function render(ctx) {
  if (currentScreen === 1) {
    renderScreen1(ctx);
  } else if (currentScreen === 2) {
    renderScreen2(ctx);
  } else {
    renderScreen3(ctx);
  }
}

// Screen 1: Persona
function renderScreen1(ctx) {
  const personas = [
    { id: 'estudante', emoji: '🎓', title: 'Estudante', subtitle: 'Provas, concursos e faculdade' },
    { id: 'professor', emoji: '📣', title: 'Professor / Personal', subtitle: 'Aulas prontas e ferramentas' },
    { id: 'casa', emoji: '🏠', title: 'Treino em casa', subtitle: 'Exercícios guiados sem academia' },
  ];
  
  ctx.el.innerHTML = html`
    <div class="onboarding-screen">
      <div class="onboarding-progress">
        <div class="onboarding-progress-dot active"></div>
        <div class="onboarding-progress-dot"></div>
        <div class="onboarding-progress-dot"></div>
      </div>
      
      <h1 tabindex="-1">Como você vai usar o EducaFit?</h1>
      <p class="text-muted mb-2">Escolha a opção que mais combina com você</p>
      
      <div class="onboarding-personas" role="radiogroup" aria-label="Selecione seu perfil">
        ${raw(personas.map(p => `
          <button type="button" class="persona-card" role="radio" aria-checked="${formData.persona === p.id}" data-persona="${p.id}">
            <div class="persona-emoji">${p.emoji}</div>
            <div class="persona-title">${p.title}</div>
            <div class="persona-subtitle">${p.subtitle}</div>
          </button>
        `).join(''))}
      </div>
      
      <button type="button" class="btn btn--primary" style="width:100%;margin-top:2rem" data-next ${formData.persona ? '' : 'disabled'}>Continuar</button>
    </div>
  `;
  
  ctx.el.querySelectorAll('[data-persona]').forEach((btn) => {
    btn.onclick = () => {
      formData.persona = btn.dataset.persona;
      renderScreen1(ctx);
    };
  });
  
  ctx.el.querySelector('[data-next]')?.addEventListener('click', () => {
    if (formData.persona) {
      currentScreen = 2;
      render(ctx);
    }
  });
}

// Screen 2: Dados pessoais
function renderScreen2(ctx) {
  ctx.el.innerHTML = html`
    <div class="onboarding-screen">
      <div class="onboarding-progress">
        <div class="onboarding-progress-dot"></div>
        <div class="onboarding-progress-dot active"></div>
        <div class="onboarding-progress-dot"></div>
      </div>
      
      <h1 tabindex="-1">Seus dados</h1>
      <p class="text-muted mb-2">Isso ajuda a personalizar metas e calculadoras</p>
      
      <form data-form>
        <div class="field">
          <label for="name">Nome (opcional)</label>
          <input type="text" id="name" value="${formData.name}" autocomplete="name">
        </div>
        
        <div class="field">
          <label for="age">Idade <span style="color:var(--danger)">*</span></label>
          <input type="text" id="age" inputmode="numeric" required value="${formData.age ?? ''}">
        </div>
        
        <div class="field">
          <label for="sex">Sexo <span style="color:var(--danger)">*</span></label>
          <select id="sex" required>
            <option value="">Selecione</option>
            <option value="M" ${formData.sex === 'M' ? 'selected' : ''}>Masculino</option>
            <option value="F" ${formData.sex === 'F' ? 'selected' : ''}>Feminino</option>
          </select>
          <p class="field-hint">Usado apenas nas fórmulas de TMB, % gordura e FC máxima</p>
        </div>
        
        <div class="field">
          <label for="weight">Peso (kg) <span style="color:var(--danger)">*</span></label>
          <input type="text" id="weight" inputmode="decimal" required value="${formData.weightKg ?? ''}">
        </div>
        
        <div class="field">
          <label for="height">Altura (cm) <span style="color:var(--danger)">*</span></label>
          <input type="text" id="height" inputmode="numeric" required value="${formData.heightCm ?? ''}">
          <p class="field-hint">Ex: 175 (se você usa metros, multiplique por 100)</p>
        </div>
        
        <div class="flex gap-1 mt-2">
          <button type="button" class="btn btn--ghost" style="flex:1" data-back>Voltar</button>
          <button type="button" class="btn btn--ghost" style="flex:1" data-skip>Pular por agora</button>
          <button type="submit" class="btn btn--primary" style="flex:1">Continuar</button>
        </div>
      </form>
    </div>
  `;
  
  const form = ctx.el.querySelector('[data-form]');
  
  form?.querySelector('[data-back]')?.addEventListener('click', () => {
    currentScreen = 1;
    render(ctx);
  });
  
  form?.querySelector('[data-skip]')?.addEventListener('click', () => {
    currentScreen = 3;
    render(ctx);
  });
  
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(form);
    
    const nameInput = form.querySelector('#name');
    const ageInput = form.querySelector('#age');
    const sexInput = form.querySelector('#sex');
    const weightInput = form.querySelector('#weight');
    const heightInput = form.querySelector('#height');
    
    formData.name = nameInput?.value?.trim() || '';
    
    const age = parseIntBR(ageInput?.value || '');
    if (isNaN(age) || age < 10 || age > 120) {
      fieldError(ageInput, 'Digite uma idade válida entre 10 e 120 anos');
      return;
    }
    formData.age = age;
    
    const sex = sexInput?.value;
    if (sex !== 'M' && sex !== 'F') {
      fieldError(sexInput, 'Selecione o sexo');
      return;
    }
    formData.sex = sex;
    
    const weight = parseNum(weightInput?.value || '');
    if (isNaN(weight) || weight < 30 || weight > 300) {
      fieldError(weightInput, 'Digite um peso válido entre 30 e 300 kg');
      return;
    }
    formData.weightKg = weight;
    
    const height = parseIntBR(heightInput?.value || '');
    if (isNaN(height) || height < 100 || height > 250) {
      fieldError(heightInput, 'Digite uma altura válida entre 100 e 250 cm');
      return;
    }
    formData.heightCm = height;
    
    currentScreen = 3;
    render(ctx);
  });
}

// Screen 3: Objetivo
function renderScreen3(ctx) {
  const goals = [
    { id: 'perder', label: 'Perder gordura' },
    { id: 'manter', label: 'Manter o peso' },
    { id: 'ganhar', label: 'Ganhar massa muscular' },
  ];
  
  const activities = [
    { id: 'sedentario', label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
    { id: 'leve', label: 'Levemente ativo', desc: 'Exercício leve 1-3 dias/semana' },
    { id: 'moderado', label: 'Moderadamente ativo', desc: 'Exercício moderado 3-5 dias/semana' },
    { id: 'intenso', label: 'Muito ativo', desc: 'Exercício intenso 6-7 dias/semana' },
    { id: 'muito_intenso', label: 'Extremamente ativo', desc: 'Exercício muito intenso, trabalho físico' },
  ];
  
  ctx.el.innerHTML = html`
    <div class="onboarding-screen">
      <div class="onboarding-progress">
        <div class="onboarding-progress-dot"></div>
        <div class="onboarding-progress-dot"></div>
        <div class="onboarding-progress-dot active"></div>
      </div>
      
      <h1 tabindex="-1">Seu objetivo</h1>
      <p class="text-muted mb-2">Usamos isso para calcular suas metas de dieta</p>
      
      <form data-form>
        <div class="field">
          <label for="goal">Meta <span style="color:var(--danger)">*</span></label>
          <select id="goal" required>
            <option value="">Selecione</option>
            ${raw(goals.map(g => `<option value="${g.id}" ${formData.goal === g.id ? 'selected' : ''}>${g.label}</option>`).join(''))}
          </select>
        </div>
        
        <div class="field">
          <label for="activity">Nível de atividade <span style="color:var(--danger)">*</span></label>
          <select id="activity" required>
            <option value="">Selecione</option>
            ${raw(activities.map(a => `<option value="${a.id}" ${formData.activity === a.id ? 'selected' : ''}>${a.label} · ${a.desc}</option>`).join(''))}
          </select>
        </div>
        
        <div class="card mt-2" style="background:var(--bg-2);padding:1rem">
          <p style="font-size:0.875rem;margin:0;color:var(--muted)">
            ${DISCLAIMERS.health}
          </p>
        </div>
        
        <div class="flex gap-1 mt-2">
          <button type="button" class="btn btn--ghost" style="flex:1" data-back>Voltar</button>
          <button type="button" class="btn btn--ghost" style="flex:1" data-skip>Pular por agora</button>
          <button type="submit" class="btn btn--primary" style="flex:1">Entendi, começar</button>
        </div>
      </form>
    </div>
  `;
  
  const form = ctx.el.querySelector('[data-form]');
  
  form?.querySelector('[data-back]')?.addEventListener('click', () => {
    currentScreen = 2;
    render(ctx);
  });
  
  form?.querySelector('[data-skip]')?.addEventListener('click', () => {
    finish();
  });
  
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(form);
    
    const goalInput = form.querySelector('#goal');
    const activityInput = form.querySelector('#activity');
    
    const goal = goalInput?.value;
    if (!['perder', 'manter', 'ganhar'].includes(goal)) {
      fieldError(goalInput, 'Selecione sua meta');
      return;
    }
    formData.goal = goal;
    
    const activity = activityInput?.value;
    if (!['sedentario', 'leve', 'moderado', 'intenso', 'muito_intenso'].includes(activity)) {
      fieldError(activityInput, 'Selecione seu nível de atividade');
      return;
    }
    formData.activity = activity;
    
    finish();
  });
}

function finish() {
  // Salva tudo que foi preenchido
  const patch = { onboarded: true, persona: formData.persona };
  
  if (formData.name) patch.name = formData.name;
  if (formData.age) patch.age = formData.age;
  if (formData.sex) patch.sex = formData.sex;
  if (formData.goal) patch.goal = formData.goal;
  if (formData.activity) patch.activity = formData.activity;
  
  repo.profile.update(patch);
  
  // Log weight/height (B4.4 invariant)
  if (formData.weightKg && formData.heightCm) {
    repo.body.log({ weightKg: formData.weightKg, heightCm: formData.heightCm });
  } else if (formData.heightCm) {
    // Só altura, sem peso: update profile diretamente
    repo.profile.update({ heightCm: formData.heightCm });
  }
  
  // Redireciona (replace, não push, B4.4)
  location.replace('#/');
}
