// index.js: lista de disciplinas disponíveis e loaders com especificadores literais (B11.1)
// Nunca use import dinâmico com variável — sempre especificador literal.

import anatomia from './anatomia.js';
import fisiologia from './fisiologia.js';
import treinamento from './treinamento.js';
import primeiros_socorros from './primeiros-socorros.js';
import avaliacao from './avaliacao.js';
import regras_esportes from './regras-esportes.js';

/** Metadados resumidos de cada disciplina (sem flashcards nem questões). */
export const SUBJECTS = [
  { id: anatomia.id,          title: anatomia.title,          icon: anatomia.icon },
  { id: fisiologia.id,        title: fisiologia.title,        icon: fisiologia.icon },
  { id: treinamento.id,       title: treinamento.title,       icon: treinamento.icon },
  { id: primeiros_socorros.id, title: primeiros_socorros.title, icon: primeiros_socorros.icon },
  { id: avaliacao.id,         title: avaliacao.title,         icon: avaliacao.icon },
  { id: regras_esportes.id,   title: regras_esportes.title,   icon: regras_esportes.icon },
];

/**
 * Loaders com especificadores LITERAIS — nunca usar variável dentro do import().
 * Retornam o módulo já importado estaticamente (sem overhead extra de rede).
 */
export const LOADERS = {
  'anatomia':           () => Promise.resolve({ subject: anatomia }),
  'fisiologia':         () => Promise.resolve({ subject: fisiologia }),
  'treinamento':        () => Promise.resolve({ subject: treinamento }),
  'primeiros-socorros': () => Promise.resolve({ subject: primeiros_socorros }),
  'avaliacao':          () => Promise.resolve({ subject: avaliacao }),
  'regras-esportes':    () => Promise.resolve({ subject: regras_esportes }),
};
