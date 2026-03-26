export function createMealLookup(mealLibrary) {
  return new Map(mealLibrary.map((meal) => [meal.id, meal]));
}

function sumNutrients(current, addition) {
  return {
    potassium: current.potassium + addition.potassium,
    magnesium: current.magnesium + addition.magnesium,
    protein: current.protein + addition.protein,
    fiber: current.fiber + addition.fiber,
    calories: current.calories + addition.calories
  };
}

export function summarizeDay(day, mealLookup, goals) {
  const slots = Object.entries(day.meals).map(([slotKey, mealId]) => {
    const meal = mealLookup.get(mealId);

    if (!meal) {
      throw new Error(`Unknown meal id "${mealId}" in ${day.id}`);
    }

    return { slotKey, meal };
  });

  const totals = slots.reduce(
    (current, entry) => sumNutrients(current, entry.meal.nutrients),
    { potassium: 0, magnesium: 0, protein: 0, fiber: 0, calories: 0 }
  );

  const shortfall = {
    potassium: Math.max(goals.potassium - totals.potassium, 0),
    magnesium: Math.max(goals.magnesium - totals.magnesium, 0)
  };

  const coverage = {
    potassium: totals.potassium / goals.potassium,
    magnesium: totals.magnesium / goals.magnesium
  };

  return {
    ...day,
    slots,
    totals,
    shortfall,
    coverage,
    meetsPotassium: shortfall.potassium === 0,
    meetsMagnesium: shortfall.magnesium === 0,
    meetsBoth: shortfall.potassium === 0 && shortfall.magnesium === 0
  };
}

export function summarizeWeek(weekPlan, mealLookup, goals) {
  const days = weekPlan.map((day) => summarizeDay(day, mealLookup, goals));
  const totalDays = Math.max(days.length, 1);
  const totals = days.reduce(
    (current, day) => sumNutrients(current, day.totals),
    { potassium: 0, magnesium: 0, protein: 0, fiber: 0, calories: 0 }
  );

  const averages = {
    potassium: Math.round(totals.potassium / totalDays),
    magnesium: Math.round(totals.magnesium / totalDays),
    protein: Math.round(totals.protein / totalDays),
    fiber: Math.round(totals.fiber / totalDays),
    calories: Math.round(totals.calories / totalDays)
  };

  const hits = {
    both: days.filter((day) => day.meetsBoth).length,
    potassium: days.filter((day) => day.meetsPotassium).length,
    magnesium: days.filter((day) => day.meetsMagnesium).length
  };

  return { days, totals, averages, hits };
}

export function suggestBoosters(daySummary, boosters, limit = 3) {
  const needsPotassium = daySummary.shortfall.potassium;
  const needsMagnesium = daySummary.shortfall.magnesium;
  const hasGap = needsPotassium > 0 || needsMagnesium > 0;

  const ranked = boosters
    .map((booster) => {
      const remainingPotassium = Math.max(needsPotassium - booster.nutrients.potassium, 0);
      const remainingMagnesium = Math.max(needsMagnesium - booster.nutrients.magnesium, 0);
      const potassiumCoverage =
        needsPotassium > 0 ? 1 - remainingPotassium / needsPotassium : 0.35;
      const magnesiumCoverage =
        needsMagnesium > 0 ? 1 - remainingMagnesium / needsMagnesium : 0.35;
      const efficiency =
        (booster.nutrients.potassium + booster.nutrients.magnesium * 4) / booster.nutrients.calories;
      const score = (potassiumCoverage + magnesiumCoverage) * 2 + efficiency;

      return {
        ...booster,
        score,
        potassiumCoverage,
        magnesiumCoverage,
        catchesUp: booster.nutrients.potassium >= needsPotassium && booster.nutrients.magnesium >= needsMagnesium,
        reason: hasGap
          ? buildGapReason(booster, needsPotassium, needsMagnesium)
          : "Optional support if you swap a meal or need extra volume."
      };
    })
    .sort((left, right) => right.score - left.score);

  return ranked.slice(0, limit);
}

function buildGapReason(booster, needsPotassium, needsMagnesium) {
  const potassiumText =
    needsPotassium > 0
      ? `${Math.min(100, Math.round((booster.nutrients.potassium / needsPotassium) * 100))}% of the potassium gap`
      : "extra potassium support";
  const magnesiumText =
    needsMagnesium > 0
      ? `${Math.min(100, Math.round((booster.nutrients.magnesium / needsMagnesium) * 100))}% of the magnesium gap`
      : "extra magnesium support";

  return `${potassiumText}, ${magnesiumText}.`;
}

export function buildStaples(weekPlan, mealLookup, limit = 14) {
  const counts = new Map();

  for (const day of weekPlan) {
    for (const mealId of Object.values(day.meals)) {
      const meal = mealLookup.get(mealId);
      if (!meal) {
        continue;
      }

      for (const ingredient of meal.ingredients) {
        const entry = counts.get(ingredient.name) ?? {
          name: ingredient.name,
          group: ingredient.group,
          count: 0
        };
        entry.count += 1;
        counts.set(ingredient.name, entry);
      }
    }
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, limit);
}

export function countProteins(weekPlan, mealLookup) {
  const counts = { Fish: 0, Chicken: 0, Beef: 0 };

  for (const day of weekPlan) {
    for (const mealId of Object.values(day.meals)) {
      const meal = mealLookup.get(mealId);
      if (!meal || !(meal.protein in counts)) {
        continue;
      }
      counts[meal.protein] += 1;
    }
  }

  return counts;
}

export function formatMetric(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function percentText(value) {
  return `${Math.round(value * 100)}%`;
}
