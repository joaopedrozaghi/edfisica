// mais.js: conta + atalhos para as outras ferramentas.
// Sem efeitos colaterais na importação

import { html, raw, confirmDialog } from '../ui.js';
import { icon } from '../icons.js';
import { currentUser, signOut } from '../auth.js';

export async function main(ctx) {
  const user = currentUser();
  const tiles = [
    { href: '#/estudos', icon: 'book', title: 'Estudos', desc: 'Resumos, flashcards e quiz' },
    { href: '#/simulado', icon: 'timer', title: 'Simulado', desc: 'Prova com tempo e gabarito' },
    { href: '#/imc', icon: 'scale', title: 'IMC', desc: 'Seu índice em segundos' },
    { href: '#/avaliacao', icon: 'ruler', title: 'Avaliação', desc: '% gordura, RCQ, FC e 1RM' },
    { href: '#/progresso', icon: 'chart', title: 'Progresso', desc: 'Sua evolução' },
    { href: '#/perfil', icon: 'user', title: 'Perfil', desc: 'Dados, tema e backup' },
  ];

  ctx.el.innerHTML = html`
    <h1 tabindex="-1">Mais</h1>

    ${user ? raw(`
      <div class="account-row">
        <span class="avatar">${(user.name || '?').trim().charAt(0).toUpperCase()}</span>
        <div class="grow"><strong></strong><span></span></div>
        <button type="button" class="logout-btn" data-logout>${icon('logout', 16)} Sair</button>
      </div>`) : ''}

    <div class="tiles">
      ${raw(tiles.map((t) => `
        <a href="${t.href}" class="tile">
          <span class="list-item-icon">${icon(t.icon, 20)}</span>
          <div><strong>${t.title}</strong><span>${t.desc}</span></div>
        </a>`).join(''))}
    </div>
  `;

  if (user) {
    // Nome e e-mail entram como texto (nunca como HTML)
    ctx.el.querySelector('.account-row strong').textContent = user.name;
    ctx.el.querySelector('.account-row .grow span').textContent = user.email;
    ctx.el.querySelector('[data-logout]').addEventListener('click', async () => {
      const ok = await confirmDialog('Sair da sua conta neste aparelho? Seu progresso continua salvo.', { confirmLabel: 'Sair' });
      if (!ok) return;
      signOut();
      location.replace(location.pathname + '#/');
      location.reload();
    });
  }

  return {};
}
