// exercises.js: banco de 24 exercícios sem equipamento (B6.2.1)
// Cada exercício: id, nome, músculos, dificuldade, passos, erros comuns, variações, pose (SVG).

/** Figura SVG simples de cada pose (viewBox 0 0 80 100, stroke=currentColor). */
export const POSES = {
  squat:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="40" cy="12" r="9"/>
      <line x1="40" y1="21" x2="40" y2="52"/>
      <line x1="40" y1="32" x2="22" y2="46"/>
      <line x1="40" y1="32" x2="58" y2="46"/>
      <line x1="40" y1="52" x2="24" y2="72"/>
      <line x1="24" y1="72" x2="18" y2="90"/>
      <line x1="40" y1="52" x2="56" y2="72"/>
      <line x1="56" y1="72" x2="62" y2="90"/>
    </svg>`,
  lunge:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="40" cy="11" r="9"/>
      <line x1="40" y1="20" x2="40" y2="54"/>
      <line x1="40" y1="31" x2="22" y2="44"/>
      <line x1="40" y1="31" x2="58" y2="44"/>
      <line x1="40" y1="54" x2="26" y2="76"/>
      <line x1="26" y1="76" x2="30" y2="94"/>
      <line x1="40" y1="54" x2="60" y2="68"/>
      <line x1="60" y1="68" x2="60" y2="94"/>
    </svg>`,
  plank:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="14" cy="44" r="9"/>
      <line x1="23" y1="44" x2="66" y2="44"/>
      <line x1="14" y1="53" x2="14" y2="70"/>
      <line x1="35" y1="44" x2="40" y2="60"/>
      <line x1="40" y1="60" x2="50" y2="70"/>
      <line x1="55" y1="44" x2="60" y2="60"/>
      <line x1="60" y1="60" x2="70" y2="70"/>
    </svg>`,
  'plank-side':
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="14" cy="32" r="9"/>
      <line x1="14" y1="41" x2="66" y2="68"/>
      <line x1="14" y1="41" x2="20" y2="60"/>
      <line x1="40" y1="52" x2="34" y2="40"/>
      <line x1="34" y1="40" x2="30" y2="28"/>
      <line x1="50" y1="58" x2="56" y2="76"/>
      <line x1="65" y1="66" x2="66" y2="84"/>
    </svg>`,
  pushup:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="40" r="9"/>
      <line x1="21" y1="40" x2="65" y2="55"/>
      <line x1="22" y1="44" x2="16" y2="62"/>
      <line x1="42" y1="47" x2="40" y2="66"/>
      <line x1="50" y1="50" x2="50" y2="70"/>
      <line x1="60" y1="53" x2="60" y2="70"/>
    </svg>`,
  'lying-back':
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="14" cy="50" r="9"/>
      <line x1="23" y1="50" x2="66" y2="50"/>
      <line x1="20" y1="59" x2="14" y2="74"/>
      <line x1="40" y1="50" x2="34" y2="38"/>
      <line x1="34" y1="38" x2="26" y2="30"/>
      <line x1="44" y1="50" x2="50" y2="36"/>
      <line x1="50" y1="50" x2="42" y2="66"/>
      <line x1="62" y1="50" x2="58" y2="68"/>
    </svg>`,
  bridge:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="14" cy="58" r="9"/>
      <line x1="14" y1="67" x2="20" y2="80"/>
      <line x1="20" y1="80" x2="28" y2="94"/>
      <line x1="23" y1="58" x2="66" y2="38"/>
      <line x1="35" y1="52" x2="30" y2="68"/>
      <line x1="30" y1="68" x2="28" y2="82"/>
      <line x1="50" y1="46" x2="46" y2="62"/>
      <line x1="46" y1="62" x2="44" y2="78"/>
      <line x1="66" y1="38" x2="68" y2="56"/>
    </svg>`,
  prone:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="14" cy="52" r="9"/>
      <line x1="23" y1="52" x2="66" y2="52"/>
      <line x1="14" y1="61" x2="14" y2="76"/>
      <line x1="30" y1="52" x2="26" y2="38"/>
      <line x1="26" y1="38" x2="18" y2="28"/>
      <line x1="44" y1="52" x2="48" y2="40"/>
      <line x1="48" y1="40" x2="56" y2="30"/>
      <line x1="55" y1="52" x2="52" y2="68"/>
      <line x1="65" y1="52" x2="68" y2="68"/>
    </svg>`,
  standing:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="40" cy="11" r="9"/>
      <line x1="40" y1="20" x2="40" y2="60"/>
      <line x1="40" y1="32" x2="22" y2="50"/>
      <line x1="40" y1="32" x2="58" y2="50"/>
      <line x1="40" y1="60" x2="30" y2="82"/>
      <line x1="30" y1="82" x2="28" y2="96"/>
      <line x1="40" y1="60" x2="50" y2="82"/>
      <line x1="50" y1="82" x2="52" y2="96"/>
    </svg>`,
  jump:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="40" cy="8" r="9"/>
      <line x1="40" y1="17" x2="40" y2="55"/>
      <line x1="40" y1="28" x2="18" y2="18"/>
      <line x1="40" y1="28" x2="62" y2="18"/>
      <line x1="40" y1="55" x2="28" y2="72"/>
      <line x1="28" y1="72" x2="20" y2="88"/>
      <line x1="40" y1="55" x2="52" y2="72"/>
      <line x1="52" y1="72" x2="60" y2="88"/>
    </svg>`,
  burpee:
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="40" cy="8" r="9"/>
      <line x1="40" y1="17" x2="40" y2="46"/>
      <line x1="40" y1="26" x2="22" y2="16"/>
      <line x1="40" y1="26" x2="58" y2="16"/>
      <line x1="40" y1="46" x2="24" y2="60"/>
      <line x1="24" y1="60" x2="16" y2="80"/>
      <line x1="40" y1="46" x2="56" y2="60"/>
      <line x1="56" y1="60" x2="64" y2="80"/>
    </svg>`,
  'cat-camel':
    `<svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="14" cy="44" r="9"/>
      <path d="M23,44 Q40,28 65,44" fill="none"/>
      <line x1="14" y1="53" x2="12" y2="72"/>
      <line x1="12" y1="72" x2="14" y2="88"/>
      <line x1="30" y1="38" x2="28" y2="58"/>
      <line x1="28" y1="58" x2="26" y2="72"/>
      <line x1="52" y1="38" x2="54" y2="58"/>
      <line x1="54" y1="58" x2="56" y2="72"/>
      <line x1="65" y1="44" x2="68" y2="60"/>
      <line x1="68" y1="60" x2="70" y2="76"/>
    </svg>`,
};

/** 24 exercícios sem equipamento. */
export const EXERCISES = [
  {
    id: 'agachamento-livre',
    name: 'Agachamento Livre',
    muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais', 'Core'],
    difficulty: 'iniciante',
    steps: [
      'Fique em pé com os pés na largura dos ombros e pontas ligeiramente para fora.',
      'Mantenha o peito erguido e o abdômen contraído.',
      'Dobre os joelhos e empurre os quadris para trás até as coxas ficarem paralelas ao chão.',
      'Mantenha os calcanhares apoiados no chão durante todo o movimento.',
      'Empurre o chão com os pés e suba, voltando à posição inicial.',
    ],
    errors: [
      'Joelhos caindo para dentro (valgo de joelho).',
      'Calcanhares levantando do chão.',
      'Costas muito arredondadas ou lordose excessiva.',
      'Joelhos ultrapassando demais a ponta dos pés.',
    ],
    variations: {
      easier: 'Agachamento assistido: segure uma cadeira pela encosto enquanto desce.',
      harder: 'Agachamento com salto: suba com impulso, saindo do chão.',
    },
    pose: 'squat',
  },
  {
    id: 'agachamento-sumo',
    name: 'Agachamento Sumô',
    muscles: ['Adutores', 'Glúteos', 'Quadríceps', 'Isquiotibiais'],
    difficulty: 'iniciante',
    steps: [
      'Afaste os pés um pouco mais que a largura dos ombros, com pés apontando para fora (≈45°).',
      'Mantenha o tronco ereto e o core ativo.',
      'Dobre os joelhos empurrando-os para fora, alinhados com os pés, e desça o quadril.',
      'Suba empurrando o chão com os pés.',
    ],
    errors: [
      'Joelhos caindo para dentro ao subir.',
      'Inclinar o tronco à frente excessivamente.',
      'Calcanhares se levantando.',
    ],
    variations: {
      easier: 'Agachamento sumô parcial: descer apenas até 90°.',
      harder: 'Agachamento sumô com pulso: desça e realize pequenas pulsações antes de subir.',
    },
    pose: 'squat',
  },
  {
    id: 'afundo',
    name: 'Afundo',
    muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais', 'Panturrilha'],
    difficulty: 'iniciante',
    steps: [
      'Fique em pé com os pés juntos.',
      'Dê um passo à frente com uma perna.',
      'Dobre os dois joelhos até o joelho traseiro quase tocar o chão (ângulo de 90°).',
      'Empurre o calcanhar da frente e volte à posição inicial.',
      'Alterne as pernas a cada repetição.',
    ],
    errors: [
      'Joelho da frente ultrapassando muito a ponta do pé.',
      'Tronco inclinado à frente.',
      'Pés alinhados lateralmente (passe de trens); manter largura dos ombros.',
    ],
    variations: {
      easier: 'Afundo estático: mantenha a posição sem sair do lugar.',
      harder: 'Afundo com salto: troque as pernas no ar entre repetições.',
    },
    pose: 'lunge',
  },
  {
    id: 'avanco',
    name: 'Avanço',
    muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais'],
    difficulty: 'iniciante',
    steps: [
      'Fique em pé, core ativo.',
      'Dê um grande passo à frente com o pé direito.',
      'Abaixe o corpo até ambos os joelhos formarem 90°.',
      'Empurre o pé de trás e volte à posição inicial.',
      'Repita do outro lado.',
    ],
    errors: [
      'Passo muito curto deixando o joelho da frente passar do pé.',
      'Tronco inclinado para o lado.',
      'Movimento brusco na voltinha.',
    ],
    variations: {
      easier: 'Avanço encurtado: passo menor para reduzir o ângulo.',
      harder: 'Avanço alternado em caminhada: avance continuamente sem voltar ao centro.',
    },
    pose: 'lunge',
  },
  {
    id: 'ponte-gluteo',
    name: 'Ponte de Glúteo',
    muscles: ['Glúteos', 'Isquiotibiais', 'Core'],
    difficulty: 'iniciante',
    steps: [
      'Deite de costas com joelhos dobrados e pés apoiados no chão (largura dos quadris).',
      'Braços ao lado do corpo, palmas para baixo.',
      'Contraia os glúteos e eleve o quadril até formar uma linha reta do joelho aos ombros.',
      'Segure 1–2 s no topo.',
      'Desça controladamente sem tocar o chão e repita.',
    ],
    errors: [
      'Hiperextensão lombar no topo.',
      'Pés muito longe ou muito perto dos glúteos.',
      'Não contrair os glúteos no topo.',
    ],
    variations: {
      easier: 'Ponte com apoio na parede (pés na parede para controle).',
      harder: 'Ponte unilateral: eleve uma perna e faça o movimento com uma só perna.',
    },
    pose: 'bridge',
  },
  {
    id: 'elevacao-pelvica',
    name: 'Elevação Pélvica',
    muscles: ['Glúteos', 'Isquiotibiais', 'Lombar'],
    difficulty: 'iniciante',
    steps: [
      'Deite de costas com joelhos dobrados e pés apoiados no chão.',
      'Posicione os pés um pouco mais afastados que na ponte.',
      'Eleve o quadril até o máximo de alcance, espremendo os glúteos.',
      'Desça lentamente e repita com amplitude total.',
    ],
    errors: [
      'Não estender totalmente o quadril no topo.',
      'Apoiar no pescoço em vez dos ombros.',
      'Pés deslizando durante o movimento.',
    ],
    variations: {
      easier: 'Elevação pélvica parcial: menor amplitude de movimento.',
      harder: 'Elevação pélvica com uma perna estendida.',
    },
    pose: 'bridge',
  },
  {
    id: 'flexao-braco',
    name: 'Flexão de Braço',
    muscles: ['Peitoral', 'Tríceps', 'Deltóide anterior', 'Core'],
    difficulty: 'intermediario',
    steps: [
      'Posição de prancha: mãos na largura dos ombros, corpo em linha reta da cabeça ao calcanhar.',
      'Dobre os cotovelos (apontados ligeiramente para trás) e desça o peito em direção ao chão.',
      'Desça até o peito quase tocar o chão.',
      'Empurre as mãos no chão e volte à posição inicial.',
    ],
    errors: [
      'Quadril alto demais (posição de "V invertido").',
      'Quadril caindo (lombar sobrecarregada).',
      'Cotovelos abrindo demais para os lados.',
      'Cabeça projetada para frente.',
    ],
    variations: {
      easier: 'Flexão inclinada: mãos elevadas numa cadeira ou parede.',
      harder: 'Flexão com palmas elevadas: apoie os pés numa cadeira.',
    },
    pose: 'pushup',
  },
  {
    id: 'flexao-inclinada',
    name: 'Flexão Inclinada',
    muscles: ['Peitoral', 'Tríceps', 'Deltóide anterior'],
    difficulty: 'iniciante',
    steps: [
      'Apoie as mãos na borda de uma cadeira ou banco (largura dos ombros).',
      'Posicione o corpo em diagonal com o chão, core ativo.',
      'Dobre os cotovelos e desça o peito em direção ao apoio.',
      'Empurre e volte à posição inicial.',
    ],
    errors: [
      'Apoio instável (checar a firmeza do suporte antes).',
      'Quadril se inclinando para cima ou para baixo.',
      'Cotovelos em ângulo muito aberto.',
    ],
    variations: {
      easier: 'Flexão na parede: apoio vertical na parede.',
      harder: 'Flexão de braço padrão no chão.',
    },
    pose: 'pushup',
  },
  {
    id: 'prancha',
    name: 'Prancha',
    muscles: ['Core', 'Transverso abdominal', 'Estabilizadores da coluna', 'Ombros'],
    difficulty: 'iniciante',
    steps: [
      'Apoie os antebraços no chão (cotovelos sob os ombros) e as pontas dos pés.',
      'Eleve o corpo formando uma linha reta da cabeça ao calcanhar.',
      'Contraia o abdômen e os glúteos.',
      'Mantenha a posição respirando de forma controlada.',
    ],
    errors: [
      'Quadril elevado ou caído.',
      'Pescoço tenso (olhe para o chão levemente à frente).',
      'Prender a respiração.',
      'Apoio nos joelhos quando não deveria.',
    ],
    variations: {
      easier: 'Prancha nos joelhos.',
      harder: 'Prancha com toque de ombro: alternadamente toque o ombro oposto.',
    },
    pose: 'plank',
  },
  {
    id: 'prancha-lateral',
    name: 'Prancha Lateral',
    muscles: ['Oblíquos', 'Core lateral', 'Glúteo médio', 'Estabilizadores do ombro'],
    difficulty: 'intermediario',
    steps: [
      'Deite de lado e apoie no antebraço (cotovelo sob o ombro).',
      'Empilhe os pés um sobre o outro.',
      'Eleve o quadril formando uma linha reta da cabeça ao calcanhar.',
      'Mantenha o quadril elevado sem deixar cair.',
      'Repita no outro lado.',
    ],
    errors: [
      'Quadril caindo em direção ao chão.',
      'Ombro de apoio retraindo (empurre o ombro para baixo e para fora).',
      'Rotação do tronco.',
    ],
    variations: {
      easier: 'Prancha lateral com joelho de baixo apoiado.',
      harder: 'Prancha lateral com elevação de perna: levante a perna de cima.',
    },
    pose: 'plank-side',
  },
  {
    id: 'abdominal',
    name: 'Abdominal (Crunch)',
    muscles: ['Reto abdominal', 'Oblíquos'],
    difficulty: 'iniciante',
    steps: [
      'Deite de costas, joelhos dobrados, pés apoiados no chão.',
      'Coloque as mãos atrás da cabeça sem puxar o pescoço, ou cruzadas no peito.',
      'Contraia o abdômen e eleve os ombros do chão em direção aos joelhos.',
      'Desça lentamente sem encostar completamente a cabeça.',
    ],
    errors: [
      'Puxar a cabeça com as mãos tensionando o pescoço.',
      'Movimento muito amplo (não é uma "sentada" completa).',
      'Prender a respiração; expire ao subir.',
    ],
    variations: {
      easier: 'Crunch com pernas no chão e menor amplitude.',
      harder: 'Crunch com pernas elevadas a 90°.',
    },
    pose: 'lying-back',
  },
  {
    id: 'abdominal-infra',
    name: 'Abdominal Infra',
    muscles: ['Reto abdominal inferior', 'Flexores do quadril', 'Core'],
    difficulty: 'intermediario',
    steps: [
      'Deite de costas, mãos ao lado do corpo ou sob o sacro.',
      'Levante as pernas até 90° do chão.',
      'Contraia o abdômen e eleve ligeiramente o quadril do chão.',
      'Desça as pernas em direção ao chão sem tocá-lo e repita.',
    ],
    errors: [
      'Descer as pernas mais do que o core consegue controlar (lombar se arqueia).',
      'Usar impulso em vez de contração abdominal.',
      'Pescoço tensionado.',
    ],
    variations: {
      easier: 'Deslizamento de calcanhar: deslize um calcanhar de cada vez afastando do corpo.',
      harder: 'Canivete: suba tronco e pernas simultaneamente.',
    },
    pose: 'lying-back',
  },
  {
    id: 'mountain-climber',
    name: 'Mountain Climber',
    muscles: ['Core', 'Flexores do quadril', 'Ombros', 'Peitoral'],
    difficulty: 'intermediario',
    steps: [
      'Posição de flexão (prancha alta): mãos sob os ombros, corpo em linha reta.',
      'Traga o joelho direito em direção ao peito de forma controlada.',
      'Volte e repita com o joelho esquerdo.',
      'Alterne rapidamente mantendo o quadril nivelado.',
    ],
    errors: [
      'Quadril subindo ao trazer o joelho.',
      'Saltitar os braços a cada repetição.',
      'Perder o alinhamento da coluna.',
    ],
    variations: {
      easier: 'Mountain climber lento: alternar os joelhos em passo de caminhada.',
      harder: 'Mountain climber cruzado: trazer o joelho para o cotovelo oposto.',
    },
    pose: 'plank',
  },
  {
    id: 'burpee',
    name: 'Burpee',
    muscles: ['Corpo inteiro', 'Peitoral', 'Core', 'Quadríceps', 'Glúteos'],
    difficulty: 'avancado',
    steps: [
      'Em pé, core ativo.',
      'Dobre os joelhos, apoie as mãos no chão na largura dos ombros.',
      'Salte os pés para trás até a posição de prancha e faça uma flexão.',
      'Salte os pés de volta próximo às mãos.',
      'Salte para cima com os braços acima da cabeça.',
    ],
    errors: [
      'Não realizar a flexão completa na posição de prancha.',
      'Joelhos caindo durante o agachamento.',
      'Realizar em velocidade sem controlar a forma.',
    ],
    variations: {
      easier: 'Burpee sem salto: suba sem pulsar no final.',
      harder: 'Burpee com pull-up: adicionar uma barra acima para subir.',
    },
    pose: 'burpee',
  },
  {
    id: 'polichinelo',
    name: 'Polichinelo (Jumping Jacks)',
    muscles: ['Deltóide', 'Abdutores do quadril', 'Panturrilha', 'Cardio'],
    difficulty: 'iniciante',
    steps: [
      'Fique em pé com pés juntos e braços ao lado do corpo.',
      'Salte abrindo os pés para os lados (além da largura dos ombros) enquanto levanta os braços acima da cabeça.',
      'Salte de volta à posição inicial.',
      'Repita em ritmo constante.',
    ],
    errors: [
      'Aterrissar com os joelhos completamente estendidos (amortece sempre).',
      'Braços incompletos (erga até cima do plano dos ombros).',
      'Ritmo muito rápido sacrificando amplitude.',
    ],
    variations: {
      easier: 'Polichinelo sem salto: passo lateral alternado.',
      harder: 'Polichinelo cruzado: cruzar os pés e palmas ao fechar.',
    },
    pose: 'jump',
  },
  {
    id: 'corrida-parada',
    name: 'Corrida Parada',
    muscles: ['Flexores do quadril', 'Quadríceps', 'Panturrilha', 'Cardio'],
    difficulty: 'iniciante',
    steps: [
      'Fique em pé com postura ereta, core ativo.',
      'Comece a correr no lugar elevando os joelhos alternadamente até a altura do quadril.',
      'Balance os braços como numa corrida real.',
      'Mantenha o ritmo de forma constante.',
    ],
    errors: [
      'Não elevar suficientemente os joelhos.',
      'Inclinar muito o tronco para frente.',
      'Aterrissar com todo o peso no calcanhar.',
    ],
    variations: {
      easier: 'Caminhada no lugar com joelhos elevados.',
      harder: 'Sprint no lugar: velocidade máxima por 20 s seguidos.',
    },
    pose: 'standing',
  },
  {
    id: 'agachamento-salto',
    name: 'Agachamento com Salto',
    muscles: ['Quadríceps', 'Glúteos', 'Panturrilha', 'Core'],
    difficulty: 'avancado',
    steps: [
      'Pés na largura dos ombros, posição de agachamento.',
      'Desça até as coxas ficarem paralelas ao chão.',
      'Salte explosivamente para cima, estendendo completamente o corpo.',
      'Aterrisse com os joelhos ligeiramente dobrados e desça direto para o próximo agachamento.',
    ],
    errors: [
      'Aterrissar com os joelhos completamente retos (impacto elevado).',
      'Valgo de joelho na aterrissagem.',
      'Não descer completamente antes de saltar.',
    ],
    variations: {
      easier: 'Agachamento livre sem salto.',
      harder: 'Agachamento com salto segurado: descer devagar (3 s) e saltar explosivo.',
    },
    pose: 'jump',
  },
  {
    id: 'triceps-banco',
    name: 'Tríceps no Banco',
    muscles: ['Tríceps', 'Deltóide posterior', 'Peitoral inferior'],
    difficulty: 'iniciante',
    steps: [
      'Sente na borda de uma cadeira resistente ou banco, mãos ao lado dos quadris.',
      'Deslize o quadril para fora do apoio, pernas estendidas à frente.',
      'Dobre os cotovelos (para trás, não para os lados) e desça o quadril em direção ao chão.',
      'Empurre as mãos no apoio e suba estendendo os cotovelos.',
    ],
    errors: [
      'Cotovelos se abrindo para os lados.',
      'Usar cadeira sem apoio de braço firme (verifique estabilidade).',
      'Não descer suficientemente para trabalhar o tríceps.',
    ],
    variations: {
      easier: 'Tríceps com joelhos dobrados (pés próximos).',
      harder: 'Tríceps com pernas elevadas sobre outra cadeira.',
    },
    pose: 'pushup',
  },
  {
    id: 'superman',
    name: 'Superman',
    muscles: ['Lombar', 'Glúteos', 'Isquiotibiais', 'Deltóide posterior'],
    difficulty: 'iniciante',
    steps: [
      'Deite de bruços com braços estendidos à frente e pernas estendidas.',
      'Contraia os glúteos e a região lombar.',
      'Eleve simultaneamente braços, peito, coxas e pés do chão.',
      'Segure 2–3 s no topo e desça controladamente.',
    ],
    errors: [
      'Elevar apenas os braços ou apenas as pernas.',
      'Tensão excessiva no pescoço (olhe levemente para o chão).',
      'Segurar a respiração.',
    ],
    variations: {
      easier: 'Superman alternado: elevar braço direito + perna esquerda ao mesmo tempo.',
      harder: 'Superman com pausa: segurar 5 s no topo.',
    },
    pose: 'prone',
  },
  {
    id: 'bird-dog',
    name: 'Bird-Dog',
    muscles: ['Core', 'Lombar', 'Glúteos', 'Estabilizadores do ombro'],
    difficulty: 'iniciante',
    steps: [
      'Posição de quatro apoios: mãos sob os ombros e joelhos sob os quadris.',
      'Contraia o core para estabilizar a coluna em posição neutra.',
      'Estenda o braço direito à frente e a perna esquerda para trás simultaneamente.',
      'Segure 2 s, volte ao centro sem tocar o chão e repita do outro lado.',
    ],
    errors: [
      'Rotar o quadril ao elevar a perna.',
      'Arquear a lombar ao estender.',
      'Elevação rápida sem estabilização prévia.',
    ],
    variations: {
      easier: 'Bird-dog somente de pernas: elevar uma perna por vez sem mover os braços.',
      harder: 'Bird-dog com cotovelo e joelho: tocar cotovelo e joelho opostos sob o corpo a cada rep.',
    },
    pose: 'prone',
  },
  {
    id: 'escalador',
    name: 'Escalador (Climber)',
    muscles: ['Core', 'Flexores do quadril', 'Ombros', 'Isquiotibiais'],
    difficulty: 'intermediario',
    steps: [
      'Posição de prancha alta (mãos no chão, braços estendidos).',
      'Traga o joelho direito em direção ao peito sem deixar o quadril subir.',
      'Volte o pé ao lugar inicial e repita com o esquerdo.',
      'Execute de forma controlada, mantendo a coluna neutra.',
    ],
    errors: [
      'Joelhos tocando o chão entre as repetições.',
      'Quadril oscilando para cima e para baixo.',
      'Cotovelos dobrados (mantenha os braços estendidos).',
    ],
    variations: {
      easier: 'Escalador lento: 3 s por troca de perna.',
      harder: 'Escalador cruzado: joelho vai ao cotovelo oposto.',
    },
    pose: 'plank',
  },
  {
    id: 'afundo-bulgaro',
    name: 'Afundo Búlgaro',
    muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais', 'Core'],
    difficulty: 'avancado',
    steps: [
      'Fique de costas para uma cadeira, a cerca de 60 cm de distância.',
      'Apoie o peito do pé traseiro na cadeira.',
      'Dobre o joelho da frente e desça o quadril até o joelho traseiro quase tocar o chão.',
      'Empurre o calcanhar da frente e suba.',
      'Complete todas as repetições de um lado antes de trocar.',
    ],
    errors: [
      'Joelho da frente colapsando para dentro.',
      'Cadeira muito alta causando pressão excessiva na perna de trás.',
      'Tronco muito inclinado à frente.',
    ],
    variations: {
      easier: 'Afundo estático tradicional no chão.',
      harder: 'Afundo búlgaro com salto: impulso entre as repetições.',
    },
    pose: 'lunge',
  },
  {
    id: 'panturrilha-pe',
    name: 'Panturrilha em Pé',
    muscles: ['Gastrocnêmio', 'Sóleo'],
    difficulty: 'iniciante',
    steps: [
      'Fique em pé com os pés paralelos na largura dos quadris. Apoie-se levemente numa parede para equilíbrio se necessário.',
      'Eleve os calcanhares o máximo possível, ficando na ponta dos pés.',
      'Segure 1 s no topo.',
      'Desça os calcanhares lentamente até quase tocar o chão.',
    ],
    errors: [
      'Movimento muito rápido sem controle na descida.',
      'Pés virados para fora ou para dentro excessivamente.',
      'Não elevar completamente os calcanhares.',
    ],
    variations: {
      easier: 'Panturrilha sentado: realize o movimento sentado em uma cadeira.',
      harder: 'Panturrilha unilateral: apoie apenas um pé por vez.',
    },
    pose: 'standing',
  },
  {
    id: 'alongamento-gato-camelo',
    name: 'Alongamento Gato-Camelo',
    muscles: ['Coluna vertebral', 'Lombar', 'Abdômen', 'Glúteos'],
    difficulty: 'iniciante',
    steps: [
      'Posição de quatro apoios: mãos sob os ombros, joelhos sob os quadris.',
      'Gato: expire e arredonde a coluna para cima como um gato assustado, recolhendo o abdômen.',
      'Segure 2 s, depois inspire.',
      'Camelo: inspire e deixe a coluna afundar levemente, erguendo a cabeça e o cóccix.',
      'Segure 2 s e repita a sequência de forma fluida.',
    ],
    errors: [
      'Movimento brusco; este é um exercício de mobilidade — mantenha a fluidez.',
      'Apoiar o peso nos pulsos com excesso de tensão.',
      'Não utilizar a respiração para guiar o movimento.',
    ],
    variations: {
      easier: 'Amplitude reduzida para quem tem dor lombar aguda.',
      harder: 'Adicionar rotação lateral do tronco no ponto neutro entre as posições.',
    },
    pose: 'cat-camel',
  },
];

/** Mapa id → exercício para lookup rápido. */
export const EXERCISES_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
