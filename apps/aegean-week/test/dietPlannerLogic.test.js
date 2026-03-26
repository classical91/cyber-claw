import test from "node:test";
import assert from "node:assert/strict";

import { boosterFoods, goalPresets, mealLibrary, weeklyPlan } from "../src/dietPlannerData.js";
import {
  buildStaples,
  countProteins,
  createMealLookup,
  suggestBoosters,
  summarizeDay,
  summarizeWeek
} from "../src/dietPlannerLogic.js";

const mealLookup = createMealLookup(mealLibrary);

test("summarizeDay totals Monday correctly", () => {
  const monday = weeklyPlan[0];
  const summary = summarizeDay(monday, mealLookup, goalPresets[0]);

  assert.equal(summary.totals.potassium, 5100);
  assert.equal(summary.totals.magnesium, 697);
  assert.equal(summary.totals.protein, 141);
  assert.equal(summary.totals.fiber, 52);
  assert.equal(summary.meetsBoth, true);
});

test("summarizeWeek counts FDA potassium hits across the week", () => {
  const summary = summarizeWeek(weeklyPlan, mealLookup, goalPresets[0]);

  assert.equal(summary.days.length, 7);
  assert.equal(summary.hits.potassium, 6);
  assert.equal(summary.hits.magnesium, 7);
  assert.equal(summary.hits.both, 6);
  assert.equal(summary.averages.potassium, 4719);
});

test("suggestBoosters ranks a potassium booster for Friday", () => {
  const friday = summarizeDay(weeklyPlan[4], mealLookup, goalPresets[0]);
  const suggestions = suggestBoosters(friday, boosterFoods, 3);

  assert.equal(friday.shortfall.potassium, 450);
  assert.equal(friday.shortfall.magnesium, 0);
  assert.equal(suggestions[0].id, "bean-spinach-cup");
  assert.match(suggestions[0].reason, /potassium gap/i);
});

test("buildStaples finds the most repeated ingredients in the week", () => {
  const staples = buildStaples(weeklyPlan, mealLookup, 5);

  assert.deepEqual(
    staples.map((item) => item.name),
    ["Tomatoes", "Greek yogurt", "Cucumber", "Rolled oats", "Banana"]
  );
});

test("countProteins tallies main animal proteins used in meals", () => {
  const counts = countProteins(weeklyPlan, mealLookup);

  assert.deepEqual(counts, { Fish: 6, Chicken: 5, Beef: 3 });
});
