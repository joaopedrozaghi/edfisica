// foods.js: ~60 alimentos brasileiros com valores por 100 g (TACO 4ª ed., NEPA/UNICAMP 2011)
// Campos: id, name, group, kcal, prot, carb, gord, fibra (por 100 g), portions (lista de porções caseiras)
// Seis âncoras exatas (AC – não alterar): arroz-branco, feijao-carioca, frango-peito, ovo-cozido, banana-prata, pao-frances

export const FOODS = [
  // ── CEREAIS ──────────────────────────────────────────────────────────────
  {
    id: 'arroz-branco',
    name: 'Arroz branco cozido',
    group: 'cereais',
    kcal: 128, prot: 2.5, carb: 28.1, gord: 0.2, fibra: 1.6,
    portions: [
      { label: 'Colher de servir (50 g)', g: 50 },
      { label: 'Escumadeira cheia (100 g)', g: 100 },
      { label: 'Prato fundo (200 g)', g: 200 },
    ],
  },
  {
    id: 'arroz-integral',
    name: 'Arroz integral cozido',
    group: 'cereais',
    kcal: 124, prot: 2.6, carb: 25.8, gord: 1.0, fibra: 2.7,
    portions: [
      { label: 'Colher de servir (50 g)', g: 50 },
      { label: 'Escumadeira cheia (100 g)', g: 100 },
    ],
  },
  {
    id: 'macarrao-cozido',
    name: 'Macarrão cozido',
    group: 'cereais',
    kcal: 110, prot: 3.6, carb: 22.6, gord: 0.5, fibra: 1.7,
    portions: [
      { label: 'Escumadeira (100 g)', g: 100 },
      { label: 'Prato fundo (200 g)', g: 200 },
    ],
  },
  {
    id: 'aveia',
    name: 'Aveia em flocos',
    group: 'cereais',
    kcal: 394, prot: 13.9, carb: 66.6, gord: 8.5, fibra: 9.1,
    portions: [
      { label: 'Colher de sopa (10 g)', g: 10 },
      { label: 'Porção (40 g)', g: 40 },
    ],
  },
  {
    id: 'pao-integral',
    name: 'Pão de forma integral',
    group: 'cereais',
    kcal: 253, prot: 9.4, carb: 46.0, gord: 3.4, fibra: 5.2,
    portions: [
      { label: 'Fatia (25 g)', g: 25 },
      { label: '2 fatias (50 g)', g: 50 },
    ],
  },
  {
    id: 'pao-frances',
    name: 'Pão francês',
    group: 'cereais',
    kcal: 300, prot: 8.0, carb: 58.6, gord: 3.1, fibra: 2.3,
    portions: [
      { label: 'Unidade pequena (50 g)', g: 50 },
      { label: 'Unidade média (80 g)', g: 80 },
    ],
  },
  {
    id: 'tapioca',
    name: 'Tapioca (goma hidratada)',
    group: 'cereais',
    kcal: 98, prot: 0.1, carb: 24.0, gord: 0.1, fibra: 1.3,
    portions: [
      { label: 'Tapioca pequena (60 g)', g: 60 },
      { label: 'Tapioca média (80 g)', g: 80 },
    ],
  },
  {
    id: 'cuscuz',
    name: 'Cuscuz de milho cozido',
    group: 'cereais',
    kcal: 100, prot: 2.2, carb: 21.0, gord: 0.5, fibra: 1.5,
    portions: [
      { label: 'Fatia (60 g)', g: 60 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },

  // ── LEGUMINOSAS ───────────────────────────────────────────────────────────
  {
    id: 'feijao-carioca',
    name: 'Feijão carioca cozido',
    group: 'leguminosas',
    kcal: 76, prot: 4.8, carb: 13.6, gord: 0.5, fibra: 8.5,
    portions: [
      { label: 'Concha pequena (80 g)', g: 80 },
      { label: 'Concha média (120 g)', g: 120 },
    ],
  },
  {
    id: 'feijao-preto',
    name: 'Feijão preto cozido',
    group: 'leguminosas',
    kcal: 77, prot: 4.5, carb: 14.0, gord: 0.5, fibra: 8.4,
    portions: [
      { label: 'Concha pequena (80 g)', g: 80 },
      { label: 'Concha média (120 g)', g: 120 },
    ],
  },
  {
    id: 'lentilha',
    name: 'Lentilha cozida',
    group: 'leguminosas',
    kcal: 93, prot: 7.6, carb: 15.6, gord: 0.4, fibra: 7.9,
    portions: [
      { label: 'Colher de servir (60 g)', g: 60 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'grao-de-bico',
    name: 'Grão-de-bico cozido',
    group: 'leguminosas',
    kcal: 164, prot: 9.0, carb: 27.4, gord: 2.6, fibra: 6.4,
    portions: [
      { label: 'Porção (60 g)', g: 60 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'ervilha',
    name: 'Ervilha cozida',
    group: 'leguminosas',
    kcal: 95, prot: 7.8, carb: 16.5, gord: 0.2, fibra: 8.3,
    portions: [
      { label: 'Colher de servir (50 g)', g: 50 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'soja',
    name: 'Soja cozida',
    group: 'leguminosas',
    kcal: 140, prot: 14.1, carb: 11.5, gord: 5.0, fibra: 9.7,
    portions: [
      { label: 'Porção (80 g)', g: 80 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },

  // ── CARNES ────────────────────────────────────────────────────────────────
  {
    id: 'frango-peito',
    name: 'Peito de frango grelhado',
    group: 'carnes',
    kcal: 159, prot: 32.0, carb: 0, gord: 2.5, fibra: 0,
    portions: [
      { label: 'Filé pequeno (100 g)', g: 100 },
      { label: 'Filé médio (150 g)', g: 150 },
    ],
  },
  {
    id: 'frango-assado',
    name: 'Frango inteiro assado',
    group: 'carnes',
    kcal: 218, prot: 28.0, carb: 0, gord: 12.0, fibra: 0,
    portions: [
      { label: 'Coxa e sobrecoxa (120 g)', g: 120 },
      { label: 'Pedaço (200 g)', g: 200 },
    ],
  },
  {
    id: 'carne-patinho',
    name: 'Patinho cozido',
    group: 'carnes',
    kcal: 219, prot: 35.3, carb: 0, gord: 8.2, fibra: 0,
    portions: [
      { label: 'Bife médio (100 g)', g: 100 },
      { label: 'Bife grande (150 g)', g: 150 },
    ],
  },
  {
    id: 'carne-acem',
    name: 'Acém cozido',
    group: 'carnes',
    kcal: 266, prot: 32.2, carb: 0, gord: 15.1, fibra: 0,
    portions: [
      { label: 'Pedaço (100 g)', g: 100 },
      { label: 'Pedaço grande (150 g)', g: 150 },
    ],
  },
  {
    id: 'tilapia',
    name: 'Filé de tilápia grelhado',
    group: 'carnes',
    kcal: 96, prot: 20.0, carb: 0, gord: 1.7, fibra: 0,
    portions: [
      { label: 'Filé pequeno (100 g)', g: 100 },
      { label: 'Filé médio (150 g)', g: 150 },
    ],
  },
  {
    id: 'atum-lata',
    name: 'Atum em lata (em água)',
    group: 'carnes',
    kcal: 110, prot: 26.0, carb: 0, gord: 0.8, fibra: 0,
    portions: [
      { label: 'Lata pequena (90 g)', g: 90 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'sardinha',
    name: 'Sardinha em lata',
    group: 'carnes',
    kcal: 192, prot: 27.0, carb: 0, gord: 9.0, fibra: 0,
    portions: [
      { label: 'Unidade (30 g)', g: 30 },
      { label: 'Lata (100 g)', g: 100 },
    ],
  },
  {
    id: 'lombo-suino',
    name: 'Lombo suíno assado',
    group: 'carnes',
    kcal: 197, prot: 29.5, carb: 0, gord: 8.4, fibra: 0,
    portions: [
      { label: 'Fatia (100 g)', g: 100 },
      { label: 'Fatia grande (150 g)', g: 150 },
    ],
  },

  // ── OVOS E LATICÍNIOS ─────────────────────────────────────────────────────
  {
    id: 'ovo-cozido',
    name: 'Ovo cozido',
    group: 'ovos_laticinios',
    kcal: 146, prot: 13.3, carb: 0.6, gord: 9.5, fibra: 0,
    portions: [
      { label: 'Unidade pequena (45 g)', g: 45 },
      { label: 'Unidade média (55 g)', g: 55 },
    ],
  },
  {
    id: 'leite-integral',
    name: 'Leite integral',
    group: 'ovos_laticinios',
    kcal: 61, prot: 3.2, carb: 4.6, gord: 3.3, fibra: 0,
    portions: [
      { label: 'Copo (200 ml)', g: 200 },
      { label: 'Xícara (240 ml)', g: 240 },
    ],
  },
  {
    id: 'iogurte-natural',
    name: 'Iogurte natural integral',
    group: 'ovos_laticinios',
    kcal: 66, prot: 3.6, carb: 4.9, gord: 3.3, fibra: 0,
    portions: [
      { label: 'Copo (170 g)', g: 170 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'queijo-minas',
    name: 'Queijo minas frescal',
    group: 'ovos_laticinios',
    kcal: 264, prot: 17.4, carb: 3.2, gord: 20.2, fibra: 0,
    portions: [
      { label: 'Fatia (30 g)', g: 30 },
      { label: 'Fatia grande (50 g)', g: 50 },
    ],
  },
  {
    id: 'cottage',
    name: 'Queijo cottage',
    group: 'ovos_laticinios',
    kcal: 98, prot: 12.5, carb: 3.5, gord: 4.0, fibra: 0,
    portions: [
      { label: 'Porção (100 g)', g: 100 },
      { label: 'Colher de sopa (30 g)', g: 30 },
    ],
  },
  {
    id: 'requeijao',
    name: 'Requeijão cremoso',
    group: 'ovos_laticinios',
    kcal: 230, prot: 7.9, carb: 2.7, gord: 21.4, fibra: 0,
    portions: [
      { label: 'Colher de sopa (30 g)', g: 30 },
      { label: 'Porção (50 g)', g: 50 },
    ],
  },

  // ── FRUTAS ───────────────────────────────────────────────────────────────
  {
    id: 'banana-prata',
    name: 'Banana prata',
    group: 'frutas',
    kcal: 98, prot: 1.3, carb: 26.0, gord: 0.1, fibra: 2.0,
    portions: [
      { label: 'Unidade pequena (80 g)', g: 80 },
      { label: 'Unidade média (100 g)', g: 100 },
    ],
  },
  {
    id: 'maca',
    name: 'Maçã',
    group: 'frutas',
    kcal: 56, prot: 0.3, carb: 15.2, gord: 0.1, fibra: 1.3,
    portions: [
      { label: 'Unidade pequena (130 g)', g: 130 },
      { label: 'Unidade média (180 g)', g: 180 },
    ],
  },
  {
    id: 'laranja',
    name: 'Laranja pera',
    group: 'frutas',
    kcal: 37, prot: 0.9, carb: 8.9, gord: 0.1, fibra: 0.8,
    portions: [
      { label: 'Unidade (180 g)', g: 180 },
      { label: 'Fatia (60 g)', g: 60 },
    ],
  },
  {
    id: 'mamao',
    name: 'Mamão papaia',
    group: 'frutas',
    kcal: 45, prot: 0.8, carb: 11.4, gord: 0.1, fibra: 1.8,
    portions: [
      { label: 'Fatia (200 g)', g: 200 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'manga',
    name: 'Manga tommy',
    group: 'frutas',
    kcal: 64, prot: 0.5, carb: 17.1, gord: 0.2, fibra: 1.3,
    portions: [
      { label: 'Fatia (100 g)', g: 100 },
      { label: 'Meia manga (200 g)', g: 200 },
    ],
  },
  {
    id: 'abacaxi',
    name: 'Abacaxi',
    group: 'frutas',
    kcal: 48, prot: 0.9, carb: 12.3, gord: 0.1, fibra: 1.0,
    portions: [
      { label: 'Fatia (80 g)', g: 80 },
      { label: 'Porção (150 g)', g: 150 },
    ],
  },
  {
    id: 'morango',
    name: 'Morango',
    group: 'frutas',
    kcal: 30, prot: 0.9, carb: 7.0, gord: 0.4, fibra: 2.4,
    portions: [
      { label: '5 unidades (80 g)', g: 80 },
      { label: '10 unidades (160 g)', g: 160 },
    ],
  },
  {
    id: 'melancia',
    name: 'Melancia',
    group: 'frutas',
    kcal: 33, prot: 0.7, carb: 8.0, gord: 0.1, fibra: 0.4,
    portions: [
      { label: 'Fatia (200 g)', g: 200 },
      { label: 'Porção (300 g)', g: 300 },
    ],
  },
  {
    id: 'goiaba',
    name: 'Goiaba',
    group: 'frutas',
    kcal: 54, prot: 2.6, carb: 12.5, gord: 1.0, fibra: 6.2,
    portions: [
      { label: 'Unidade (100 g)', g: 100 },
      { label: 'Meia goiaba (60 g)', g: 60 },
    ],
  },

  // ── VERDURAS E LEGUMES ────────────────────────────────────────────────────
  {
    id: 'alface',
    name: 'Alface',
    group: 'verduras',
    kcal: 11, prot: 1.3, carb: 1.7, gord: 0.2, fibra: 0.6,
    portions: [
      { label: 'Folha (10 g)', g: 10 },
      { label: 'Porção (50 g)', g: 50 },
    ],
  },
  {
    id: 'tomate',
    name: 'Tomate',
    group: 'verduras',
    kcal: 15, prot: 1.1, carb: 3.1, gord: 0.2, fibra: 1.2,
    portions: [
      { label: 'Fatia (30 g)', g: 30 },
      { label: 'Tomate médio (100 g)', g: 100 },
    ],
  },
  {
    id: 'cenoura',
    name: 'Cenoura crua',
    group: 'verduras',
    kcal: 34, prot: 1.3, carb: 7.7, gord: 0.2, fibra: 3.2,
    portions: [
      { label: 'Cenoura média (80 g)', g: 80 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'brocolis',
    name: 'Brócolis cozido',
    group: 'verduras',
    kcal: 25, prot: 2.5, carb: 4.4, gord: 0.3, fibra: 2.0,
    portions: [
      { label: 'Ramo (60 g)', g: 60 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'espinafre',
    name: 'Espinafre cozido',
    group: 'verduras',
    kcal: 24, prot: 2.8, carb: 3.7, gord: 0.3, fibra: 2.3,
    portions: [
      { label: 'Colher de servir (50 g)', g: 50 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'abobrinha',
    name: 'Abobrinha cozida',
    group: 'verduras',
    kcal: 16, prot: 1.1, carb: 3.4, gord: 0.1, fibra: 0.6,
    portions: [
      { label: 'Fatia (60 g)', g: 60 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },
  {
    id: 'cebola',
    name: 'Cebola',
    group: 'verduras',
    kcal: 36, prot: 1.2, carb: 8.4, gord: 0.1, fibra: 1.6,
    portions: [
      { label: 'Meia cebola (50 g)', g: 50 },
      { label: 'Cebola média (100 g)', g: 100 },
    ],
  },

  // ── TUBÉRCULOS ────────────────────────────────────────────────────────────
  {
    id: 'batata',
    name: 'Batata cozida',
    group: 'tuberculos',
    kcal: 52, prot: 1.2, carb: 11.9, gord: 0.1, fibra: 1.3,
    portions: [
      { label: 'Batata pequena (100 g)', g: 100 },
      { label: 'Batata média (150 g)', g: 150 },
    ],
  },
  {
    id: 'batata-doce',
    name: 'Batata-doce cozida',
    group: 'tuberculos',
    kcal: 77, prot: 0.6, carb: 18.4, gord: 0.1, fibra: 2.2,
    portions: [
      { label: 'Pedaço (100 g)', g: 100 },
      { label: 'Batata média (150 g)', g: 150 },
    ],
  },
  {
    id: 'mandioca',
    name: 'Mandioca cozida',
    group: 'tuberculos',
    kcal: 125, prot: 0.8, carb: 30.1, gord: 0.1, fibra: 1.9,
    portions: [
      { label: 'Pedaço (100 g)', g: 100 },
      { label: 'Pedaço grande (150 g)', g: 150 },
    ],
  },
  {
    id: 'inhame',
    name: 'Inhame cozido',
    group: 'tuberculos',
    kcal: 97, prot: 1.5, carb: 23.0, gord: 0.1, fibra: 1.6,
    portions: [
      { label: 'Pedaço (80 g)', g: 80 },
      { label: 'Porção (100 g)', g: 100 },
    ],
  },

  // ── OLEAGINOSAS E ÓLEOS ────────────────────────────────────────────────────
  {
    id: 'amendoim',
    name: 'Amendoim torrado',
    group: 'oleaginosas',
    kcal: 581, prot: 27.7, carb: 18.5, gord: 49.7, fibra: 7.0,
    portions: [
      { label: 'Porção (30 g)', g: 30 },
      { label: 'Porção (50 g)', g: 50 },
    ],
  },
  {
    id: 'castanha-para',
    name: 'Castanha-do-pará',
    group: 'oleaginosas',
    kcal: 643, prot: 14.3, carb: 12.3, gord: 63.5, fibra: 7.9,
    portions: [
      { label: 'Unidade (5 g)', g: 5 },
      { label: '4 unidades (20 g)', g: 20 },
    ],
  },
  {
    id: 'azeite',
    name: 'Azeite de oliva',
    group: 'oleaginosas',
    kcal: 884, prot: 0, carb: 0, gord: 100.0, fibra: 0,
    portions: [
      { label: 'Colher de sopa (15 ml)', g: 15 },
      { label: 'Colher de chá (5 ml)', g: 5 },
    ],
  },
  {
    id: 'manteiga',
    name: 'Manteiga',
    group: 'oleaginosas',
    kcal: 726, prot: 0.8, carb: 0, gord: 82.0, fibra: 0,
    portions: [
      { label: 'Colher de chá (5 g)', g: 5 },
      { label: 'Colher de sopa (15 g)', g: 15 },
    ],
  },
  {
    id: 'oleo-soja',
    name: 'Óleo de soja',
    group: 'oleaginosas',
    kcal: 884, prot: 0, carb: 0, gord: 100.0, fibra: 0,
    portions: [
      { label: 'Colher de sopa (15 ml)', g: 15 },
    ],
  },

  // ── BEBIDAS ───────────────────────────────────────────────────────────────
  {
    id: 'suco-laranja',
    name: 'Suco de laranja natural',
    group: 'bebidas',
    kcal: 45, prot: 0.5, carb: 10.4, gord: 0.2, fibra: 0.2,
    portions: [
      { label: 'Copo (200 ml)', g: 200 },
      { label: 'Copo grande (300 ml)', g: 300 },
    ],
  },
  {
    id: 'cafe-leite',
    name: 'Café com leite (sem açúcar)',
    group: 'bebidas',
    kcal: 15, prot: 0.9, carb: 2.0, gord: 0.4, fibra: 0,
    portions: [
      { label: 'Xícara (200 ml)', g: 200 },
    ],
  },
  {
    id: 'achocolatado',
    name: 'Achocolatado líquido',
    group: 'bebidas',
    kcal: 72, prot: 2.4, carb: 12.3, gord: 1.3, fibra: 0.5,
    portions: [
      { label: 'Copo (200 ml)', g: 200 },
    ],
  },

  // ── PREPARAÇÕES ────────────────────────────────────────────────────────────
  {
    id: 'arroz-feijao',
    name: 'Arroz com feijão',
    group: 'preparacoes',
    kcal: 85, prot: 3.1, carb: 17.2, gord: 0.7, fibra: 4.3,
    portions: [
      { label: 'Porção (200 g)', g: 200 },
      { label: 'Prato (300 g)', g: 300 },
    ],
  },
  {
    id: 'macarrao-molho',
    name: 'Macarrão ao molho de tomate',
    group: 'preparacoes',
    kcal: 113, prot: 3.6, carb: 22.3, gord: 1.1, fibra: 1.8,
    portions: [
      { label: 'Porção (200 g)', g: 200 },
      { label: 'Prato (300 g)', g: 300 },
    ],
  },
  {
    id: 'omelete',
    name: 'Omelete simples',
    group: 'preparacoes',
    kcal: 154, prot: 12.0, carb: 0.5, gord: 11.1, fibra: 0,
    portions: [
      { label: 'Omelete de 2 ovos (120 g)', g: 120 },
    ],
  },
  {
    id: 'frango-legumes',
    name: 'Frango refogado com legumes',
    group: 'preparacoes',
    kcal: 120, prot: 18.0, carb: 5.0, gord: 3.5, fibra: 1.5,
    portions: [
      { label: 'Porção (200 g)', g: 200 },
    ],
  },
];

/** Mapa id → alimento para busca rápida (O(1)). */
export const FOODS_BY_ID = {};
for (const f of FOODS) {
  FOODS_BY_ID[f.id] = f;
}
Object.freeze(FOODS_BY_ID);
