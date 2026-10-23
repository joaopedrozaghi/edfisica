// audio.js: Web Audio beeps para o player de treino (B6.2.4)
// beep(type): 'prepare' | 'countdown' | 'start' | 'rest' | 'end'
// Sem efeitos colaterais na importação.

let _ctx = null;

/** Lazy-init do AudioContext (compatibilidade Safari 15). */
function getCtx() {
  if (_ctx) return _ctx;
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    _ctx = null;
  }
  return _ctx;
}

/**
 * Toca um beep curto.
 * @param {'prepare'|'countdown'|'start'|'rest'|'end'} type
 */
export function beep(type) {
  try {
    const c = getCtx();
    if (!c) return;
    // Safari pode suspender o contexto; tenta retomar
    if (c.state === 'suspended') {
      c.resume().catch(() => {});
    }
    const configs = {
      prepare:   { freq: 660,  dur: 0.12, vol: 0.28 },
      countdown: { freq: 880,  dur: 0.10, vol: 0.30 },
      start:     { freq: 1047, dur: 0.22, vol: 0.45 },
      rest:      { freq: 440,  dur: 0.28, vol: 0.38 },
      end:       { freq: 1047, dur: 0.45, vol: 0.50 },
    };
    const cfg = configs[type] || configs.countdown;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.value = cfg.freq;
    gain.gain.setValueAtTime(cfg.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.dur);
    osc.start(now);
    osc.stop(now + cfg.dur + 0.01);
  } catch (e) {
    // Web Audio não disponível ou bloqueado; falha silenciosa
  }
}

/** Sequência de 3-2-1 beeps (300 ms entre cada). Retorna Promise. */
export function countdown321() {
  return new Promise((resolve) => {
    let n = 3;
    function tick() {
      beep('countdown');
      n--;
      if (n > 0) setTimeout(tick, 300);
      else setTimeout(resolve, 300);
    }
    tick();
  });
}
