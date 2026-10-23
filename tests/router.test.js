// router.test.js: testes do router (B11.1, B4.5)

import { test, assert, eq } from './harness.js';
import { matchRoute, parseQuery } from '../app/js/router.js';
import { parseDayParam } from '../app/js/utils.js';

// Route table de teste (simplificada, B4.5)
const TEST_ROUTES = [
  { pattern: '/' },
  { pattern: '/estudos' },
  { pattern: '/estudos/erros' },
  { pattern: '/estudos/revisao' },
  { pattern: '/estudos/:id' },
  { pattern: '/estudos/:id/flashcards' },
  { pattern: '/estudos/:id/quiz' },
  { pattern: '/treino' },
  { pattern: '/treino/exercicio/:id' },
  { pattern: '/treino/programa/:id' },
  { pattern: '/treino/montar' },
  { pattern: '/treino/montar/:id' },
  { pattern: '/treino/player/:kind/:id' },
];

test('router › matchRoute › /', () => {
  const m = matchRoute(TEST_ROUTES, '/');
  eq(m?.route.pattern, '/');
  eq(m?.params, {});
});

test('router › matchRoute › /estudos', () => {
  const m = matchRoute(TEST_ROUTES, '/estudos');
  eq(m?.route.pattern, '/estudos');
});

test('router › matchRoute › /estudos/erros (static beats :param)', () => {
  const m = matchRoute(TEST_ROUTES, '/estudos/erros');
  eq(m?.route.pattern, '/estudos/erros');
});

test('router › matchRoute › /estudos/revisao', () => {
  const m = matchRoute(TEST_ROUTES, '/estudos/revisao');
  eq(m?.route.pattern, '/estudos/revisao');
});

test('router › matchRoute › /estudos/anatomia → :id param', () => {
  const m = matchRoute(TEST_ROUTES, '/estudos/anatomia');
  eq(m?.route.pattern, '/estudos/:id');
  eq(m?.params.id, 'anatomia');
});

test('router › matchRoute › /estudos/anatomia/quiz → nested :id', () => {
  const m = matchRoute(TEST_ROUTES, '/estudos/anatomia/quiz');
  eq(m?.route.pattern, '/estudos/:id/quiz');
  eq(m?.params.id, 'anatomia');
});

test('router › matchRoute › /treino/montar vs /treino/montar/:id', () => {
  const m1 = matchRoute(TEST_ROUTES, '/treino/montar');
  eq(m1?.route.pattern, '/treino/montar');
  eq(m1?.params, {});
  
  const m2 = matchRoute(TEST_ROUTES, '/treino/montar/abc123');
  eq(m2?.route.pattern, '/treino/montar/:id');
  eq(m2?.params.id, 'abc123');
});

test('router › matchRoute › /treino/player/:kind/:id', () => {
  const m = matchRoute(TEST_ROUTES, '/treino/player/custom/x1');
  eq(m?.route.pattern, '/treino/player/:kind/:id');
  eq(m?.params.kind, 'custom');
  eq(m?.params.id, 'x1');
});

test('router › matchRoute › /nada → null', () => {
  const m = matchRoute(TEST_ROUTES, '/nada');
  eq(m, null);
});

test('router › parseQuery › ?d=2025-05-12&t=fc', () => {
  const q = parseQuery('d=2025-05-12&t=fc');
  eq(q.d, '2025-05-12');
  eq(q.t, 'fc');
});

test('router › parseQuery › vazio', () => {
  const q = parseQuery('');
  eq(q, {});
});

// parseDayParam tests (B4.5)
const today = '2025-05-12';

test('parseDayParam › hoje', () => {
  eq(parseDayParam('2025-05-12', today), '2025-05-12');
});

test('parseDayParam › 60 dias atrás (válido)', () => {
  eq(parseDayParam('2025-03-13', today), '2025-03-13');
});

test('parseDayParam › 61 dias atrás → null', () => {
  eq(parseDayParam('2025-03-12', today), null);
});

test('parseDayParam › futuro → null', () => {
  eq(parseDayParam('2025-05-13', today), null);
});

test('parseDayParam › data inválida → null', () => {
  eq(parseDayParam('2025-02-30', today), null);
});

test('parseDayParam › formato errado → null', () => {
  eq(parseDayParam('12/05/2025', today), null);
});

test('parseDayParam › undefined → hoje', () => {
  eq(parseDayParam(undefined, today), today);
});

test('parseDayParam › vazio → hoje', () => {
  eq(parseDayParam('', today), today);
});
