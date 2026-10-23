// calc.test.js: todas as linhas da tabela B7 + fixture da linha do tempo (B6.2.5).
import { test, assert, eq, close, throws } from './harness.js';
import * as calc from '../app/js/calc.js';
import { fmt1, fmtInt } from '../app/js/utils.js';

test('IMC 70 kg / 175 cm = 22,9 "Peso normal" (valor obrigatório)', () => {
  close(calc.bmi(70, 175), 22.857, 0.001);
  eq(calc.round1(calc.bmi(70, 175)), 22.9);
  eq(calc.bmiClass(22.9).label, 'Peso normal');
  eq(calc.bmiClass(22.9).key, 'normal');
  eq(fmt1(calc.bmi(70, 175)), '22,9');
});

test('round1', () => {
  eq(calc.round1(22.857), 22.9);
  eq(calc.round1(16.14), 16.1);
});

test('bmiClass: limites das faixas', () => {
  eq(calc.bmiClass(18.4).key, 'abaixo');
  eq(calc.bmiClass(18.5).key, 'normal');
  eq(calc.bmiClass(24.9).key, 'normal');
  eq(calc.bmiClass(25.0).key, 'sobrepeso');
  eq(calc.bmiClass(29.9).key, 'sobrepeso');
  eq(calc.bmiClass(30.0).key, 'obesidade1');
  eq(calc.bmiClass(34.9).label, 'Obesidade grau I');
  eq(calc.bmiClass(35.0).key, 'obesidade2');
  eq(calc.bmiClass(39.9).label, 'Obesidade grau II');
  eq(calc.bmiClass(40).key, 'obesidade3');
  eq(calc.bmiClass(40).label, 'Obesidade grau III');
  eq(calc.bmiClass(18.4).label, 'Abaixo do peso');
  eq(calc.bmiClass(24.94).key, 'normal'); // 24,94 → 24,9
});

test('healthyWeightRange(175) = 56,7 a 76,3', () => {
  eq(calc.healthyWeightRange(175), { min: 56.7, max: 76.3 });
});

test('bmr Mifflin-St Jeor (valor obrigatório 1780)', () => {
  eq(calc.bmr({ sex: 'M', kg: 80, cm: 180, age: 30 }), 1780);
  eq(calc.bmr({ sex: 'F', kg: 80, cm: 180, age: 30 }), 1614);
  eq(fmtInt(calc.bmr({ sex: 'M', kg: 80, cm: 180, age: 30 })), '1.780');
});

test('ACTIVITY e tdee', () => {
  eq(calc.ACTIVITY, { sedentario: 1.2, leve: 1.375, moderado: 1.55, intenso: 1.725, muito_intenso: 1.9 });
  close(calc.tdee(1780, 'moderado'), 2759, 0.001);
  throws(() => calc.tdee(1780, 'xyz'), RangeError);
});

test('goalCalories com piso na TMB', () => {
  eq(calc.goalCalories(2759, 'manter', 1780), { kcal: 2759, floored: false });
  eq(calc.goalCalories(1780 * 1.2, 'perder', 1780), { kcal: 1780, floored: true });
  eq(calc.goalCalories(2759, 'ganhar', 1780), { kcal: 3035, floored: false });
  throws(() => calc.goalCalories(2759, 'nada', 1780), RangeError);
});

test('macroTargets 2759 kcal / 80 kg / manter', () => {
  eq(calc.macroTargets({ kcal: 2759, kg: 80, goal: 'manter' }), { prot: 128, carb: 389, gord: 77 });
});

test('macrosFromPct', () => {
  eq(calc.macrosFromPct(2000, { prot: 30, carb: 45, gord: 25 }), { prot: 150, carb: 225, gord: 56 });
});

test('waterMl', () => {
  eq(calc.waterMl(80), 2800);
  eq(calc.waterMl(70), 2450);
});

test('bodyFatNavy (Marinha EUA)', () => {
  eq(calc.bodyFatNavy({ sex: 'M', cm: 180, neck: 38, waist: 85 }), 16.1);
  eq(calc.bodyFatNavy({ sex: 'F', cm: 165, neck: 33, waist: 75, hip: 100 }), 29.4);
  throws(() => calc.bodyFatNavy({ sex: 'M', cm: 180, neck: 40, waist: 40 }), RangeError);
});

test('bodyFatClass: limites semiabertos (B6.5)', () => {
  eq(calc.bodyFatClass('M', 5.9).key, 'essencial');
  eq(calc.bodyFatClass('M', 6.0).key, 'atleta');
  eq(calc.bodyFatClass('M', 13.9).key, 'atleta');
  eq(calc.bodyFatClass('M', 14.0).key, 'boa-forma');
  eq(calc.bodyFatClass('M', 16.1).key, 'boa-forma');
  eq(calc.bodyFatClass('M', 16.1).label, 'Boa forma');
  eq(calc.bodyFatClass('M', 25).label, 'Acima da média');
  eq(calc.bodyFatClass('F', 9.9).key, 'abaixo');
  eq(calc.bodyFatClass('F', 9.9).label, 'Abaixo do essencial');
  eq(calc.bodyFatClass('F', 31.9).key, 'media');
  eq(calc.bodyFatClass('F', 32.0).key, 'acima');
  eq(calc.bodyFatClass('F', 29.4).key, 'media');
  eq(calc.bodyFatClass('F', 29.4).label, 'Média');
});

test('whr e whrRisk', () => {
  eq(calc.whr(85, 100), 0.85);
  eq(calc.whrRisk('M', 0.9), 'aumentado');
  eq(calc.whrRisk('M', 0.89), 'normal');
  eq(calc.whrRisk('F', 0.84), 'normal');
  eq(calc.whrRisk('F', 0.85), 'aumentado');
});

test('hrMax e Karvonen', () => {
  eq(calc.hrMax(30), 190);
  eq(calc.hrMax(30, 'fox'), 190);
  eq(calc.hrMax(30, 'tanaka'), 187);
  eq(calc.karvonen(190, 60, 0.6), 138);
  eq(calc.karvonen(190, 60, 0.7), 151);
});

test('hrZones: Z2 138–151 e erro quando repouso >= máxima', () => {
  const z = calc.hrZones(190, 60);
  eq(z.length, 5);
  eq(z[1].min, 138);
  eq(z[1].max, 151);
  eq(z[1].minPct, 0.6);
  eq(z[1].maxPct, 0.7);
  eq(z[0].min, 125);
  eq(z[4].max, 190);
  assert(typeof z[0].name === 'string' && z[0].name.length > 0, 'zona sem nome');
  throws(() => calc.hrZones(120, 120), RangeError);
  throws(() => calc.hrZones(120, 130), RangeError);
});

test('1RM Epley e Brzycki', () => {
  close(calc.oneRmEpley(100, 10), 133.33, 0.01);
  close(calc.oneRmBrzycki(100, 10), 133.33, 0.01);
  eq(calc.oneRmEpley(100, 1), 100);
  close(calc.oneRmBrzycki(100, 1), 100, 0.001);
  throws(() => calc.oneRmBrzycki(100, 13), RangeError);
  throws(() => calc.oneRmEpley(100, 0), RangeError);
});

test('kcalFromMet', () => {
  close(calc.kcalFromMet(8, 70, 30), 280, 0.001);
  eq(calc.kcalFromMet(8, 70, 0), 0);
});

// Fixture B6.2.5: 2 rodadas × [A tempo 30 s desc 20, B reps 10 desc 20], roundRest 60, preparo 10.
const EX = { a: { id: 'a', met: 8 }, b: { id: 'b', met: 3.8 } };
const FIXTURE = {
  rounds: 2, restBetweenRoundsSec: 60, prepareSec: 10,
  items: [
    { exerciseId: 'a', mode: 'time', value: 30, restSec: 20 },
    { exerciseId: 'b', mode: 'reps', value: 10, restSec: 20 },
  ],
};

test('buildTimeline: fixture com 8 passos', () => {
  const t = calc.buildTimeline(FIXTURE, EX);
  eq(t.map((s) => s.kind), ['prepare', 'work-time', 'rest', 'work-reps', 'roundRest', 'work-time', 'rest', 'work-reps']);
  eq(t.length, 8);
  eq(t[1].exerciseId, 'a');
  eq(t[1].sec, 30);
  eq(t[3].sec, null);
  eq(t[3].estSec, 30);
  eq(t[5].round, 2);
  eq(t[7].index, 1);
});

test('programDuration: fixture = 230 s', () => {
  eq(calc.programDuration(FIXTURE, EX), 230);
});

test('buildTimeline descarta exercícios desconhecidos', () => {
  const w = Object.assign({}, FIXTURE, { rounds: 1, items: FIXTURE.items.concat([{ exerciseId: 'sumiu', mode: 'time', value: 30, restSec: 20 }]) });
  const t = calc.buildTimeline(w, EX);
  eq(t.map((s) => s.kind), ['prepare', 'work-time', 'rest', 'work-reps']);
  throws(() => calc.buildTimeline({ items: [] }), RangeError);
});

test('streak (B4.4)', () => {
  eq(calc.streak(['2025-05-10', '2025-05-11'], '2025-05-12'), 2);
  eq(calc.streak(['2025-05-10', '2025-05-11', '2025-05-12'], '2025-05-12'), 3);
  eq(calc.streak(['2025-05-09'], '2025-05-12'), 0);
  eq(calc.streak([], '2025-05-12'), 0);
});

test('foodTotals: 100 g de arroz = 128 kcal', () => {
  const foods = { arroz: { kcal: 128, prot: 2.5, carb: 28.1, gord: 0.2, fibra: 1.6 } };
  const t = calc.foodTotals([{ foodId: 'arroz', grams: 100 }], foods);
  close(t.kcal, 128, 0.0001);
  close(t.carb, 28.1, 0.0001);
  const t2 = calc.foodTotals([{ foodId: 'arroz', grams: 150 }, { foodId: 'sumiu', grams: 100 }], foods);
  close(t2.kcal, 192, 0.0001);
});

test('RangeError em entradas fora do domínio', () => {
  throws(() => calc.bmi(0, 175), RangeError);
  throws(() => calc.bmi(70, NaN), RangeError);
  throws(() => calc.bmi(null, 175), RangeError);
  throws(() => calc.bmr({ sex: 'X', kg: 80, cm: 180, age: 30 }), RangeError);
  throws(() => calc.bmr({ sex: 'M', kg: null, cm: 180, age: 30 }), RangeError);
  throws(() => calc.waterMl(0), RangeError);
  throws(() => calc.healthyWeightRange(-1), RangeError);
  throws(() => calc.hrMax(30, 'outra'), RangeError);
  throws(() => calc.whr(85, 0), RangeError);
});
