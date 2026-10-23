// wakelock.js: Screen Wake Lock wrapper (B6.2.4, NFR-3)
// Sem efeitos colaterais na importação.

let _lock = null;

/**
 * Solicita o Wake Lock de tela se suportado.
 * Falha silenciosamente em dispositivos sem suporte.
 */
export async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    _lock = await navigator.wakeLock.request('screen');
    _lock.addEventListener('release', () => {
      _lock = null;
    });
  } catch (e) {
    _lock = null;
  }
}

/** Libera o Wake Lock se ativo. */
export async function releaseWakeLock() {
  if (_lock) {
    try {
      await _lock.release();
    } catch (e) {
      // ignora erro ao liberar
    }
    _lock = null;
  }
}

/** Retorna true se o Wake Lock está ativo. */
export function hasWakeLock() {
  return _lock !== null;
}
