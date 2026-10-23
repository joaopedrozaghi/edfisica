// programs.js: 5 programas prontos de treino em casa (B6.2.2)
// Cada programa tem itens com exerciseId, sets, workSec, restSec.
// O player usa esses valores para montar a timeline de fases.

export const PROGRAMS = [
  {
    id: 'full-body-iniciante',
    name: 'Full Body Iniciante',
    description: 'Treino completo para quem está começando. Cobre todos os grupos musculares com exercícios básicos e pauses confortáveis.',
    level: 'iniciante',
    durationMin: 25,
    emoji: '💪',
    prepareSec: 10,
    items: [
      { exerciseId: 'agachamento-livre',    sets: 3, workSec: 40, restSec: 30 },
      { exerciseId: 'flexao-inclinada',     sets: 3, workSec: 30, restSec: 30 },
      { exerciseId: 'ponte-gluteo',         sets: 3, workSec: 40, restSec: 25 },
      { exerciseId: 'prancha',              sets: 3, workSec: 25, restSec: 25 },
      { exerciseId: 'afundo',               sets: 3, workSec: 40, restSec: 30 },
      { exerciseId: 'abdominal',            sets: 3, workSec: 30, restSec: 25 },
    ],
  },
  {
    id: 'hiit-15min',
    name: 'HIIT 15 min',
    description: 'Alta intensidade em pouco tempo. Intervalos curtos entre exercícios para elevar o ritmo cardíaco e queimar calorias.',
    level: 'avancado',
    durationMin: 15,
    emoji: '🔥',
    prepareSec: 10,
    items: [
      { exerciseId: 'burpee',               sets: 4, workSec: 30, restSec: 15 },
      { exerciseId: 'agachamento-salto',    sets: 4, workSec: 30, restSec: 15 },
      { exerciseId: 'mountain-climber',     sets: 4, workSec: 30, restSec: 15 },
      { exerciseId: 'polichinelo',          sets: 4, workSec: 30, restSec: 15 },
      { exerciseId: 'corrida-parada',       sets: 4, workSec: 30, restSec: 15 },
    ],
  },
  {
    id: 'mobilidade',
    name: 'Mobilidade',
    description: 'Sequência de exercícios focada em amplitude de movimento e bem-estar articular. Ideal para qualquer horário do dia.',
    level: 'iniciante',
    durationMin: 20,
    emoji: '🧘',
    prepareSec: 10,
    items: [
      { exerciseId: 'alongamento-gato-camelo', sets: 3, workSec: 45, restSec: 20 },
      { exerciseId: 'bird-dog',                sets: 3, workSec: 40, restSec: 20 },
      { exerciseId: 'ponte-gluteo',            sets: 3, workSec: 45, restSec: 20 },
      { exerciseId: 'prancha',                 sets: 2, workSec: 30, restSec: 20 },
      { exerciseId: 'prancha-lateral',         sets: 2, workSec: 25, restSec: 20 },
      { exerciseId: 'panturrilha-pe',          sets: 2, workSec: 40, restSec: 20 },
    ],
  },
  {
    id: 'core',
    name: 'Core',
    description: 'Trabalho focado na musculatura central para fortalecer o abdômen, oblíquos e estabilizadores.',
    level: 'intermediario',
    durationMin: 20,
    emoji: '🎯',
    prepareSec: 10,
    items: [
      { exerciseId: 'prancha',            sets: 3, workSec: 40, restSec: 20 },
      { exerciseId: 'prancha-lateral',    sets: 3, workSec: 30, restSec: 20 },
      { exerciseId: 'abdominal',          sets: 4, workSec: 35, restSec: 20 },
      { exerciseId: 'abdominal-infra',    sets: 3, workSec: 35, restSec: 20 },
      { exerciseId: 'mountain-climber',   sets: 3, workSec: 35, restSec: 20 },
      { exerciseId: 'escalador',          sets: 3, workSec: 35, restSec: 20 },
    ],
  },
  {
    id: 'terceira-idade',
    name: 'Terceira Idade',
    description: 'Treino suave de baixo impacto para mobilidade, equilíbrio e força funcional. Pode ser feito com apoio de cadeira.',
    level: 'iniciante',
    durationMin: 20,
    emoji: '🌿',
    prepareSec: 10,
    items: [
      { exerciseId: 'alongamento-gato-camelo', sets: 2, workSec: 50, restSec: 30 },
      { exerciseId: 'agachamento-livre',       sets: 3, workSec: 35, restSec: 30 },
      { exerciseId: 'panturrilha-pe',          sets: 3, workSec: 35, restSec: 25 },
      { exerciseId: 'ponte-gluteo',            sets: 3, workSec: 40, restSec: 30 },
      { exerciseId: 'bird-dog',                sets: 3, workSec: 35, restSec: 25 },
      { exerciseId: 'superman',                sets: 2, workSec: 30, restSec: 25 },
    ],
  },
];

/** Mapa id → programa para lookup rápido. */
export const PROGRAMS_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));
