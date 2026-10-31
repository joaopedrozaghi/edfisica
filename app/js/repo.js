// repo.js: acesso a dados de domínio + invariantes (B4.4, B4.7).
// Único módulo que as telas usam para persistir. Leituras devolvem cópias.
// Escritas passam por store.set; falha de cota nunca lança (o store já avisou)
// e o método devolve o resultado em memória. Erros de programação (refeição
// desconhecida, kind inválido, argumento obrigatório ausente) lançam RangeError.
// Não importa arquivos de dados (quem chama passa foodsById/exercisesById).
// Sem efeitos colaterais na importação: tudo começa em repo.init().

import { CONFIG } from '../../config.js';
import { store, SCHEMA } from './store.js';
import * as calc from './calc.js';
import { dateKey, addDays, uid } from './utils.js';

// ---------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------

/** Refeições do diário (chaves fixas e rótulos, B6.3.1). */
export const MEALS = Object.freeze([
  Object.freeze({ key: 'cafe', label: 'Café da manhã' }),
  Object.freeze({ key: 'lanche1', label: 'Lanche da manhã' }),
  Object.freeze({ key: 'almoco', label: 'Almoço' }),
  Object.freeze({ key: 'lanche2', label: 'Lanche da tarde' }),
  Object.freeze({ key: 'jantar', label: 'Jantar' }),
  Object.freeze({ key: 'ceia', label: 'Ceia' }),
]);
export const MEAL_KEYS = Object.freeze(MEALS.map((m) => m.key));

/** Limites de armazenamento (B4.2) e versões agressivas (cota cheia). */
export const CAPS = Object.freeze({
  body: 365,
  simulados: 50,
  logs: 500,
  custom: 30,
  dietDays: 60,
  habitDays: 120,
  assess: 50,
  activity: 400,
  waterLog: 50,
  aggressive: Object.freeze({ dietDays: 30, habitDays: 60, logs: 200 }),
});

const PROFILE_DEFAULT = {
  onboarded: false, persona: null, name: '', age: null, sex: null,
  weightKg: null, heightCm: null, goal: null, activity: null, createdAt: null,
};
const SETTINGS_DEFAULT = { theme: 'dark', sound: true, voice: false, vibration: true, installDismissed: false };
const STUDY_DEFAULT = { cards: {}, quiz: {}, wrong: {}, simulados: [] };
const WORKOUTS_DEFAULT = { logs: [], custom: [] };
const DIET_DEFAULT = { targets: null, days: {} };
const HABITS_DEFAULT = { goals: { waterMl: null, sleepH: 8, steps: 8000 }, days: {} };
const PROF_DEFAULT = { lastNames: '', teamsCount: 2 };
const FAVS_DEFAULT = { exercises: [], programs: [], foods: [] };
const FAV_KINDS = ['exercises', 'programs', 'foods'];
const WATER_DEFAULT_ML = 2000;
const WATER_MAX_ML = 10000;

/** Nomes que entram no backup e o tipo esperado do valor (B6.9). 'access' nunca entra. */
const BACKUP_KEYS = Object.freeze({
  meta: 'object', settings: 'object', profile: 'object', body: 'array', study: 'object',
  'simulado-active': 'object', workouts: 'object', diet: 'object', habits: 'object',
  assess: 'array', prof: 'object', favs: 'object', activity: 'array', missions: 'object',
});

// ---------------------------------------------------------------------
// Estado interno
// ---------------------------------------------------------------------

let clock = () => new Date();
let unsubscribeProfile = null;
let suspended = false; // true durante backup.import (não recalcula metas no meio)

const copy = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const today = () => dateKey(clock());
const nowMs = () => clock().getTime();
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function req(cond, msg) {
  if (!cond) throw new RangeError(msg);
}
function mergeDefaults(def, stored) {
  return Object.assign(copy(def), isObj(stored) ? stored : {});
}
function load(name, def) {
  return mergeDefaults(def, store.get(name, def));
}
function mealKey(meal) {
  req(MEAL_KEYS.indexOf(meal) !== -1, `refeição desconhecida: ${meal}`);
  return meal;
}
function dateArg(date) {
  req(typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date), `data inválida: ${date}`);
  return date;
}
/** Mantém só as chaves de dias >= hoje − n. */
function pruneDays(days, n) {
  const min = addDays(today(), -n);
  const out = {};
  for (const k of Object.keys(days)) if (k >= min) out[k] = days[k];
  return out;
}

// ---------------------------------------------------------------------
// profile
// ---------------------------------------------------------------------

const profile = {
  get() {
    return load('profile', PROFILE_DEFAULT);
  },
  /** Mescla só chaves conhecidas (desconhecida → RangeError), grava e notifica (→ recomputeTargets). */
  update(patch) {
    req(isObj(patch), 'patch obrigatório');
    for (const k of Object.keys(patch)) {
      req(Object.prototype.hasOwnProperty.call(PROFILE_DEFAULT, k), `campo de perfil desconhecido: ${k}`);
    }
    const p = Object.assign(profile.get(), copy(patch));
    if (p.createdAt === null) p.createdAt = nowMs();
    store.set('profile', p);
    return copy(p);
  },
  isComplete() {
    const p = profile.get();
    return p.age !== null && p.sex !== null && p.weightKg !== null &&
      p.heightCm !== null && p.goal !== null && p.activity !== null;
  },
};

// ---------------------------------------------------------------------
// body (histórico de peso; único escritor do peso do perfil)
// ---------------------------------------------------------------------

function bodyList() {
  const l = store.get('body', []);
  return Array.isArray(l) ? l.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) : [];
}

const body = {
  /** Grava/atualiza a entrada de HOJE e sincroniza o perfil. weightKg obrigatório. */
  log({ weightKg, heightCm } = {}) {
    req(typeof weightKg === 'number' && Number.isFinite(weightKg) && weightKg > 0, 'weightKg obrigatório');
    const p = profile.get();
    const h = typeof heightCm === 'number' && heightCm > 0 ? heightCm : p.heightCm;
    const entry = {
      date: today(),
      weightKg,
      heightCm: h === undefined ? null : h,
      bmi: h ? calc.round1(calc.bmi(weightKg, h)) : null,
    };
    let list = bodyList().filter((e) => e.date !== entry.date);
    list.push(entry);
    list.sort((a, b) => (a.date < b.date ? -1 : 1));
    if (list.length > CAPS.body) list = list.slice(list.length - CAPS.body);
    store.set('body', list);
    profile.update({ weightKg, heightCm: entry.heightCm });
    return copy(entry);
  },
  /** Remove a entrada; se era a mais recente e sobrou alguma, o perfil volta para a nova mais recente. */
  remove(date) {
    const list = bodyList();
    const idx = list.findIndex((e) => e.date === date);
    if (idx === -1) return false;
    const wasLatest = idx === list.length - 1;
    list.splice(idx, 1);
    store.set('body', list);
    if (wasLatest && list.length) {
      const last = list[list.length - 1];
      // Entrada antiga sem altura não apaga a altura atual do perfil.
      const h = last.heightCm !== null && last.heightCm !== undefined ? last.heightCm : profile.get().heightCm;
      profile.update({ weightKg: last.weightKg, heightCm: h });
    }
    return true;
  },
  list() {
    return bodyList();
  },
};

// ---------------------------------------------------------------------
// diet
// ---------------------------------------------------------------------

function dietLoad() {
  const d = load('diet', DIET_DEFAULT);
  if (!isObj(d.days)) d.days = {};
  return d;
}
function emptyMeals() {
  const m = {};
  for (const k of MEAL_KEYS) m[k] = [];
  return m;
}
function dayMeals(d, date) {
  const stored = d.days[date] && isObj(d.days[date].meals) ? d.days[date].meals : {};
  const meals = emptyMeals();
  for (const k of MEAL_KEYS) if (Array.isArray(stored[k])) meals[k] = stored[k];
  return meals;
}
function portionGrams(portion) {
  req(isObj(portion) && typeof portion.label === 'string' && portion.g > 0 && portion.qty > 0, 'porção inválida');
  return Math.round(portion.qty * portion.g);
}
function computeAutoTargets() {
  const p = profile.get();
  const bmr = calc.bmr({ sex: p.sex, kg: p.weightKg, cm: p.heightCm, age: p.age });
  const tdee = calc.tdee(bmr, p.activity);
  const { kcal, floored } = calc.goalCalories(tdee, p.goal, bmr);
  const m = calc.macroTargets({ kcal, kg: p.weightKg, goal: p.goal });
  return {
    kcal, prot: m.prot, carb: m.carb, gord: m.gord,
    bmr: Math.round(bmr), tdee: Math.round(tdee),
    floored, override: false, splitPct: null,
  };
}

const diet = {
  getDay(date) {
    return { meals: copy(dayMeals(dietLoad(), date)) };
  },
  /** Exatamente um de grams ou portion:{label,g,qty}. Poda dias com mais de 60 dias. */
  addEntry(date, meal, { foodId, grams, portion } = {}) {
    dateArg(date);
    mealKey(meal);
    req(typeof foodId === 'string' && foodId !== '', 'foodId obrigatório');
    req((grams === undefined) !== (portion === undefined), 'informe grams OU portion');
    const entry = { id: uid(), foodId, grams: 0, portion: null };
    if (portion !== undefined) {
      entry.grams = portionGrams(portion);
      entry.portion = { label: portion.label, g: portion.g, qty: portion.qty };
    } else {
      req(typeof grams === 'number' && Number.isFinite(grams) && grams > 0, 'grams inválido');
      entry.grams = grams;
    }
    const d = dietLoad();
    const meals = dayMeals(d, date);
    meals[meal].push(entry);
    d.days[date] = { meals };
    d.days = pruneDays(d.days, CAPS.dietDays);
    store.set('diet', d);
    return copy(entry);
  },
  updateEntry(date, meal, id, patch) {
    mealKey(meal);
    req(isObj(patch), 'patch obrigatório');
    const d = dietLoad();
    const meals = dayMeals(d, date);
    const e = meals[meal].find((x) => x.id === id);
    if (!e) return false;
    if (patch.portion !== undefined && patch.portion !== null) {
      e.grams = portionGrams(patch.portion);
      e.portion = { label: patch.portion.label, g: patch.portion.g, qty: patch.portion.qty };
    } else if (patch.grams !== undefined) {
      req(typeof patch.grams === 'number' && Number.isFinite(patch.grams) && patch.grams > 0, 'grams inválido');
      e.grams = patch.grams;
      e.portion = null;
    } else {
      throw new RangeError('patch precisa de grams ou portion');
    }
    d.days[date] = { meals };
    store.set('diet', d);
    return true;
  },
  removeEntry(date, meal, id) {
    mealKey(meal);
    const d = dietLoad();
    const meals = dayMeals(d, date);
    const before = meals[meal].length;
    meals[meal] = meals[meal].filter((x) => x.id !== id);
    if (meals[meal].length === before) return false;
    d.days[date] = { meals };
    store.set('diet', d);
    return true;
  },
  /** mode 'replace' esvazia as 6 refeições antes; 'append' mantém. Retorna quantas entradas entraram. */
  applyPlan(date, plan, mode) {
    dateArg(date);
    req(mode === 'replace' || mode === 'append', `mode inválido: ${mode}`);
    req(plan && isObj(plan.meals), 'plano inválido');
    const d = dietLoad();
    const meals = mode === 'replace' ? emptyMeals() : dayMeals(d, date);
    let n = 0;
    for (const k of MEAL_KEYS) {
      const items = Array.isArray(plan.meals[k]) ? plan.meals[k] : [];
      for (const it of items) {
        meals[k].push({ id: uid(), foodId: it.foodId, grams: it.grams, portion: null });
        n++;
      }
    }
    d.days[date] = { meals };
    d.days = pruneDays(d.days, CAPS.dietDays);
    store.set('diet', d);
    return n;
  },
  /** foodIds distintos: dia mais recente primeiro; no mesmo dia, o adicionado por último primeiro (ordem do uid). */
  recentFoodIds(limit = 12) {
    const d = dietLoad();
    const out = [];
    const dates = Object.keys(d.days).sort().reverse();
    for (const date of dates) {
      const meals = dayMeals(d, date);
      const entries = [];
      for (const k of MEAL_KEYS) for (const e of meals[k]) entries.push(e);
      entries.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
      for (const e of entries) {
        if (out.indexOf(e.foodId) === -1) out.push(e.foodId);
        if (out.length >= limit) return out;
      }
    }
    return out;
  },
  getTargets() {
    return copy(dietLoad().targets || null);
  },
  /** Meta manual: kcal + percentuais { prot, carb, gord } (em %). */
  setManualTargets({ kcal, splitPct } = {}) {
    const g = calc.macrosFromPct(kcal, splitPct);
    const t = {
      kcal, prot: g.prot, carb: g.carb, gord: g.gord,
      bmr: null, tdee: null, floored: false, override: true,
      splitPct: { prot: splitPct.prot, carb: splitPct.carb, gord: splitPct.gord },
    };
    const d = dietLoad();
    d.targets = t;
    store.set('diet', d);
    return copy(t);
  },
  clearOverride() {
    const d = dietLoad();
    if (d.targets) {
      d.targets.override = false;
      store.set('diet', d);
    }
    return diet.recomputeTargets();
  },
  /** B4.4: sem efeito com override; perfil incompleto → null (nunca chama calc com null). */
  recomputeTargets() {
    const d = dietLoad();
    if (d.targets && d.targets.override === true) return copy(d.targets);
    const next = profile.isComplete() ? computeAutoTargets() : null;
    // Só grava quando muda (evita criar a chave à toa).
    if (!sameJSON(d.targets || null, next)) {
      d.targets = next;
      store.set('diet', d);
    }
    return copy(next);
  },
};

// ---------------------------------------------------------------------
// study
// ---------------------------------------------------------------------

function studyLoad() {
  const s = load('study', STUDY_DEFAULT);
  for (const k of ['cards', 'quiz', 'wrong']) if (!isObj(s[k])) s[k] = {};
  if (!Array.isArray(s.simulados)) s.simulados = [];
  return s;
}
function applyAnswer(s, subjectId, qid, correct) {
  req(typeof subjectId === 'string' && typeof qid === 'string', 'subjectId e qid obrigatórios');
  const q = s.quiz[subjectId] || { answered: 0, correct: 0 };
  q.answered++;
  if (correct) q.correct++;
  s.quiz[subjectId] = q;
  if (correct) delete s.wrong[qid];
  else s.wrong[qid] = (s.wrong[qid] || 0) + 1;
}

const study = {
  get() {
    const s = studyLoad();
    return { cards: s.cards, quiz: s.quiz, wrong: s.wrong };
  },
  /** Leitner: acertou → box+1 (máx. 4); errou → box 0. */
  gradeCard(cardId, right) {
    req(typeof cardId === 'string' && cardId !== '', 'cardId obrigatório');
    const s = studyLoad();
    const c = s.cards[cardId] || { box: 0, right: 0, wrong: 0, last: null };
    if (right) {
      c.box = Math.min(c.box + 1, 4);
      c.right++;
    } else {
      c.box = 0;
      c.wrong++;
    }
    c.last = nowMs();
    s.cards[cardId] = c;
    store.set('study', s);
    return copy(c);
  },
  /** Ponto único de registro de respostas (quiz E simulado). */
  recordAnswer(subjectId, qid, correct) {
    const s = studyLoad();
    applyAnswer(s, subjectId, qid, !!correct);
    store.set('study', s);
  },
  dropWrong(qids) {
    req(Array.isArray(qids), 'qids deve ser uma lista');
    const s = studyLoad();
    for (const q of qids) delete s.wrong[q];
    store.set('study', s);
  },
  wrongList() {
    const w = studyLoad().wrong;
    return Object.keys(w).map((qid) => ({ qid, count: w[qid] })).sort((a, b) => b.count - a.count);
  },
  /** flashcards: marca atividade com count >= 5; quiz: sempre marca. */
  finishSession({ kind, subjectId, count } = {}) {
    req(kind === 'flashcards' || kind === 'quiz', `kind inválido: ${kind}`);
    if (kind === 'quiz' || (typeof count === 'number' && count >= 5)) activity.mark(today());
  },
  getActive() {
    const a = store.get('simulado-active', null);
    return isObj(a) ? a : null;
  },
  saveActive(a) {
    req(isObj(a), 'simulado ativo inválido');
    return store.set('simulado-active', a);
  },
  clearActive() {
    store.remove('simulado-active');
  },
  /** Anexa (cap 50), registra cada resposta, limpa o ativo e marca atividade. */
  saveSimulado(result) {
    req(isObj(result) && typeof result.id === 'string' && Array.isArray(result.items), 'resultado inválido');
    const r = copy(result);
    const s = studyLoad();
    s.simulados.push(r);
    if (s.simulados.length > CAPS.simulados) s.simulados = s.simulados.slice(s.simulados.length - CAPS.simulados);
    for (const i of r.items) applyAnswer(s, i.subjectId, i.qid, !!i.correct);
    store.set('study', s);
    study.clearActive();
    activity.mark(today());
    return copy(r);
  },
  getSimulado(id) {
    const r = studyLoad().simulados.find((x) => x.id === id);
    return r ? r : null;
  },
  listSimulados() {
    return studyLoad().simulados.slice().reverse();
  },
};

// ---------------------------------------------------------------------
// workouts
// ---------------------------------------------------------------------

function workoutsLoad() {
  const w = load('workouts', WORKOUTS_DEFAULT);
  if (!Array.isArray(w.logs)) w.logs = [];
  if (!Array.isArray(w.custom)) w.custom = [];
  return w;
}

const workouts = {
  /** Anexa o registro (cap 500) e marca atividade em entry.date. */
  log(entry) {
    req(isObj(entry), 'entry obrigatório');
    const e = copy(entry);
    if (!e.date) e.date = today();
    const w = workoutsLoad();
    w.logs.push(e);
    if (w.logs.length > CAPS.logs) w.logs = w.logs.slice(w.logs.length - CAPS.logs);
    store.set('workouts', w);
    activity.mark(e.date);
    return copy(e);
  },
  listLogs() {
    return workoutsLoad().logs.slice().reverse();
  },
  /** Novo (sem id): cria id/createdAt; null sem gravar se já houver 30. Existente: substitui e marca updatedAt. */
  saveCustom(wk) {
    req(isObj(wk) && Array.isArray(wk.items), 'treino inválido');
    const w = workoutsLoad();
    const x = copy(wk);
    x.prepareSec = 10; // fixo, não editável (B6.2.4)
    const idx = x.id ? w.custom.findIndex((c) => c.id === x.id) : -1;
    if (idx === -1) {
      if (w.custom.length >= CAPS.custom) return null;
      if (!x.id) x.id = uid();
      x.createdAt = nowMs();
      x.updatedAt = x.createdAt;
      w.custom.push(x);
    } else {
      x.createdAt = w.custom[idx].createdAt;
      x.updatedAt = nowMs();
      w.custom[idx] = x;
    }
    store.set('workouts', w);
    return copy(x);
  },
  getCustom(id) {
    return workoutsLoad().custom.find((c) => c.id === id) || null;
  },
  listCustom() {
    return workoutsLoad().custom;
  },
  removeCustom(id) {
    const w = workoutsLoad();
    const before = w.custom.length;
    w.custom = w.custom.filter((c) => c.id !== id);
    if (w.custom.length === before) return false;
    store.set('workouts', w);
    return true;
  },
};

// ---------------------------------------------------------------------
// habits
// ---------------------------------------------------------------------

function habitsLoad() {
  const h = load('habits', HABITS_DEFAULT);
  h.goals = Object.assign(copy(HABITS_DEFAULT.goals), isObj(h.goals) ? h.goals : {});
  if (!isObj(h.days)) h.days = {};
  return h;
}
function emptyHabitDay() {
  return { waterMl: 0, waterLog: [], sleepH: null, steps: null, waterGoalHit: false };
}
function habitDay(h, date) {
  return Object.assign(emptyHabitDay(), isObj(h.days[date]) ? h.days[date] : {});
}
function habitsSave(h, date, day) {
  h.days[date] = day;
  h.days = pruneDays(h.days, CAPS.habitDays);
  store.set('habits', h);
}

const habits = {
  getDay(date) {
    return copy(habitDay(habitsLoad(), date));
  },
  /** Os n dias terminando em endDate, do mais antigo ao mais novo, com `date`. */
  days(n = 7, endDate = today()) {
    const h = habitsLoad();
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = addDays(endDate, -i);
      out.push(Object.assign({ date }, copy(habitDay(h, date))));
    }
    return out;
  },
  /** Fonte única da meta de água: manual → automática (35 ml/kg) → padrão 2000. */
  waterGoal() {
    const g = habitsLoad().goals.waterMl;
    if (typeof g === 'number' && Number.isFinite(g)) return { ml: g, source: 'manual' };
    const kg = profile.get().weightKg;
    if (typeof kg === 'number' && kg > 0) return { ml: calc.waterMl(kg), source: 'auto' };
    return { ml: WATER_DEFAULT_ML, source: 'padrao' };
  },
  /** B6.7: soma (máx. 10.000 ml, 50 lançamentos); goalJustHit só na virada false → true do dia. */
  addWater(date, ml) {
    dateArg(date);
    req(typeof ml === 'number' && Number.isFinite(ml) && ml > 0, 'ml inválido');
    const h = habitsLoad();
    const day = habitDay(h, date);
    if (day.waterLog.length >= CAPS.waterLog) return { day: copy(day), goalJustHit: false };
    day.waterLog.push(ml);
    day.waterMl = Math.min(WATER_MAX_ML, day.waterMl + ml);
    let goalJustHit = false;
    if (day.waterMl >= habits.waterGoal().ml && !day.waterGoalHit) {
      day.waterGoalHit = true;
      goalJustHit = true;
    }
    habitsSave(h, date, day);
    if (goalJustHit) activity.mark(date);
    return { day: copy(day), goalJustHit };
  },
  /** Desfaz o último lançamento (mínimo 0). Nunca reseta waterGoalHit. */
  undoWater(date) {
    dateArg(date);
    const h = habitsLoad();
    const day = habitDay(h, date);
    if (day.waterLog.length) {
      const last = day.waterLog.pop();
      day.waterMl = Math.max(0, day.waterMl - last);
      habitsSave(h, date, day);
    }
    return copy(day);
  },
  /** null limpa o valor. */
  setSleep(date, hours) {
    dateArg(date);
    req(hours === null || (typeof hours === 'number' && Number.isFinite(hours) && hours >= 0), 'horas inválidas');
    const h = habitsLoad();
    const day = habitDay(h, date);
    day.sleepH = hours;
    habitsSave(h, date, day);
    return copy(day);
  },
  /** null limpa o valor. */
  setSteps(date, n) {
    dateArg(date);
    req(n === null || (typeof n === 'number' && Number.isFinite(n) && n >= 0), 'passos inválidos');
    const h = habitsLoad();
    const day = habitDay(h, date);
    day.steps = n;
    habitsSave(h, date, day);
    return copy(day);
  },
  getGoals() {
    return habitsLoad().goals;
  },
  /** patch com waterMl (number|null = automático), sleepH, steps. */
  setGoals(patch) {
    req(isObj(patch), 'patch obrigatório');
    for (const k of Object.keys(patch)) {
      req(Object.prototype.hasOwnProperty.call(HABITS_DEFAULT.goals, k), `meta desconhecida: ${k}`);
    }
    const h = habitsLoad();
    Object.assign(h.goals, copy(patch));
    store.set('habits', h);
    return copy(h.goals);
  },
};

// ---------------------------------------------------------------------
// assess, prof, favs, settings, activity
// ---------------------------------------------------------------------

function assessLoad() {
  const a = store.get('assess', []);
  return Array.isArray(a) ? a : [];
}

const assess = {
  add({ type, inputs, result } = {}) {
    req(typeof type === 'string' && type !== '', 'type obrigatório');
    const e = { id: uid(), date: today(), type, inputs: copy(inputs) || {}, result: copy(result) };
    let list = assessLoad();
    list.push(e);
    if (list.length > CAPS.assess) list = list.slice(list.length - CAPS.assess);
    store.set('assess', list);
    return copy(e);
  },
  list(type) {
    const l = assessLoad().slice().reverse();
    return type ? l.filter((e) => e.type === type) : l;
  },
  remove(id) {
    const l = assessLoad();
    const next = l.filter((e) => e.id !== id);
    if (next.length === l.length) return false;
    store.set('assess', next);
    return true;
  },
};

const prof = {
  get() {
    return load('prof', PROF_DEFAULT);
  },
  update(patch) {
    req(isObj(patch), 'patch obrigatório');
    const p = Object.assign(prof.get(), copy(patch));
    store.set('prof', p);
    return copy(p);
  },
};

function favKind(kind) {
  req(FAV_KINDS.indexOf(kind) !== -1, `kind inválido: ${kind}`);
  return kind;
}

const favs = {
  /** Alterna o favorito; retorna o novo estado. */
  toggle(kind, id) {
    favKind(kind);
    const f = load('favs', FAVS_DEFAULT);
    const list = Array.isArray(f[kind]) ? f[kind] : [];
    const i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);
    f[kind] = list;
    store.set('favs', f);
    return i === -1;
  },
  has(kind, id) {
    favKind(kind);
    const list = load('favs', FAVS_DEFAULT)[kind];
    return Array.isArray(list) && list.indexOf(id) !== -1;
  },
  list(kind) {
    favKind(kind);
    const list = load('favs', FAVS_DEFAULT)[kind];
    return Array.isArray(list) ? list : [];
  },
};

const settings = {
  get() {
    return load('settings', SETTINGS_DEFAULT);
  },
  update(patch) {
    req(isObj(patch), 'patch obrigatório');
    const s = Object.assign(settings.get(), copy(patch));
    store.set('settings', s);
    return copy(s);
  },
};

function activityLoad() {
  const a = store.get('activity', []);
  return Array.isArray(a) ? a : [];
}

const activity = {
  /** Inserção ordenada e idempotente (cap 400, descarta as mais antigas). */
  mark(key) {
    dateArg(key);
    let list = activityLoad();
    if (list.indexOf(key) !== -1) return;
    list.push(key);
    list.sort();
    if (list.length > CAPS.activity) list = list.slice(list.length - CAPS.activity);
    store.set('activity', list);
  },
  keys() {
    return activityLoad().slice().sort();
  },
};

// ---------------------------------------------------------------------
// prune
// ---------------------------------------------------------------------

/** Aplica os limites de B4.2; aggressive (cota cheia): dieta 30 dias, hábitos 60, registros 200. */
function prune({ aggressive = false } = {}) {
  const dietDays = aggressive ? CAPS.aggressive.dietDays : CAPS.dietDays;
  const habitDays = aggressive ? CAPS.aggressive.habitDays : CAPS.habitDays;
  const logsCap = aggressive ? CAPS.aggressive.logs : CAPS.logs;

  const d = store.get('diet', null);
  if (isObj(d) && isObj(d.days)) {
    const days = pruneDays(d.days, dietDays);
    if (Object.keys(days).length !== Object.keys(d.days).length) store.set('diet', Object.assign(d, { days }));
  }
  const h = store.get('habits', null);
  if (isObj(h) && isObj(h.days)) {
    const days = pruneDays(h.days, habitDays);
    if (Object.keys(days).length !== Object.keys(h.days).length) store.set('habits', Object.assign(h, { days }));
  }
  const w = store.get('workouts', null);
  if (isObj(w)) {
    let changed = false;
    if (Array.isArray(w.logs) && w.logs.length > logsCap) { w.logs = w.logs.slice(w.logs.length - logsCap); changed = true; }
    if (Array.isArray(w.custom) && w.custom.length > CAPS.custom) { w.custom = w.custom.slice(0, CAPS.custom); changed = true; }
    if (changed) store.set('workouts', w);
  }
  const s = store.get('study', null);
  if (isObj(s) && Array.isArray(s.simulados) && s.simulados.length > CAPS.simulados) {
    s.simulados = s.simulados.slice(s.simulados.length - CAPS.simulados);
    store.set('study', s);
  }
  const b = store.get('body', null);
  if (Array.isArray(b) && b.length > CAPS.body) store.set('body', bodyList().slice(-CAPS.body));
  const a = store.get('assess', null);
  if (Array.isArray(a) && a.length > CAPS.assess) store.set('assess', a.slice(a.length - CAPS.assess));
  const act = store.get('activity', null);
  if (Array.isArray(act) && act.length > CAPS.activity) store.set('activity', act.slice().sort().slice(-CAPS.activity));
}

// ---------------------------------------------------------------------
// backup (B6.9)
// ---------------------------------------------------------------------

const backup = {
  /** { app, schema, exportedAt (epoch ms), data:{ nome: valor } } para toda chave conhecida exceto access. */
  export() {
    const data = {};
    for (const name of store.keys()) {
      if (name === 'access' || !Object.prototype.hasOwnProperty.call(BACKUP_KEYS, name)) continue;
      const v = store.get(name, null);
      if (v !== null) data[name] = v;
    }
    return { app: 'edfisica-pro', schema: SCHEMA, exportedAt: nowMs(), data };
  },
  /** Regras de B6.9 (tamanho e JSON válido são checados na tela, antes). */
  validate(obj) {
    const invalid = `Arquivo inválido: não é um backup do ${CONFIG.product.name}.`;
    if (!isObj(obj) || obj.app !== 'edfisica-pro') return { ok: false, reason: invalid };
    if (!Number.isInteger(obj.schema) || obj.schema < 1) return { ok: false, reason: invalid };
    if (obj.schema > SCHEMA) {
      return { ok: false, reason: 'Arquivo inválido: o backup é de uma versão mais nova do app. Atualize o app e tente de novo.' };
    }
    if (!isObj(obj.data)) return { ok: false, reason: invalid };
    for (const k of Object.keys(obj.data)) {
      if (!Object.prototype.hasOwnProperty.call(BACKUP_KEYS, k)) {
        return { ok: false, reason: `Arquivo inválido: contém dados desconhecidos (${k}).` };
      }
      const v = obj.data[k];
      const okType = BACKUP_KEYS[k] === 'array' ? Array.isArray(v) : isObj(v);
      if (!okType) return { ok: false, reason: `Arquivo inválido: formato incorreto em "${k}".` };
    }
    return { ok: true };
  },
  /** Supõe validado. Limpa tudo (menos access) e grava cada chave. false se alguma gravação falhar. */
  import(obj) {
    suspended = true;
    let ok = true;
    try {
      store.clearAll({ keep: ['access'] });
      for (const k of Object.keys(obj.data)) {
        if (!store.set(k, obj.data[k])) ok = false;
      }
    } finally {
      suspended = false;
    }
    return ok;
  },
};

// ---------------------------------------------------------------------
// init
// ---------------------------------------------------------------------

/**
 * Registra o handler de cota, a assinatura do perfil (→ recomputeTargets)
 * e recalcula as metas. Chamar depois de store.init().
 */
function init({ clock: c = () => new Date() } = {}) {
  clock = c;
  if (unsubscribeProfile) unsubscribeProfile();
  store.setQuotaHandler(() => prune({ aggressive: true }));
  unsubscribeProfile = store.subscribe('profile', () => {
    if (!suspended) diet.recomputeTargets();
  });
  diet.recomputeTargets();
}

export const repo = {
  init,
  profile,
  body,
  diet,
  study,
  workouts,
  habits,
  assess,
  prof,
  favs,
  settings,
  activity,
  prune,
  backup,
};

export default repo;
