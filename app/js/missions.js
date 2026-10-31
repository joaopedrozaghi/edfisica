// missions.js: missão do dia, nível (XP) e conquistas.
// Tudo calculado a partir dos dados que o app já guarda; só o "estudou hoje"
// fica numa chave própria ('missions'), que também entra no backup.
// Sem efeitos colaterais na importação.

import { store } from './store.js';
import { repo } from './repo.js';
import { dateKey } from './utils.js';
import * as calc from './calc.js';

const KEEP_DAYS = 120;

function load() {
  const m = store.get('missions', {});
  return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
}

/** Marca que a pessoa estudou hoje (quiz, flashcards ou simulado concluído). */
export function markStudy() {
  const m = load();
  const k = dateKey();
  m[k] = Object.assign({}, m[k], { study: true });
  const keys = Object.keys(m).sort();
  while (keys.length > KEEP_DAYS) delete m[keys.shift()];
  store.set('missions', m);
}

/** As 3 missões de hoje e quantas foram feitas. */
export function todayMissions() {
  const k = dateKey();
  const studied = !!(load()[k] && load()[k].study);
  const trained = repo.workouts.listLogs().some((l) => l.date === k);
  const water = !!repo.habits.getDay(k).waterGoalHit;
  const items = [
    { id: 'study', label: 'Estudar uma matéria', hint: 'Termine um quiz ou uma rodada de flashcards', done: studied, href: '#/estudos' },
    { id: 'workout', label: 'Fazer um treino', hint: 'Qualquer treino pronto ou montado conta', done: trained, href: '#/treino/programas' },
    { id: 'water', label: 'Bater a meta de água', hint: 'Use o + no card de água', done: water, href: '#/' },
  ];
  return { items, done: items.filter((i) => i.done).length, total: items.length };
}

/** Números gerais usados no nível e nas conquistas. */
export function stats() {
  const study = repo.study.get();
  const subjects = Object.values(study.quiz || {});
  const answered = subjects.reduce((s, q) => s + (q.answered || 0), 0);
  const correct = subjects.reduce((s, q) => s + (q.correct || 0), 0);
  const logs = repo.workouts.listLogs();
  const activeDays = repo.activity.keys();
  const streak = activeDays.length ? calc.streak(activeDays, dateKey()) : 0;
  const studyDays = Object.values(load()).filter((d) => d && d.study).length;
  const simulados = repo.study.listSimulados ? repo.study.listSimulados().length : 0;
  const cardsSeen = Object.keys(study.cards || {}).length;
  return { answered, correct, accuracy: answered ? Math.round((correct / answered) * 100) : 0, workouts: logs.length, minutes: logs.reduce((s, l) => s + (l.durationMin || Math.round((l.durationSec || 0) / 60)), 0), activeDays: activeDays.length, streak, studyDays, simulados, cardsSeen };
}

const LEVELS = ['Iniciante', 'Em ritmo', 'Dedicado', 'Focado', 'Atleta', 'Elite', 'Lenda'];

/** XP e nível: cada coisa feita no app soma pontos. */
export function level(s = stats()) {
  const xp = s.workouts * 50 + s.answered * 5 + s.cardsSeen * 2 + s.studyDays * 20 + s.activeDays * 15 + s.simulados * 40;
  // Nível n começa em 100 * n * (n - 1) / 2 XP (100, 300, 600, 1000...)
  let n = 1;
  while (xp >= 100 * n * (n + 1) / 2) n++;
  const start = 100 * (n - 1) * n / 2;
  const next = 100 * n * (n + 1) / 2;
  return { xp, n, title: LEVELS[Math.min(n - 1, LEVELS.length - 1)], into: xp - start, need: next - start, pct: Math.round(((xp - start) / (next - start)) * 100) };
}

/** Conquistas: { id, title, desc, icon, done, progress } */
export function achievements(s = stats()) {
  const prog = (v, goal) => ({ done: v >= goal, progress: `${Math.min(v, goal)}/${goal}` });
  return [
    { id: 'first-workout', title: 'Primeiro treino', desc: 'Conclua um treino', icon: 'dumbbell', ...prog(s.workouts, 1) },
    { id: 'workouts-10', title: 'Pegou o ritmo', desc: 'Conclua 10 treinos', icon: 'flame', ...prog(s.workouts, 10) },
    { id: 'streak-3', title: '3 dias seguidos', desc: 'Use o app 3 dias em sequência', icon: 'flame', ...prog(s.streak, 3) },
    { id: 'streak-7', title: 'Semana perfeita', desc: '7 dias seguidos', icon: 'chart', ...prog(s.streak, 7) },
    { id: 'answers-50', title: 'Estudioso', desc: 'Responda 50 questões', icon: 'book', ...prog(s.answered, 50) },
    { id: 'accuracy-80', title: 'Mira certeira', desc: '80% de acerto (mín. 20 questões)', icon: 'clipboard', done: s.answered >= 20 && s.accuracy >= 80, progress: s.answered >= 20 ? `${s.accuracy}%` : `${s.answered}/20` },
    { id: 'simulado-1', title: 'Hora da prova', desc: 'Faça um simulado', icon: 'timer', ...prog(s.simulados, 1) },
    { id: 'minutes-120', title: '2 horas de suor', desc: 'Some 120 minutos de treino', icon: 'heart', ...prog(s.minutes, 120) },
  ];
}
