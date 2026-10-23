// run.js: lista de arquivos de teste. Cada feature acrescenta os seus aqui.
// import() com variável é permitido só nos testes (no app, sempre especificador literal).
import { run } from './harness.js';

export const TEST_FILES = [
  './config.test.js',
  './utils.test.js',
  './calc.test.js',
  './store.test.js',
  './repo.test.js',
  './router.test.js',
  './data.test.js',
];

run(TEST_FILES, (file) => import(file));
