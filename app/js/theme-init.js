// theme-init.js: define o tema antes do CSS pintar (evita flash).
// Script clássico (não módulo) carregado no <head> antes do CSS.
// Lê as preferências da conta logada (edf:u:<id>:settings).

(function() {
  try {
    var session = JSON.parse(localStorage.getItem('edf:auth:session') || 'null');
    var key = session && session.id ? 'edf:u:' + session.id + ':settings' : 'edf:v1:settings';
    var stored = localStorage.getItem(key);
    if (stored) {
      var settings = JSON.parse(stored);
      if (settings.theme === 'light' || settings.theme === 'dark') {
        document.documentElement.dataset.theme = settings.theme;
        return;
      }
    }
  } catch (e) {
    // storage indisponível ou JSON inválido: fica no escuro
  }
  document.documentElement.dataset.theme = 'dark';
})();
