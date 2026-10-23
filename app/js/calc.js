// calc.js: fórmulas puras (B7). Sem efeitos colaterais na importação.
// Todas recebem números já validados pela interface e lançam RangeError para
// entradas fora do domínio (erro de programação, nunca exibido ao usuário).
// Arredondamentos só onde indicado; a formatação para exibição fica em utils.js.

import { addDays } from './utils.js';

// ---------------------------------------------------------------------
// Guardas de domínio
// ---------------------------------------------------------------------

function finite(x, name) {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new RangeError(`${name} inválido: ${x}`);
  return x;
}
function positive(x, name) {
  finite(x, name);
  if (x <= 0) throw new RangeError(`${name} deve ser > 0: ${x}`);
  return x;
}
function nonNegative(x, name) {
  finite(x, name);
  if (x < 0) throw new RangeError(`${name} deve ser >= 0: ${x}`);
  return x;
}
function sexOf(sex) {
  if (sex !== 'M' && sex !== 'F') throw new RangeError(`sexo inválido: ${sex}`);
  return sex;
}
function oneOf(map, key, name) {
  if (!Object.prototype.hasOwnProperty.call(map, key)) throw new RangeError(`${name} inválido: ${key}`);
  return map[key];
}

// ---------------------------------------------------------------------
// IMC
// ---------------------------------------------------------------------

/** IMC sem arredondar: kg / (cm/100)². */
export function bmi(kg, cm) {
  positive(kg, 'peso');
  positive(cm, 'altura');
  const m = cm / 100;
  return kg / (m * m);
}

export function round1(x) {
  finite(x, 'valor');
  return Math.round(x * 10) / 10;
}

/** Classificação OMS aplicada ao valor com 1 casa decimal (B6.4). */
export function bmiClass(b) {
  positive(b, 'IMC');
  const v = round1(b);
  if (v < 18.5) return { key: 'abaixo', label: 'Abaixo do peso' };
  if (v < 25) return { key: 'normal', label: 'Peso normal' };
  if (v < 30) return { key: 'sobrepeso', label: 'Sobrepeso' };
  if (v < 35) return { key: 'obesidade1', label: 'Obesidade grau I' };
  if (v < 40) return { key: 'obesidade2', label: 'Obesidade grau II' };
  return { key: 'obesidade3', label: 'Obesidade grau III' };
}

/** Faixa de peso saudável (IMC 18,5 a 24,9) para a altura. */
export function healthyWeightRange(cm) {
  positive(cm, 'altura');
  const m2 = (cm / 100) * (cm / 100);
  return { min: round1(18.5 * m2), max: round1(24.9 * m2) };
}

// ---------------------------------------------------------------------
// Gasto energético e metas
// ---------------------------------------------------------------------

/** Taxa metabólica basal, Mifflin-St Jeor (kcal/dia, sem arredondar). */
export function bmr({ sex, kg, cm, age }) {
  sexOf(sex);
  positive(kg, 'peso');
  positive(cm, 'altura');
  positive(age, 'idade');
  return 10 * kg + 6.25 * cm - 5 * age + (sex === 'M' ? 5 : -161);
}

/** Fatores de atividade. */
export const ACTIVITY = Object.freeze({
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muito_intenso: 1.9,
});

/** Gasto total diário = TMB × fator de atividade. */
export function tdee(bmrValue, activity) {
  positive(bmrValue, 'TMB');
  return bmrValue * oneOf(ACTIVITY, activity, 'atividade');
}

const GOAL_FACTOR = Object.freeze({ perder: 0.8, manter: 1, ganhar: 1.1 });

/** Calorias da meta, nunca abaixo da TMB. Retorna { kcal, floored }. */
export function goalCalories(tdeeValue, goal, bmrValue) {
  positive(tdeeValue, 'GET');
  positive(bmrValue, 'TMB');
  const raw = tdeeValue * oneOf(GOAL_FACTOR, goal, 'objetivo');
  const floored = raw < bmrValue;
  return { kcal: Math.round(Math.max(raw, bmrValue)), floored };
}

const PROT_PER_KG = Object.freeze({ perder: 2.0, manter: 1.6, ganhar: 1.8 });

/** Macros em gramas: proteína por kg, gordura 25% das kcal, carboidrato o restante. */
export function macroTargets({ kcal, kg, goal }) {
  positive(kcal, 'kcal');
  positive(kg, 'peso');
  const p = kg * oneOf(PROT_PER_KG, goal, 'objetivo');
  const g = (kcal * 0.25) / 9;
  const c = Math.max(0, (kcal - 4 * p - 9 * g) / 4);
  return { prot: Math.round(p), carb: Math.round(c), gord: Math.round(g) };
}

/** Gramas a partir de percentuais (pct em %, ex.: { prot: 30, carb: 45, gord: 25 }). */
export function macrosFromPct(kcal, pct) {
  positive(kcal, 'kcal');
  if (!pct || typeof pct !== 'object') throw new RangeError('percentuais inválidos');
  nonNegative(pct.prot, 'pct.prot');
  nonNegative(pct.carb, 'pct.carb');
  nonNegative(pct.gord, 'pct.gord');
  return {
    prot: Math.round((kcal * pct.prot) / 100 / 4),
    carb: Math.round((kcal * pct.carb) / 100 / 4),
    gord: Math.round((kcal * pct.gord) / 100 / 9),
  };
}

/** Meta de água automática: 35 ml por kg. */
export function waterMl(kg) {
  positive(kg, 'peso');
  return Math.round(35 * kg);
}

// ---------------------------------------------------------------------
// Avaliação física
// ---------------------------------------------------------------------

/** % de gordura pelo método da Marinha dos EUA (medidas em cm), 1 casa decimal. */
export function bodyFatNavy({ sex, cm, neck, waist, hip }) {
  sexOf(sex);
  positive(cm, 'altura');
  positive(neck, 'pescoço');
  positive(waist, 'cintura');
  let v;
  if (sex === 'M') {
    const d = waist - neck;
    if (!(d > 0)) throw new RangeError('cintura deve ser maior que o pescoço');
    v = 495 / (1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(cm)) - 450;
  } else {
    positive(hip, 'quadril');
    const d = waist + hip - neck;
    if (!(d > 0)) throw new RangeError('cintura + quadril deve ser maior que o pescoço');
    v = 495 / (1.29579 - 0.35004 * Math.log10(d) + 0.221 * Math.log10(cm)) - 450;
  }
  return round1(v);
}

/** Classificação ACE com limites semiabertos sobre o valor com 1 casa (B6.5). */
export function bodyFatClass(sex, pct) {
  sexOf(sex);
  finite(pct, '% gordura');
  const v = round1(pct);
  if (sex === 'M') {
    if (v < 6) return { key: 'essencial', label: 'Gordura essencial' };
    if (v < 14) return { key: 'atleta', label: 'Atleta' };
    if (v < 18) return { key: 'boa-forma', label: 'Boa forma' };
    if (v < 25) return { key: 'media', label: 'Média' };
    return { key: 'acima', label: 'Acima da média' };
  }
  if (v < 10) return { key: 'abaixo', label: 'Abaixo do essencial' };
  if (v < 14) return { key: 'essencial', label: 'Gordura essencial' };
  if (v < 21) return { key: 'atleta', label: 'Atleta' };
  if (v < 25) return { key: 'boa-forma', label: 'Boa forma' };
  if (v < 32) return { key: 'media', label: 'Média' };
  return { key: 'acima', label: 'Acima da média' };
}

/** Relação cintura-quadril, 2 casas decimais. */
export function whr(waist, hip) {
  positive(waist, 'cintura');
  positive(hip, 'quadril');
  return Math.round((waist / hip) * 100) / 100;
}

/** Risco pela RCQ (OMS): homens >= 0,90, mulheres >= 0,85 → 'aumentado'. */
export function whrRisk(sex, r) {
  sexOf(sex);
  positive(r, 'RCQ');
  return r >= (sex === 'M' ? 0.9 : 0.85) ? 'aumentado' : 'normal';
}

/** FC máxima: 'fox' (220 − idade, padrão) ou 'tanaka' (208 − 0,7 × idade). */
export function hrMax(age, formula = 'fox') {
  positive(age, 'idade');
  if (formula === 'fox') return 220 - age;
  if (formula === 'tanaka') return Math.round(208 - 0.7 * age);
  throw new RangeError(`fórmula inválida: ${formula}`);
}

/** Karvonen: FCrep + (FCmax − FCrep) × pct, arredondado. */
export function karvonen(max, rest, pct) {
  positive(max, 'FC máxima');
  positive(rest, 'FC de repouso');
  finite(pct, 'percentual');
  return Math.round(rest + (max - rest) * pct);
}

const ZONES = Object.freeze([
  { key: 'Z1', name: 'Recuperação', minPct: 0.5, maxPct: 0.6 },
  { key: 'Z2', name: 'Aeróbio leve (queima de gordura)', minPct: 0.6, maxPct: 0.7 },
  { key: 'Z3', name: 'Aeróbio moderado', minPct: 0.7, maxPct: 0.8 },
  { key: 'Z4', name: 'Limiar', minPct: 0.8, maxPct: 0.9 },
  { key: 'Z5', name: 'Máximo', minPct: 0.9, maxPct: 1 },
]);

/** 5 zonas de Karvonen. Lança RangeError quando repouso >= máxima. */
export function hrZones(max, rest) {
  positive(max, 'FC máxima');
  positive(rest, 'FC de repouso');
  if (rest >= max) throw new RangeError('FC de repouso precisa ser menor que a FC máxima');
  return ZONES.map((z) => ({
    key: z.key,
    name: z.name,
    minPct: z.minPct,
    maxPct: z.maxPct,
    min: karvonen(max, rest, z.minPct),
    max: karvonen(max, rest, z.maxPct),
  }));
}

function repsOf(reps) {
  if (!Number.isInteger(reps) || reps < 1) throw new RangeError(`repetições inválidas: ${reps}`);
  return reps;
}

/** 1RM Epley: w × (1 + reps/30); com 1 repetição, o próprio peso. */
export function oneRmEpley(w, reps) {
  positive(w, 'carga');
  repsOf(reps);
  return reps === 1 ? w : w * (1 + reps / 30);
}

/** 1RM Brzycki: w × 36 / (37 − reps), reps de 1 a 12. */
export function oneRmBrzycki(w, reps) {
  positive(w, 'carga');
  repsOf(reps);
  if (reps > 12) throw new RangeError('Brzycki aceita de 1 a 12 repetições');
  return (w * 36) / (37 - reps);
}

/** Gasto estimado: MET × kg × minutos / 60. */
export function kcalFromMet(met, kg, min) {
  positive(met, 'MET');
  positive(kg, 'peso');
  nonNegative(min, 'minutos');
  return (met * kg * min) / 60;
}

// ---------------------------------------------------------------------
// Treinos (B6.2.5)
// ---------------------------------------------------------------------

/**
 * Linha do tempo de um treino (programa ou treino montado).
 * Step = { kind, sec|null, estSec, exerciseId?, value?, round, index }.
 * - prepare: round 1, index 0.
 * - work-time / work-reps: round (1..rounds), index = posição do item na rodada; value = segundos ou reps.
 * - rest: descanso após o item `index` (o último item de cada rodada não tem descanso).
 * - roundRest: só entre rodadas, nunca após a última; index = último item.
 * Itens com exerciseId desconhecido são descartados antes de montar.
 */
export function buildTimeline(workout, exercisesById) {
  if (!workout || !Array.isArray(workout.items)) throw new RangeError('treino inválido');
  if (!exercisesById || typeof exercisesById !== 'object') throw new RangeError('exercisesById obrigatório');
  const rounds = workout.rounds === undefined ? 1 : workout.rounds;
  if (!Number.isInteger(rounds) || rounds < 1) throw new RangeError(`rodadas inválidas: ${rounds}`);
  const prepareSec = workout.prepareSec === undefined ? 10 : nonNegative(workout.prepareSec, 'preparo');
  const betweenSec = workout.restBetweenRoundsSec || 0;
  const items = workout.items.filter((it) => it && Object.prototype.hasOwnProperty.call(exercisesById, it.exerciseId));

  const steps = [{ kind: 'prepare', sec: prepareSec, estSec: prepareSec, round: 1, index: 0 }];
  for (let r = 1; r <= rounds; r++) {
    items.forEach((item, i) => {
      if (item.mode === 'time') {
        steps.push({ kind: 'work-time', sec: item.value, estSec: item.value, exerciseId: item.exerciseId, value: item.value, round: r, index: i });
      } else if (item.mode === 'reps') {
        steps.push({ kind: 'work-reps', sec: null, estSec: item.value * 3, exerciseId: item.exerciseId, value: item.value, round: r, index: i });
      } else {
        throw new RangeError(`modo inválido: ${item.mode}`);
      }
      // o ÚLTIMO item de CADA rodada não tem descanso próprio
      if (i < items.length - 1 && item.restSec > 0) {
        steps.push({ kind: 'rest', sec: item.restSec, estSec: item.restSec, round: r, index: i });
      }
    });
    // descanso entre rodadas; nada após a última
    if (r < rounds && betweenSec > 0) {
      steps.push({ kind: 'roundRest', sec: betweenSec, estSec: betweenSec, round: r, index: Math.max(0, items.length - 1) });
    }
  }
  return steps;
}

/** Duração estimada (s) = soma de estSec da linha do tempo. */
export function programDuration(program, exercisesById) {
  return buildTimeline(program, exercisesById).reduce((s, st) => s + st.estSec, 0);
}

// ---------------------------------------------------------------------
// Sequência e alimentos
// ---------------------------------------------------------------------

/** Dias seguidos com atividade terminando hoje (ou ontem, se hoje ainda não teve). */
export function streak(keys, today) {
  if (!Array.isArray(keys)) throw new RangeError('keys deve ser uma lista');
  const set = new Set(keys);
  let cur;
  if (set.has(today)) cur = today;
  else if (set.has(addDays(today, -1))) cur = addDays(today, -1);
  else return 0;
  let n = 0;
  while (set.has(cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

/**
 * Totais de nutrientes de uma lista de entradas { foodId, grams }.
 * Sempre usa `grams` (grams/100 × valores por 100 g). Alimento inexistente conta 0.
 */
export function foodTotals(entries, foodsById) {
  if (!Array.isArray(entries)) throw new RangeError('entries deve ser uma lista');
  if (!foodsById || typeof foodsById !== 'object') throw new RangeError('foodsById obrigatório');
  const t = { kcal: 0, prot: 0, carb: 0, gord: 0, fibra: 0 };
  for (const e of entries) {
    const f = Object.prototype.hasOwnProperty.call(foodsById, e.foodId) ? foodsById[e.foodId] : null;
    if (!f) continue;
    const k = e.grams / 100;
    t.kcal += f.kcal * k;
    t.prot += f.prot * k;
    t.carb += f.carb * k;
    t.gord += f.gord * k;
    t.fibra += (f.fibra || 0) * k;
  }
  return t;
}
