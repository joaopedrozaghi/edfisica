// ui.js: helpers de renderização e UI (B4.3, B6.10)
// html``, toast, modal/sheet, confirm, empty state, field errors, disclaimers

import { esc as escapeHTML } from './utils.js';
import { CONFIG } from '../../config.js';

// Re-exporta esc do utils (fica disponível aqui para ser usado pelos módulos)
export { escapeHTML as esc };

// ---------------------------------------------------------------------
// html`` tagged template: auto-escapa interpolações (B4.3)
// ---------------------------------------------------------------------

export function html(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const val = values[i];
      if (val && val.__raw) {
        result += val.content; // raw(): não escapar (HTML gerado por nós)
      } else {
        result += escapeHTML(String(val ?? ''));
      }
    }
  }
  return result;
}

// raw(): marca HTML confiável (só para output de funções próprias: SVG de charts/figure)
export function raw(content) {
  return { __raw: true, content };
}

// ---------------------------------------------------------------------
// Toast (max 3 simultâneos, B5.3)
// ---------------------------------------------------------------------

let toastContainer = null;
const activeToasts = [];

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('role', 'status');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(message, { type = 'info', action, duration = 3500 } = {}) {
  const container = ensureToastContainer();
  
  // Remove o mais antigo se já temos 3
  if (activeToasts.length >= 3) {
    const oldest = activeToasts.shift();
    oldest.el.remove();
    clearTimeout(oldest.timer);
  }
  
  const el = document.createElement('div');
  el.className = `toast${type === 'success' ? ' toast--success' : ''}${type === 'error' ? ' toast--error' : ''}`;
  
  // Erro usa role="alert" para leitura imediata
  if (type === 'error') {
    el.setAttribute('role', 'alert');
  }
  
  const content = document.createElement('div');
  content.className = 'toast-content';
  content.textContent = message;
  el.appendChild(content);
  
  if (action) {
    const btn = document.createElement('button');
    btn.className = 'btn btn--small btn--ghost toast-action';
    btn.textContent = action.label;
    btn.onclick = () => {
      action.fn();
      removeToast(entry);
    };
    el.appendChild(btn);
  }
  
  container.appendChild(el);
  
  const timer = setTimeout(() => removeToast(entry), duration);
  const entry = { el, timer };
  activeToasts.push(entry);
}

function removeToast(entry) {
  const idx = activeToasts.indexOf(entry);
  if (idx >= 0) {
    activeToasts.splice(idx, 1);
    entry.el.remove();
    clearTimeout(entry.timer);
  }
}

// ---------------------------------------------------------------------
// Sheet (bottom sheet / modal dialog, role="dialog" com focus trap, B4.3)
// ---------------------------------------------------------------------

let openSheetData = null;

export function openSheet(contentHtml, { title = '' } = {}) {
  // Fecha qualquer sheet já aberto
  closeSheet();
  
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.onclick = (e) => {
    if (e.target === backdrop) closeSheet();
  };
  
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  if (title) sheet.setAttribute('aria-label', title);
  
  let headerHtml = '';
  if (title) {
    headerHtml = `
      <div class="sheet-header">
        <h2 class="sheet-title">${escapeHTML(title)}</h2>
        <button type="button" class="sheet-close" aria-label="Fechar" data-sheet-close>
          <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    `;
  }
  
  sheet.innerHTML = `
    ${headerHtml}
    <div class="sheet-body">${contentHtml}</div>
  `;
  
  const closeBtn = sheet.querySelector('[data-sheet-close]');
  if (closeBtn) {
    closeBtn.onclick = () => closeSheet();
  }
  
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  
  // Focus trap: captura Tab, Esc
  const focusable = sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstFocusable = focusable[0];
  const lastFocusable = focusable[focusable.length - 1];
  
  const trapFocus = (e) => {
    if (e.key === 'Escape') {
      closeSheet();
      return;
    }
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }
  };
  
  sheet.addEventListener('keydown', trapFocus);
  
  // Guarda o elemento ativo para retornar o foco ao fechar
  const previousFocus = document.activeElement;
  firstFocusable?.focus();
  
  openSheetData = { backdrop, sheet, previousFocus };
}

export function closeSheet() {
  if (!openSheetData) return;
  const { backdrop, previousFocus } = openSheetData;
  backdrop.remove();
  previousFocus?.focus();
  openSheetData = null;
}

// ---------------------------------------------------------------------
// Confirm dialog (retorna Promise<boolean>)
// ---------------------------------------------------------------------

export function confirmDialog(text, { confirmLabel = 'Confirmar', danger = false } = {}) {
  return new Promise((resolve) => {
    const contentHtml = `
      <p style="margin-bottom: 2rem;">${escapeHTML(text)}</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn--ghost" data-action="cancel">Cancelar</button>
        <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-action="confirm">${escapeHTML(confirmLabel)}</button>
      </div>
    `;
    
    openSheet(contentHtml, { title: 'Confirmação' });
    
    const backdrop = openSheetData?.backdrop;
    if (!backdrop) {
      resolve(false);
      return;
    }
    
    backdrop.onclick = (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'confirm') {
        closeSheet();
        resolve(true);
      } else if (action === 'cancel' || e.target === backdrop) {
        closeSheet();
        resolve(false);
      }
    };
  });
}

// ---------------------------------------------------------------------
// Empty state (B4.3)
// ---------------------------------------------------------------------

export function emptyState({ emoji, title, text, action }) {
  let actionHtml = '';
  if (action) {
    if (action.href) {
      actionHtml = `<a href="${escapeHTML(action.href)}" class="btn btn--primary">${escapeHTML(action.label)}</a>`;
    } else if (action.fn) {
      // Para actions com fn, o caller renderiza o empty + adiciona listener
      actionHtml = `<button type="button" class="btn btn--primary" data-empty-action>${escapeHTML(action.label)}</button>`;
    }
  }
  
  return html`
    <div class="empty">
      ${emoji ? raw(`<div class="empty-emoji">${emoji}</div>`) : ''}
      <h1 class="empty-title" tabindex="-1">${title}</h1>
      ${text ? raw(`<p class="empty-text">${escapeHTML(text)}</p>`) : ''}
      ${raw(actionHtml)}
    </div>
  `;
}

// ---------------------------------------------------------------------
// Not found (padrão para :param desconhecidos, B4.5)
// ---------------------------------------------------------------------

export function notFound(parentHref) {
  return emptyState({
    emoji: '🔎',
    title: 'Conteúdo não encontrado',
    text: 'Este item não existe ou foi removido.',
    action: { label: 'Voltar', href: parentHref },
  });
}

// ---------------------------------------------------------------------
// Import error state (erro de dynamic import, B4.5)
// ---------------------------------------------------------------------

export function importErrorState(retryFn) {
  const contentHtml = `
    <div class="empty">
      <div class="empty-emoji">⚠️</div>
      <h1 class="empty-title" tabindex="-1">Não foi possível carregar esta tela</h1>
      <p class="empty-text">Verifique sua conexão com a internet.</p>
      <button type="button" class="btn btn--primary" data-retry>Tentar novamente</button>
    </div>
  `;
  return { contentHtml, retryFn };
}

// ---------------------------------------------------------------------
// Field errors (B4.3)
// ---------------------------------------------------------------------

export function fieldError(input, message) {
  clearErrors(input.form || input.closest('form'));
  
  input.setAttribute('aria-invalid', 'true');
  
  const errId = `${input.id || 'field'}-err`;
  const existing = document.getElementById(errId);
  if (existing) {
    existing.textContent = message;
  } else {
    const p = document.createElement('p');
    p.id = errId;
    p.className = 'field-error';
    p.textContent = message;
    input.parentElement?.appendChild(p);
    input.setAttribute('aria-describedby', errId);
  }
}

export function clearErrors(form) {
  if (!form) return;
  
  form.querySelectorAll('[aria-invalid="true"]').forEach((input) => {
    input.removeAttribute('aria-invalid');
    const errId = input.getAttribute('aria-describedby');
    if (errId) {
      document.getElementById(errId)?.remove();
      input.removeAttribute('aria-describedby');
    }
  });
}

// ---------------------------------------------------------------------
// Skeleton (loading placeholder após 150ms, B6.0)
// ---------------------------------------------------------------------

export function showSkeleton(container, type = 'card') {
  const timer = setTimeout(() => {
    if (type === 'card') {
      container.innerHTML = `
        <div class="skeleton skeleton-heading"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:80%"></div>
        <div class="skeleton skeleton-card" style="margin-top:1rem"></div>
      `;
    } else {
      container.innerHTML = `
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:90%"></div>
        <div class="skeleton skeleton-text" style="width:70%"></div>
      `;
    }
  }, 150);
  
  return () => clearTimeout(timer);
}

// ---------------------------------------------------------------------
// openExternal / shareWhatsApp (B4.3)
// ---------------------------------------------------------------------

export function openExternal(url) {
  const w = window.open(url, '_blank');
  if (w) {
    try { w.opener = null; } catch (e) { /* ignore */ }
  } else {
    location.href = url;
  }
}

export function shareWhatsApp(text) {
  openExternal('https://wa.me/?text=' + encodeURIComponent(text));
}

// ---------------------------------------------------------------------
// DISCLAIMERS (B6.10)
// ---------------------------------------------------------------------

export const DISCLAIMERS = Object.freeze({
  health: `Este app tem caráter educativo e não substitui a orientação de profissionais de Educação Física, médicos ou nutricionistas. Consulte um profissional antes de iniciar qualquer programa de exercícios ou dieta.`,
  
  diet: `A calculadora fornece estimativas baseadas em fórmulas padrão. Suas necessidades reais podem variar. Para um plano alimentar personalizado, consulte um nutricionista.`,
  
  imc: `O IMC é apenas um indicador inicial e não considera composição corporal. Atletas e pessoas com muita massa muscular podem ter IMC elevado sem excesso de gordura.`,
  
  bodyFat: `As fórmulas estimam o percentual de gordura por medidas. Para uma avaliação precisa, procure um profissional com equipamento especializado (DEXA, bioimpedância profissional).`,
  
  exercises: `Antes de começar qualquer treino, consulte um médico, especialmente se você tem problemas de saúde. Pare imediatamente se sentir dor, tontura ou falta de ar.`,
  
  children: `Programas de exercícios para crianças e adolescentes devem ser supervisionados por um profissional de Educação Física ou pediatra.`,
  
  elderly: `Se você tem mais de 60 anos ou condições de saúde, consulte um médico antes de iniciar exercícios.`,
});
