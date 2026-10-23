// utils.test.js: helpers puros de app/js/utils.js (B4.3, B4.5, B11.1).
import { test, assert, eq } from './harness.js';
import {
  parseNum, parseIntBR, fmt1, fmtInt, fmtBRL, clamp,
  dateKey, addDays, weekKeys, labelShort, parseDayParam,
  uid, shuffle, normalize, slugify, esc, debounce,
} from '../app/js/utils.js';

test('parseNum: decimais com vírgula ou ponto', () => {
  eq(parseNum('70,5'), 70.5);
  eq(parseNum('1.75'), 1.75);
  eq(parseNum(' 80 '), 80);
  assert(Number.isNaN(parseNum('abc')), "parseNum('abc') deve ser NaN");
  assert(Number.isNaN(parseNum('')), "parseNum('') deve ser NaN");
});

test('parseIntBR: inteiros com milhar pt-BR', () => {
  eq(parseIntBR('8.000'), 8000);
  eq(parseIntBR('100.000'), 100000);
  eq(parseIntBR('8000'), 8000);
  eq(parseIntBR(' 42 '), 42);
  assert(Number.isNaN(parseIntBR('8,5')), "'8,5' deve ser NaN");
  assert(Number.isNaN(parseIntBR('1.50')), "'1.50' deve ser NaN");
  assert(Number.isNaN(parseIntBR('8.5')), "'8.5' deve ser NaN");
  assert(Number.isNaN(parseIntBR('')), "'' deve ser NaN");
});

test('formatadores pt-BR', () => {
  eq(fmt1(22.857), '22,9');
  eq(fmt1(70), '70,0');
  eq(fmtInt(1780), '1.780');
  eq(fmtInt(2759), '2.759');
  eq(fmtInt(42), '42');
  eq(fmtBRL(27.9).replace(/\u00A0/g, ' '), 'R$ 27,90');
  assert(fmtBRL(27.9).indexOf('\u00A0') !== -1, 'fmtBRL mantém o espaço U+00A0');
  eq(fmtBRL(197).replace(/\u00A0/g, ' '), 'R$ 197,00');
});

test('clamp', () => {
  eq(clamp(5, 0, 10), 5);
  eq(clamp(-1, 0, 10), 0);
  eq(clamp(11, 0, 10), 10);
});

test('dateKey usa a data local (não UTC)', () => {
  eq(dateKey(new Date(2025, 4, 12, 23, 30)), '2025-05-12');
  eq(dateKey(new Date(2025, 0, 1, 0, 5)), '2025-01-01');
});

test('addDays atravessa meses e anos', () => {
  eq(addDays('2025-05-12', 1), '2025-05-13');
  eq(addDays('2025-05-31', 1), '2025-06-01');
  eq(addDays('2025-01-01', -1), '2024-12-31');
  eq(addDays('2025-05-12', -60), '2025-03-13');
});

test('weekKeys começa na segunda-feira', () => {
  const w = weekKeys('2025-05-14'); // quarta
  eq(w.length, 7);
  eq(w[0], '2025-05-12');
  eq(w[6], '2025-05-18');
  eq(weekKeys('2025-05-18')[0], '2025-05-12'); // domingo pertence à semana iniciada na segunda
  eq(weekKeys('2025-05-12')[0], '2025-05-12');
});

test('labelShort sem ponto final', () => {
  eq(labelShort('2025-05-12'), 'seg 12/05');
});

test('parseDayParam (B4.5)', () => {
  const t = '2025-05-12';
  eq(parseDayParam('2025-05-12', t), '2025-05-12');
  eq(parseDayParam('2025-03-13', t), '2025-03-13');
  eq(parseDayParam('2025-03-12', t), null);
  eq(parseDayParam('2025-05-13', t), null);
  eq(parseDayParam('2025-02-30', t), null);
  eq(parseDayParam('12/05/2025', t), null);
  eq(parseDayParam(undefined, t), '2025-05-12');
  eq(parseDayParam('', t), '2025-05-12');
});

test('uid: único e ordenável pelo tempo', () => {
  const a = uid();
  const b = uid();
  assert(typeof a === 'string' && a.length >= 10, 'uid curto demais');
  assert(a !== b, 'uids repetidos');
  assert(/^[0-9a-z]+$/.test(a), 'uid só com base 36');
  assert(b > a, 'uid criado depois precisa ordenar depois');
});

test('shuffle preserva os elementos e não altera a original', () => {
  const src = [1, 2, 2, 3, 4, 5, 6, 7, 8, 9];
  const s = shuffle(src);
  eq(src, [1, 2, 2, 3, 4, 5, 6, 7, 8, 9]);
  eq(s.slice().sort((x, y) => x - y), src);
  eq(shuffle([]), []);
});

test('normalize remove acentos', () => {
  eq(normalize('Feijão'), 'feijao');
  eq(normalize('  AÇAÍ '), 'acai');
});

test('slugify (exemplos B4.3)', () => {
  eq(slugify('Chute glúteo (anfersen)'), 'chute-gluteo');
  eq(slugify('Agachamento búlgaro (cadeira)'), 'agachamento-bulgaro');
  eq(slugify('Mobilidade de quadril 90/90'), 'mobilidade-de-quadril-90-90');
  eq(slugify('Agachamento livre'), 'agachamento-livre');
});

test('esc escapa HTML', () => {
  eq(esc('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
  eq(esc("a & 'b'"), 'a &amp; &#39;b&#39;');
});

test('debounce chama uma vez só', async () => {
  let n = 0;
  const f = debounce(() => { n++; }, 10);
  f(); f(); f();
  await new Promise((r) => setTimeout(r, 40));
  eq(n, 1);
});
