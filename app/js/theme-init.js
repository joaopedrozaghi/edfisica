// theme-init.js: define o tema antes do CSS pintar (evita flash).
// Script clássico (não módulo) carregado no <head> antes do CSS, conforme B4.1.
// Sem importações, sem side effects além de ler o storage e setar data-theme.

(function() {
  try {
    const stored = localStorage.getItem('edf:v1:settings');
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.theme === 'light' || settings.theme === 'dark') {
        document.documentElement.dataset.theme = settings.theme;
        return;
      }
    }
  } catch (e) {
    // storage indisponível ou JSON inválido: deixa no padrão dark (CSS)
  }
  // Padrão: dark (CSS já define, mas setamos explicitamente para consistência)
  document.documentElement.dataset.theme = 'dark';
})();
