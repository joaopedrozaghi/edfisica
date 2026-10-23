// =====================================================================
//  CONFIGURAÇÃO DA OFERTA: edite SOMENTE este arquivo para mudar
//  preço, links, garantia, contador, bônus e depoimentos.
//
//  A página de vendas (/index.html) e o app (/app/) leem este arquivo.
//  Depois de editar, rode os testes (veja o README) para conferir se
//  preço, parcelas, bônus e números de conteúdo continuam coerentes.
//  Use ponto como separador decimal nos números (27.90, e não 27,90).
// =====================================================================
export const CONFIG = Object.freeze({
  // Nome e frase principal do produto (aparecem na página e no app).
  product: {
    name: 'EdFísica PRO',          // nome completo
    shortName: 'EdFísica',         // versão curta (espaços pequenos)
    tagline: 'Estude, treine e coma melhor em um só app',
  },

  // Preço da oferta.
  price: {
    current: 27.90,            // número com ponto decimal
    anchor: null,              // preço "De". Use null se você NÃO praticou esse preço antes (CDC art. 37):
                               // com null, somem "De", "Você economiza", "% OFF", "Valor total"
                               // e os valores riscados dos bônus (que passam a mostrar "Incluso").
    installmentsText: 'ou 4x de R$ 7,57', // ATUALIZE junto com o preço (copie o valor do seu checkout)
    paymentNote: 'Pagamento único · Sem mensalidades',
  },

  // Link do checkout (Hotmart, Kiwify, Eduzz etc.).
  checkout: {
    url: 'https://SEU-CHECKOUT-AQUI',
    // Parâmetros da URL da página que são repassados ao checkout (rastreamento de campanhas).
    passThroughParams: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'xcod'],
  },

  guarantee: { days: 7 },      // mínimo 7 (direito de arrependimento, CDC art. 49)

  // Acesso ao app.
  access: {
    lifetime: true,            // true = mostra "Acesso vitalício"
    requireCode: false,        // true = pede código ao abrir o app (barreira leve, NÃO é segurança)
    codeHashes: [],            // SHA-256 (hex, minúsculas) dos códigos válidos, gerado com o comando do README
                               // (que já converte o código para MAIÚSCULAS). Maiúsculas/minúsculas não importam.
  },

  // Suporte ao comprador.
  support: {
    whatsapp: '',              // só dígitos com DDI+DDD, ex.: '5511999999999'. Vazio = oculta.
    message: 'Olá! Preciso de ajuda com o EdFísica PRO.', // mensagem inicial no WhatsApp
    email: '',                 // opcional
  },

  // Contador regressivo da página de vendas.
  countdown: {
    enabled: true,             // Use o contador SOMENTE se a condição realmente terminar
                               // (preço ou bônus mudam de verdade). Caso contrário, use false (CDC art. 37).
    minutes: 15,               // duração do contador em minutos
    onExpire: 'hide',          // 'hide' (recomendado) | 'restart' (reinício perpétuo pode ser publicidade enganosa)
    label: 'Condição especial encerra em',
  },

  // Prova social (número de clientes e nota).
  socialProof: {
    enabled: false,            // ATIVE SOMENTE COM NÚMEROS REAIS
    customers: 0,              // ex.: 1200 → exibido como "+1.200"
    rating: 0,                 // ex.: 4.9
    label: 'alunos e professores',
  },

  // Números de conteúdo exibidos na página.
  contentStats: {              // precisam bater com o conteúdo real (os testes verificam)
    subjects: 6, questions: 90, flashcards: 72, exercises: 24, programs: 5, foods: 60, modules: 6,
  },

  // Produto principal na pilha de valor.
  mainProduct: { title: 'App EdFísica PRO completo (todos os módulos)', value: 97.00 }, // sem números fixos no título

  // Bônus (título, descrição, valor e emoji).
  bonuses: [
    {
      title: 'Simulados cronometrados + Caderno de erros',
      desc: 'Monte simulados por matéria, com tempo de prova, e revise depois só as questões que você errou até acertar todas.',
      value: 30.00,
      emoji: '⏱️',
    },
    {
      title: 'Planos alimentares prontos',
      desc: 'Cardápios para emagrecer, manter, ganhar massa ou seguir uma alimentação vegetariana, aplicados ao seu diário com um toque.',
      value: 20.00,
      emoji: '🥗',
    },
    {
      title: 'Programas Terceira Idade & Mobilidade',
      desc: 'Treinos guiados de baixo impacto, com apoio de cadeira e parede, para ganhar mobilidade, equilíbrio e autonomia no dia a dia.',
      value: 25.00,
      emoji: '🧘',
    },
  ],                           // mainProduct.value + soma dos bônus = price.anchor (quando anchor não for null).
                               // Com price.anchor: null, os valores não aparecem e a soma não é verificada.
                               // ATENÇÃO (CDC art. 37): os valores dos bônus também precisam ser reais
                               // (já vendidos separadamente). Se não forem, use price.anchor: null (mostra "Incluso").

  // Order bump (oferta adicional no checkout). Texto livre exibido perto do botão.
  orderBump: { enabled: false, text: '' },

  // Depoimentos.
  testimonials: {
    enabled: true,
    items: [                   // SUBSTITUA por depoimentos REAIS com autorização por escrito.
                               // Não invente nomes, fotos ou cidades e não use selos de verificação falsos.
      { example: true, text: 'Escreva aqui o depoimento real de um(a) estudante.', role: 'Estudante de Ed. Física' },
      { example: true, text: 'Escreva aqui o depoimento real de um(a) professor(a).', role: 'Professor(a) de Ed. Física' },
      { example: true, text: 'Escreva aqui o depoimento real de alguém que treina em casa.', role: 'Treina em casa' },
      { example: true, text: 'Escreva aqui o depoimento real de quem estuda para concurso.', role: 'Concurseiro(a)' },
      { example: true, text: 'Escreva aqui o depoimento real de um(a) personal trainer.', role: 'Personal trainer' },
      { example: true, text: 'Escreva aqui o depoimento real de alguém que usa a dieta do app.', role: 'Usa a dieta do app' },
    ],                         // item real: { example:false, text, name, role, city } (name/city opcionais)
  },

  seller: { name: '', document: '' },   // razão social e CNPJ/CPF (rodapé). Vazio = oculta.

  // Links legais (rodapé). Vazio = oculta. showMetaDisclaimer = aviso padrão de anúncios da Meta.
  legal: { termsUrl: '', privacyUrl: '', showMetaDisclaimer: true },

  site: {
    url: 'https://SEU-SITE.netlify.app', // endereço final do site (sem barra no fim)
    appPath: './app/',                   // caminho do app a partir da página de vendas
    showDemoLink: false,       // true = mostra "Ver demonstração" apontando para o app.
                               // ATENÇÃO: sem access.requireCode, isso libera o app completo para qualquer visitante.
  },
});
