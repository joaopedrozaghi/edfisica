// sw.js: service worker (B8.2)
// Network-first para navigation e config, cache-first para o resto, offline após first load

const VERSION = 'edf-v1.5.0';
const TIMEOUT_MS = 3000;

/*PRECACHE-START*/
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css",
  "./js/theme-init.js",
  "./js/main.js",
  "./js/router.js",
  "./js/store.js",
  "./js/repo.js",
  "./js/calc.js",
  "./js/charts.js",
  "./js/ui.js",
  "./js/utils.js",
  "./js/access.js",
  "./js/auth.js",
  "./js/login.js",
  "./js/icons.js",
  "./js/modules/onboarding.js",
  "./js/modules/home.js",
  "./js/modules/mais.js",
  "./js/modules/perfil.js",
  "./js/modules/estudos.js",
  "./js/modules/simulado.js",
  "./js/modules/dieta.js",
  "./js/modules/imc.js",
  "./js/modules/avaliacao.js",
  "./js/modules/progresso.js",
  "./data/subjects/index.js",
  "./data/subjects/anatomia.js",
  "./data/subjects/fisiologia.js",
  "./data/subjects/treinamento.js",
  "./data/subjects/primeiros-socorros.js",
  "./data/subjects/avaliacao.js",
  "./data/subjects/regras-esportes.js",
  "./data/exercises.js",
  "./data/programs.js",
  "./data/foods.js",
  "./data/meal-plans.js",
  "./js/audio.js",
  "./js/wakelock.js",
  "./js/modules/treino.js",
  "./js/modules/player.js",
  "./icons/icon.svg",
  "../config.js"
];
/*PRECACHE-END*/

// ---------------------------------------------------------------------
// Install: cache precache list
// ---------------------------------------------------------------------

self.addEventListener('install', (event) => {
  console.info('[sw] install', VERSION);
  event.waitUntil(
    caches.open(VERSION).then(async (cache) => {
      // Redirecionamentos precisam ser re-wrapped (B8.2)
      const responses = await Promise.all(
        PRECACHE.map((url) =>
          fetch(url).then((res) => {
            if (res.redirected) {
              return Response.redirect(res.url, 302);
            }
            return res;
          })
        )
      );
      
      await Promise.all(
        PRECACHE.map((url, i) => cache.put(url, responses[i]))
      );
      
      console.info(`[sw] ${PRECACHE.length} arquivos em cache`);
    })
  );
});

// ---------------------------------------------------------------------
// Activate: limpa caches antigos + claim
// ---------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  console.info('[sw] activate', VERSION);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== VERSION)
          .map((key) => {
            console.info('[sw] apagando cache antigo', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------
// Fetch: network-first para navigation e config, cache-first para o resto
// ---------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Navigation: network-first com timeout e fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      networkFirstWithTimeout(event.request, TIMEOUT_MS)
        .catch(() => caches.match('./'))
        .catch(() => caches.match('./index.html'))
        .catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }
  
  // config.js: network-first (sem timeout longo, pode mudar)
  if (url.pathname.endsWith('/config.js') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      networkFirstWithTimeout(event.request, TIMEOUT_MS)
        .catch(() => caches.match(event.request))
        .catch(() => fetch(event.request))
    );
    return;
  }
  
  // Tudo mais: cache-first (app files)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        // Cacheia responses ok
        if (res.ok && url.origin === location.origin) {
          const clone = res.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, clone));
        }
        return res;
      });
    })
  );
});

// ---------------------------------------------------------------------
// SKIP_WAITING message (B8.2)
// ---------------------------------------------------------------------

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.info('[sw] SKIP_WAITING');
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function networkFirstWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    ),
  ]);
}
