// repo.test.js: API de domínio e invariantes (B4.4, B4.7, B6.7, B6.9, B11.1).
import { test, assert, eq, throws } from './harness.js';
import { store, createMemoryBackend } from '../app/js/store.js';
import { repo, MEALS, MEAL_KEYS, CAPS } from '../app/js/repo.js';
import * as calc from '../app/js/calc.js';
import { addDays, dateKey } from '../app/js/utils.js';

// Relógio controlado: "hoje" começa em 2025-05-12 10:00 local.
let now = new Date(2025, 4, 12, 10, 0);
const setDay = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  now = new Date(y, m - 1, d, 10, 0);
};

function fresh(day = '2025-05-12') {
  setDay(day);
  store.init({ backend: createMemoryBackend(), onWarn: null, onError: null });
  repo.init({ clock: () => now });
}

const COMPLETE = { age: 30, sex: 'M', heightCm: 180, goal: 'manter', activity: 'moderado' };

test('MEALS: 6 refeições fixas', () => {
  eq(MEAL_KEYS, ['cafe', 'lanche1', 'almoco', 'lanche2', 'jantar', 'ceia']);
  eq(MEALS[0].label, 'Café da manhã');
  eq(MEALS[5].label, 'Ceia');
});

test('profile: padrões, update e chave desconhecida', () => {
  fresh();
  const p = repo.profile.get();
  eq(p.onboarded, false);
  eq(p.persona, null);
  eq(p.name, '');
  eq(p.weightKg, null);
  repo.profile.update({ name: 'Ana', persona: 'casa' });
  eq(repo.profile.get().name, 'Ana');
  assert(typeof repo.profile.get().createdAt === 'number', 'createdAt não foi definido');
  throws(() => repo.profile.update({ inventado: 1 }), RangeError);
  eq(repo.profile.isComplete(), false);
  repo.profile.update(Object.assign({ weightKg: 80 }, COMPLETE));
  eq(repo.profile.isComplete(), true);
});

test('body.log atualiza o perfil e sobrescreve o mesmo dia', () => {
  fresh();
  repo.profile.update({ heightCm: 175 });
  const e = repo.body.log({ weightKg: 70 });
  eq(e.date, '2025-05-12');
  eq(e.bmi, 22.9);
  eq(repo.profile.get().weightKg, 70);
  repo.body.log({ weightKg: 71, heightCm: 176 });
  eq(repo.body.list().length, 1);
  eq(repo.body.list()[0].weightKg, 71);
  eq(repo.profile.get().heightCm, 176);
  throws(() => repo.body.log({}), RangeError);
});

test('body.log sem altura usa a do perfil; sem nenhuma, bmi null', () => {
  fresh();
  const e = repo.body.log({ weightKg: 70 });
  eq(e.bmi, null);
  eq(e.heightCm, null);
  repo.profile.update({ heightCm: 175 });
  setDay('2025-05-13');
  const e2 = repo.body.log({ weightKg: 70 });
  eq(e2.heightCm, 175);
  eq(e2.bmi, 22.9);
});

test('invariante do peso: 80 → 78 → remove → 80 (metas e água recalculadas)', () => {
  fresh('2025-05-11');
  repo.profile.update(COMPLETE);
  repo.body.log({ weightKg: 80 });
  setDay('2025-05-12');
  repo.body.log({ weightKg: 78 });
  eq(repo.profile.get().weightKg, 78);
  eq(repo.body.remove('2025-05-12'), true);
  eq(repo.profile.get().weightKg, 80);
  eq(repo.diet.getTargets().bmr, 1780);
  eq(repo.habits.waterGoal().ml, 2800);
  // remover a última restante deixa a lista vazia e o perfil intacto
  eq(repo.body.remove('2025-05-11'), true);
  eq(repo.body.list(), []);
  eq(repo.profile.get().weightKg, 80);
  eq(repo.body.remove('2025-05-11'), false);
});

test('body.remove de entrada que não é a mais recente não mexe no perfil', () => {
  fresh('2025-05-10');
  repo.profile.update(COMPLETE);
  repo.body.log({ weightKg: 82 });
  setDay('2025-05-12');
  repo.body.log({ weightKg: 79 });
  repo.body.remove('2025-05-10');
  eq(repo.profile.get().weightKg, 79);
  eq(repo.body.list().length, 1);
});

test('metas: recalculam com o perfil; ficam com override; perfil incompleto → null', () => {
  fresh();
  eq(repo.diet.getTargets(), null);
  repo.profile.update({ age: 30, sex: 'M' }); // incompleto: não lança
  eq(repo.diet.getTargets(), null);
  repo.profile.update(COMPLETE);
  repo.body.log({ weightKg: 80 });
  const t = repo.diet.getTargets();
  eq(t.kcal, 2759);
  eq(t.bmr, 1780);
  eq(t.tdee, 2759);
  eq([t.prot, t.carb, t.gord], [128, 389, 77]);
  eq(t.override, false);
  eq(t.splitPct, null);
  repo.profile.update({ goal: 'perder' });
  eq(repo.diet.getTargets().kcal, Math.round(2759 * 0.8));
  const m = repo.diet.setManualTargets({ kcal: 2000, splitPct: { prot: 30, carb: 45, gord: 25 } });
  eq(m.override, true);
  eq([m.prot, m.carb, m.gord], [150, 225, 56]);
  repo.profile.update({ goal: 'ganhar' });
  eq(repo.diet.getTargets().kcal, 2000);
  const back = repo.diet.clearOverride();
  eq(back.override, false);
  eq(back.kcal, Math.round(2759 * 1.1));
  repo.profile.update({ activity: null });
  eq(repo.diet.getTargets(), null);
});

test('waterGoal: manual → automático → padrão', () => {
  fresh();
  eq(repo.habits.waterGoal(), { ml: 2000, source: 'padrao' });
  repo.body.log({ weightKg: 80 });
  eq(repo.habits.waterGoal(), { ml: 2800, source: 'auto' });
  repo.habits.setGoals({ waterMl: 3000 });
  eq(repo.habits.waterGoal(), { ml: 3000, source: 'manual' });
  repo.habits.setGoals({ waterMl: null });
  eq(repo.habits.waterGoal().source, 'auto');
});

test('addWater/undoWater e goalJustHit só na virada (atividade marcada uma vez)', () => {
  fresh();
  const d = '2025-05-12';
  eq(repo.habits.waterGoal().ml, 2000);
  eq(repo.habits.addWater(d, 1500).goalJustHit, false);
  const r = repo.habits.addWater(d, 500);
  eq(r.goalJustHit, true);
  eq(r.day.waterMl, 2000);
  eq(r.day.waterLog, [1500, 500]);
  eq(r.day.waterGoalHit, true);
  eq(repo.activity.keys(), [d]);
  const u = repo.habits.undoWater(d);
  eq(u.waterMl, 1500);
  eq(u.waterLog, [1500]);
  eq(u.waterGoalHit, true);
  eq(repo.habits.addWater(d, 500).goalJustHit, false);
  eq(repo.activity.keys(), [d]);
  // desfazer até o fim nunca fica negativo
  repo.habits.undoWater(d);
  repo.habits.undoWater(d);
  repo.habits.undoWater(d);
  eq(repo.habits.getDay(d).waterMl, 0);
});

test('addWater: teto de 10.000 ml e 50 lançamentos', () => {
  fresh();
  const d = '2025-05-12';
  for (let i = 0; i < 60; i++) repo.habits.addWater(d, 250);
  const day = repo.habits.getDay(d);
  eq(day.waterLog.length, 50);
  eq(day.waterMl, 10000);
});

test('hábitos: sono, passos, days()', () => {
  fresh();
  repo.habits.setSleep('2025-05-12', 7.5);
  repo.habits.setSteps('2025-05-11', 8000);
  const days = repo.habits.days(3);
  eq(days.map((x) => x.date), ['2025-05-10', '2025-05-11', '2025-05-12']);
  eq(days[1].steps, 8000);
  eq(days[2].sleepH, 7.5);
  eq(repo.habits.setSleep('2025-05-12', null).sleepH, null);
  eq(repo.habits.getGoals(), { waterMl: null, sleepH: 8, steps: 8000 });
});

test('atividade + sequência', () => {
  fresh();
  repo.activity.mark('2025-05-11');
  repo.activity.mark('2025-05-10');
  repo.activity.mark('2025-05-11');
  eq(repo.activity.keys(), ['2025-05-10', '2025-05-11']);
  eq(calc.streak(repo.activity.keys(), '2025-05-12'), 2);
  repo.workouts.log({ date: '2025-05-12', name: 'Treino', durationSec: 600 });
  eq(calc.streak(repo.activity.keys(), '2025-05-12'), 3);
  repo.study.finishSession({ kind: 'flashcards', subjectId: 'anatomia', count: 4 });
  eq(repo.activity.keys().length, 3);
  throws(() => repo.study.finishSession({ kind: 'outro' }), RangeError);
});

test('atividade: finishSession marca hoje (flashcards >= 5 e quiz)', () => {
  fresh();
  repo.study.finishSession({ kind: 'flashcards', subjectId: 'anatomia', count: 5 });
  eq(repo.activity.keys(), ['2025-05-12']);
  fresh();
  repo.study.finishSession({ kind: 'quiz', subjectId: 'anatomia', count: 1 });
  eq(repo.activity.keys(), ['2025-05-12']);
});

test('caderno via recordAnswer e saveSimulado', () => {
  fresh();
  repo.study.recordAnswer('anatomia', 'anatomia-q01', false);
  eq(repo.study.get().wrong['anatomia-q01'], 1);
  eq(repo.study.get().quiz.anatomia, { answered: 1, correct: 0 });
  repo.study.saveSimulado({
    id: 's1', date: '2025-05-12', subjects: ['anatomia'], n: 2, correct: 1, durationSec: 60, timeLimitSec: null,
    bySubject: { anatomia: { n: 2, correct: 1 } },
    items: [
      { qid: 'anatomia-q01', subjectId: 'anatomia', chosen: 2, correct: true },
      { qid: 'anatomia-q02', subjectId: 'anatomia', chosen: null, correct: false },
    ],
  });
  const s = repo.study.get();
  eq(s.wrong['anatomia-q01'], undefined);
  eq(s.wrong['anatomia-q02'], 1);
  eq(s.quiz.anatomia, { answered: 3, correct: 1 });
  eq(repo.study.wrongList(), [{ qid: 'anatomia-q02', count: 1 }]);
  repo.study.dropWrong(['anatomia-q02']);
  eq(repo.study.wrongList(), []);
  eq(repo.activity.keys(), ['2025-05-12']);
});

test('gradeCard: Leitner', () => {
  fresh();
  let c = repo.study.gradeCard('anatomia-f01', true);
  eq([c.box, c.right, c.wrong], [1, 1, 0]);
  eq(c.last, now.getTime());
  for (let i = 0; i < 6; i++) c = repo.study.gradeCard('anatomia-f01', true);
  eq(c.box, 4);
  c = repo.study.gradeCard('anatomia-f01', false);
  eq([c.box, c.wrong], [0, 1]);
});

test('simulado ativo: saveActive/getActive e saveSimulado limpa o ativo', () => {
  fresh();
  eq(repo.study.getActive(), null);
  const active = {
    id: 's2', startedAt: now.getTime(), deadline: null, timeLimitSec: null, subjects: ['anatomia'],
    items: [{ qid: 'anatomia-q03', subjectId: 'anatomia', order: [2, 0, 3, 1], chosen: null }], current: 0,
  };
  eq(repo.study.saveActive(active), true);
  eq(repo.study.getActive(), active);
  // chosen guarda o índice ORIGINAL: tocou na 1ª opção exibida → order[0] = 2
  const chosen = active.items[0].order[0];
  repo.study.saveSimulado({
    id: 's2', date: '2025-05-12', subjects: ['anatomia'], n: 1, correct: 1, durationSec: 30, timeLimitSec: null,
    bySubject: { anatomia: { n: 1, correct: 1 } },
    items: [{ qid: 'anatomia-q03', subjectId: 'anatomia', chosen, correct: true }],
  });
  eq(repo.study.getActive(), null);
  eq(repo.study.getSimulado('s2').items[0].chosen, 2);
  eq(repo.study.getSimulado('nada'), null);
});

test('limites: simulados 50, registros 500, dias de dieta 60, treinos 30', () => {
  fresh();
  for (let i = 0; i < 52; i++) {
    repo.study.saveSimulado({ id: 'sim' + i, date: '2025-05-12', subjects: [], n: 0, correct: 0, items: [] });
  }
  const sims = repo.study.listSimulados();
  eq(sims.length, 50);
  eq(sims[0].id, 'sim51');
  eq(sims[49].id, 'sim2');

  for (let i = 0; i < 505; i++) repo.workouts.log({ date: '2025-05-12', name: 'T' + i });
  const logs = repo.workouts.listLogs();
  eq(logs.length, 500);
  eq(logs[0].name, 'T504');

  const old = addDays('2025-05-12', -61);
  const edge = addDays('2025-05-12', -60);
  repo.diet.addEntry(old, 'cafe', { foodId: 'x', grams: 100 });
  repo.diet.addEntry(edge, 'cafe', { foodId: 'x', grams: 100 });
  repo.diet.addEntry('2025-05-12', 'cafe', { foodId: 'x', grams: 100 });
  eq(repo.diet.getDay(old).meals.cafe, []);
  eq(repo.diet.getDay(edge).meals.cafe.length, 1);

  for (let i = 0; i < CAPS.custom; i++) {
    assert(repo.workouts.saveCustom({ name: 'W' + i, rounds: 1, restBetweenRoundsSec: 0, items: [] }) !== null, 'treino não salvo');
  }
  eq(repo.workouts.saveCustom({ name: 'excedente', rounds: 1, restBetweenRoundsSec: 0, items: [] }), null);
  eq(repo.workouts.listCustom().length, 30);
});

test('prune agressivo: dieta 30 dias, hábitos 60, registros 200', () => {
  fresh();
  repo.diet.addEntry(addDays('2025-05-12', -45), 'cafe', { foodId: 'x', grams: 10 });
  repo.habits.setSleep(addDays('2025-05-12', -90), 8);
  for (let i = 0; i < 250; i++) repo.workouts.log({ date: '2025-05-12', name: 'T' + i });
  repo.prune({ aggressive: true });
  eq(repo.diet.getDay(addDays('2025-05-12', -45)).meals.cafe, []);
  eq(repo.habits.getDay(addDays('2025-05-12', -90)).sleepH, null);
  eq(repo.workouts.listLogs().length, 200);
});

test('treino montado com exercício inexistente: item removido ao montar a linha do tempo', () => {
  fresh();
  const w = repo.workouts.saveCustom({
    name: 'Meu treino', rounds: 1, restBetweenRoundsSec: 0,
    items: [
      { exerciseId: 'agachamento-livre', mode: 'reps', value: 12, restSec: 20 },
      { exerciseId: 'nao-existe', mode: 'time', value: 30, restSec: 20 },
    ],
  });
  eq(w.prepareSec, 10);
  assert(typeof w.id === 'string' && typeof w.createdAt === 'number', 'id/createdAt ausentes');
  const loaded = repo.workouts.getCustom(w.id);
  const exercisesById = { 'agachamento-livre': { id: 'agachamento-livre', met: 3.8 } };
  const t = calc.buildTimeline(loaded, exercisesById);
  eq(t.filter((s) => s.kind.indexOf('work') === 0).map((s) => s.exerciseId), ['agachamento-livre']);
  // atualização mantém createdAt e marca updatedAt
  now = new Date(now.getTime() + 1000);
  const upd = repo.workouts.saveCustom(Object.assign({}, loaded, { name: 'Renomeado' }));
  eq(upd.createdAt, w.createdAt);
  eq(upd.updatedAt, now.getTime());
  eq(repo.workouts.listCustom().length, 1);
  eq(repo.workouts.removeCustom(w.id), true);
  eq(repo.workouts.getCustom(w.id), null);
});

test('dieta: porções, edição, remoção, plano e recentes', () => {
  fresh();
  const d = '2025-05-12';
  const e = repo.diet.addEntry(d, 'almoco', { foodId: 'arroz', portion: { label: '1 escumadeira', g: 90, qty: 2 } });
  eq(e.grams, 180);
  eq(e.portion, { label: '1 escumadeira', g: 90, qty: 2 });
  throws(() => repo.diet.addEntry(d, 'brunch', { foodId: 'arroz', grams: 100 }), RangeError);
  throws(() => repo.diet.addEntry(d, 'almoco', { foodId: 'arroz', grams: 100, portion: { label: 'x', g: 1, qty: 1 } }), RangeError);
  eq(repo.diet.updateEntry(d, 'almoco', e.id, { portion: { label: '1 escumadeira', g: 90, qty: 1.5 } }), true);
  eq(repo.diet.getDay(d).meals.almoco[0].grams, 135);
  eq(repo.diet.updateEntry(d, 'almoco', e.id, { grams: 200 }), true);
  eq(repo.diet.getDay(d).meals.almoco[0].portion, null);
  repo.diet.addEntry(d, 'jantar', { foodId: 'feijao', grams: 100 });
  eq(repo.diet.recentFoodIds(), ['feijao', 'arroz']);
  const plan = { meals: { cafe: [{ foodId: 'pao', grams: 50 }], almoco: [{ foodId: 'arroz', grams: 150 }, { foodId: 'frango', grams: 120 }] } };
  eq(repo.diet.applyPlan(d, plan, 'append'), 3);
  eq(repo.diet.getDay(d).meals.almoco.length, 3);
  eq(repo.diet.applyPlan(d, plan, 'replace'), 3);
  eq(repo.diet.getDay(d).meals.almoco.length, 2);
  eq(repo.diet.getDay(d).meals.jantar, []);
  const id = repo.diet.getDay(d).meals.cafe[0].id;
  eq(repo.diet.removeEntry(d, 'cafe', id), true);
  eq(repo.diet.removeEntry(d, 'cafe', id), false);
  throws(() => repo.diet.applyPlan(d, plan, 'outro'), RangeError);
});

test('assess, prof, favs, settings', () => {
  fresh();
  const a = repo.assess.add({ type: 'rcq', inputs: { sex: 'M', waist: 85, hip: 100 }, result: { whr: 0.85 } });
  eq(a.date, '2025-05-12');
  repo.assess.add({ type: 'fc', inputs: { age: 30 }, result: {} });
  eq(repo.assess.list().length, 2);
  eq(repo.assess.list()[0].type, 'fc');
  eq(repo.assess.list('rcq').length, 1);
  eq(repo.assess.remove(a.id), true);
  eq(repo.assess.list('rcq'), []);

  eq(repo.prof.get(), { lastNames: '', teamsCount: 2 });
  repo.prof.update({ teamsCount: 3 });
  eq(repo.prof.get().teamsCount, 3);

  eq(repo.favs.has('exercises', 'burpee'), false);
  eq(repo.favs.toggle('exercises', 'burpee'), true);
  eq(repo.favs.has('exercises', 'burpee'), true);
  eq(repo.favs.list('exercises'), ['burpee']);
  eq(repo.favs.toggle('exercises', 'burpee'), false);
  eq(repo.favs.has('exercises', 'burpee'), false);
  throws(() => repo.favs.toggle('outros', 'x'), RangeError);

  const s = repo.settings.get();
  eq(s, { theme: 'dark', sound: true, voice: false, vibration: true, installDismissed: false });
  eq(repo.settings.update({ theme: 'light' }).theme, 'light');
});

function populate() {
  repo.profile.update(Object.assign({ onboarded: true, persona: 'estudante', name: 'Ana' }, COMPLETE));
  repo.body.log({ weightKg: 80 });
  repo.diet.addEntry('2025-05-12', 'cafe', { foodId: 'pao', grams: 50 });
  repo.study.recordAnswer('anatomia', 'anatomia-q01', false);
  repo.habits.addWater('2025-05-12', 500);
  repo.favs.toggle('foods', 'arroz');
  repo.assess.add({ type: 'fc', inputs: { age: 30 }, result: { max: 190 } });
  repo.workouts.log({ date: '2025-05-12', name: 'T' });
  repo.settings.update({ theme: 'light' });
  store.set('access', 'ok');
}

test('backup: exportar → importar reproduz os dados (inclui remoção de chave ausente)', () => {
  fresh();
  populate();
  const exp = repo.backup.export();
  eq(exp.app, 'edfisica-pro');
  eq(exp.schema, 1);
  assert(!('access' in exp.data), 'access não pode ir para o backup');
  eq(repo.backup.validate(JSON.parse(JSON.stringify(exp))), { ok: true });

  // estado posterior ao backup: deve sumir após o import
  repo.study.saveActive({ id: 'ativo', items: [], current: 0 });
  repo.profile.update({ name: 'Outro' });
  eq(repo.backup.import(JSON.parse(JSON.stringify(exp))), true);
  eq(repo.study.getActive(), null);
  eq(store.get('access', null), 'ok');
  const again = repo.backup.export();
  eq(again.data, exp.data);
  eq(repo.profile.get().name, 'Ana');
});

test('backup: validate rejeita app errado, chaves desconhecidas e tipos errados', () => {
  fresh();
  const base = { app: 'edfisica-pro', schema: 1, exportedAt: 0, data: { body: [], profile: {} } };
  eq(repo.backup.validate(base), { ok: true });
  const r1 = repo.backup.validate(Object.assign({}, base, { app: 'outro' }));
  eq(r1.ok, false);
  assert(r1.reason.indexOf('Arquivo inválido') === 0, 'motivo deve ser em pt-BR');
  eq(repo.backup.validate(Object.assign({}, base, { data: { hacker: {} } })).ok, false);
  eq(repo.backup.validate(Object.assign({}, base, { data: { body: {} } })).ok, false);
  eq(repo.backup.validate(Object.assign({}, base, { data: { profile: [] } })).ok, false);
  eq(repo.backup.validate(Object.assign({}, base, { data: { access: 'ok' } })).ok, false);
  eq(repo.backup.validate(Object.assign({}, base, { schema: 2 })).ok, false);
  eq(repo.backup.validate(Object.assign({}, base, { schema: '1' })).ok, false);
  eq(repo.backup.validate(Object.assign({}, base, { data: null })).ok, false);
  eq(repo.backup.validate(null).ok, false);
});

test('cota cheia no app: repo.init registra o prune agressivo', () => {
  setDay('2025-05-12');
  const b = createMemoryBackend();
  const setItem = b.setItem;
  let fail = false;
  b.setItem = (k, v) => {
    if (fail && k === 'edf:v1:profile') { fail = false; throw new DOMException('cheio', 'QuotaExceededError'); }
    setItem(k, v);
  };
  store.init({ backend: b, onWarn: null, onError: null });
  repo.init({ clock: () => now });
  for (let i = 0; i < 250; i++) repo.workouts.log({ date: '2025-05-12', name: 'T' + i });
  fail = true;
  repo.profile.update({ name: 'Ana' });
  eq(repo.workouts.listLogs().length, 200);
  eq(repo.profile.get().name, 'Ana');
});

test('datas usam o relógio injetado', () => {
  fresh('2025-12-31');
  eq(repo.body.log({ weightKg: 70 }).date, '2025-12-31');
  eq(dateKey(now), '2025-12-31');
});
