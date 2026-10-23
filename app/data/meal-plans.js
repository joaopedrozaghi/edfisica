// meal-plans.js: planos alimentares de exemplo (2 planos)
// Cada plano pode ser aplicado ao diário via repo.diet.applyPlan()

export const MEAL_PLANS = [
  {
    id: 'balanceado',
    name: 'Balanceado',
    emoji: '⚖️',
    description: 'Distribuição equilibrada de macros para manutenção do peso com alimentação variada e nutritiva.',
    kcalApprox: 2100,
    meals: {
      cafe: [
        { foodId: 'pao-frances', grams: 80 },
        { foodId: 'ovo-cozido', grams: 55 },
        { foodId: 'cafe-leite', grams: 200 },
        { foodId: 'mamao', grams: 200 },
      ],
      lanche1: [
        { foodId: 'banana-prata', grams: 100 },
        { foodId: 'aveia', grams: 40 },
      ],
      almoco: [
        { foodId: 'arroz-branco', grams: 150 },
        { foodId: 'feijao-carioca', grams: 120 },
        { foodId: 'frango-peito', grams: 150 },
        { foodId: 'brocolis', grams: 100 },
        { foodId: 'tomate', grams: 100 },
        { foodId: 'azeite', grams: 10 },
      ],
      lanche2: [
        { foodId: 'iogurte-natural', grams: 170 },
        { foodId: 'morango', grams: 80 },
      ],
      jantar: [
        { foodId: 'arroz-integral', grams: 100 },
        { foodId: 'tilapia', grams: 150 },
        { foodId: 'abobrinha', grams: 100 },
        { foodId: 'alface', grams: 50 },
      ],
      ceia: [
        { foodId: 'leite-integral', grams: 200 },
      ],
    },
  },
  {
    id: 'emagrecimento',
    name: 'Emagrecimento',
    emoji: '🔥',
    description: 'Déficit calórico moderado com alto teor de proteína para preservar massa muscular enquanto reduz gordura.',
    kcalApprox: 1600,
    meals: {
      cafe: [
        { foodId: 'pao-integral', grams: 50 },
        { foodId: 'ovo-cozido', grams: 55 },
        { foodId: 'cafe-leite', grams: 200 },
        { foodId: 'laranja', grams: 180 },
      ],
      lanche1: [
        { foodId: 'maca', grams: 130 },
      ],
      almoco: [
        { foodId: 'arroz-integral', grams: 100 },
        { foodId: 'feijao-carioca', grams: 80 },
        { foodId: 'frango-peito', grams: 150 },
        { foodId: 'brocolis', grams: 100 },
        { foodId: 'cenoura', grams: 80 },
        { foodId: 'alface', grams: 50 },
      ],
      lanche2: [
        { foodId: 'cottage', grams: 100 },
      ],
      jantar: [
        { foodId: 'atum-lata', grams: 100 },
        { foodId: 'batata-doce', grams: 100 },
        { foodId: 'espinafre', grams: 100 },
        { foodId: 'tomate', grams: 100 },
      ],
      ceia: [],
    },
  },
];

export const MEAL_PLANS_BY_ID = {};
for (const p of MEAL_PLANS) {
  MEAL_PLANS_BY_ID[p.id] = p;
}
Object.freeze(MEAL_PLANS_BY_ID);
