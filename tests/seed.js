// seed.js: popula localStorage para testes (B11.2)
// Params: reset=1, profile=none, persona=<id>, theme=light, to=<urlencoded hash>

const params = new URLSearchParams(location.search);

if (params.get('reset') === '1') {
  // Limpa tudo exceto access
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('edf:v1:') && key !== 'edf:v1:access') {
      localStorage.removeItem(key);
    }
  }
}

// Profile
const profileMode = params.get('profile');
if (profileMode !== 'none') {
  const persona = params.get('persona') || 'casa';
  const profile = {
    onboarded: true,
    persona,
    name: 'Teste',
    age: 30,
    sex: 'M',
    weightKg: 80,
    heightCm: 180,
    goal: 'manter',
    activity: 'moderado',
    createdAt: Date.now(),
  };
  localStorage.setItem('edf:v1:profile', JSON.stringify(profile));
  
  // Body entry correspondente (B4.4 invariant)
  const dateKey = new Date().toISOString().slice(0, 10);
  const bmi = Math.round((80 / ((180 / 100) ** 2)) * 10) / 10;
  const body = [{ date: dateKey, weightKg: 80, heightCm: 180, bmi }];
  localStorage.setItem('edf:v1:body', JSON.stringify(body));
}

// Theme
const theme = params.get('theme');
if (theme === 'light' || theme === 'dark') {
  const settings = JSON.parse(localStorage.getItem('edf:v1:settings') || '{}');
  settings.theme = theme;
  localStorage.setItem('edf:v1:settings', JSON.stringify(settings));
}

// Redirect
const to = params.get('to') || '';
const target = '../app/index.html' + (to ? decodeURIComponent(to) : '');

document.getElementById('status').textContent = 'Seed ok, redirecting...';
setTimeout(() => {
  location.replace(target);
}, 100);
