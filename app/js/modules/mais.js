// mais.js: grid de tiles para Mais (<1024px, B6.0)
// Sem efeitos colaterais na importação

import { html, raw } from '../ui.js';

export async function main(ctx) {
  const tiles = [
    { href: '#/estudos', icon: '📚', title: 'Estudos para Prova', desc: 'Resumos, flashcards e quiz por matéria' },
    { href: '#/simulado', icon: '⏱️', title: 'Simulado', desc: 'Prova cronometrada com gabarito e histórico' },
    { href: '#/imc', icon: '⚖️', title: 'Teste de IMC', desc: 'Calcule seu Índice de Massa Corporal' },
    { href: '#/avaliacao', icon: '📏', title: 'Avaliação Física', desc: '% gordura, RCQ, FC e 1RM' },
    { href: '#/progresso', icon: '📈', title: 'Progresso', desc: 'Veja sua evolução e estatísticas' },
    { href: '#/perfil', icon: '👤', title: 'Perfil', desc: 'Dados pessoais, backup e configurações' },
  ];
  
  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Mais</h1>
    <p class="text-muted mb-2">Ferramentas, avaliações e configurações</p>
    
    <div style="display:grid;gap:1rem;margin-top:2rem">
      ${raw(tiles.map(tile => `
        <a href="${tile.href}" class="list-item">
          <div class="list-item-icon">${tile.icon}</div>
          <div class="list-item-content">
            <div class="list-item-title">${tile.title}</div>
            <div class="list-item-subtitle">${tile.desc}</div>
          </div>
          <div class="list-item-action">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 4l6 6-6 6"/>
            </svg>
          </div>
        </a>
      `).join(''))}
    </div>
  `;
  
  return {};
}
