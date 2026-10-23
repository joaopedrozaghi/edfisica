// access.js: código de acesso opcional (B4.6).
// Por enquanto só os helpers puros; a tela de bloqueio entra junto com o shell do app.
// É uma barreira leve, NÃO é segurança (qualquer pessoa pode ler o JS).
// Sem efeitos colaterais na importação.

/** Normaliza o código: tira espaços das pontas e converte para MAIÚSCULAS. */
export function normalizeCode(s) {
  return String(s).trim().toUpperCase();
}

/** SHA-256 do texto em hex minúsculo. Requer contexto seguro (https:// ou localhost). */
export async function hashCode(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, '0')).join('');
}
