export const goalPresets = [
  {
    id: "fda",
    label: "FDA Daily Value",
    potassium: 4700,
    magnesium: 420,
    note: "General Daily Values used on U.S. nutrition labels."
  },
  {
    id: "nih-men",
    label: "NIH adult men",
    potassium: 3400,
    magnesium: 420,
    note: "Simplified adult reference based on NIH ODS guidance."
  },
  {
    id: "nih-women",
    label: "NIH adult women (31+)",
    potassium: 2600,
    magnesium: 320,
    note: "Simplified adult reference based on NIH ODS guidance."
  }
];

export const boosterFoods = [
  {
    id: "bean-spinach-cup",
    name: "White beans with sauteed spinach",
    portion: "1 cup bowl",
    nutrients: { potassium: 860, magnesium: 126, calories: 220 },
    note: "Best when potassium is lagging late in the day."
  },
  {
    id: "pumpkin-seed-apricot",
    name: "Pumpkin seeds and dried apricots",
    portion: "1 ounce + 4 halves",
    nutrients: { potassium: 580, magnesium: 168, calories: 240 },
    note: "Fastest magnesium catch-up without adding a full meal."
  },
  {
    id: "baked-potato-yogurt",
    name: "Baked potato with olive oil and yogurt",
    portion: "1 medium potato",
    nutrients: { potassium: 925, magnesium: 52, calories: 250 },
    note: "Strong potassium lift for training or higher-appetite days."
  },
  {
    id: "banana-almond-butter",
    name: "Banana with almond butter",
    portion: "1 banana + 1 tbsp",
    nutrients: { potassium: 510, magnesium: 61, calories: 190 },
    note: "Easy add-on when you want something small."
  },
  {
    id: "avocado-cacao-cup",
    name: "Avocado cacao yogurt cup",
    portion: "half avocado + 3/4 cup yogurt",
    nutrients: { potassium: 735, magnesium: 94, calories: 230 },
    note: "Balanced add-on that nudges both minerals at once."
  }
];

export const mealLibrary = [
  {
    id: "citrus-yogurt-oats",
    slot: "Breakfast",
    title: "Citrus yogurt oats",
    subtitle: "Greek yogurt, oats, banana, chia, and orange segments.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Greek yogurt", group: "Dairy" },
      { name: "Rolled oats", group: "Whole grain" },
      { name: "Banana", group: "Fruit" },
      { name: "Chia seeds", group: "Seed" },
      { name: "Orange", group: "Fruit" }
    ],
    nutrients: { potassium: 1240, magnesium: 205, protein: 35, fiber: 16, calories: 590 }
  },
  {
    id: "spinach-feta-omelet",
    slot: "Breakfast",
    title: "Spinach feta omelet",
    subtitle: "Eggs folded with spinach, tomato, feta, and toasted whole grain bread.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Eggs", group: "Protein" },
      { name: "Spinach", group: "Greens" },
      { name: "Tomatoes", group: "Vegetable" },
      { name: "Feta", group: "Dairy" },
      { name: "Whole grain toast", group: "Whole grain" }
    ],
    nutrients: { potassium: 1080, magnesium: 118, protein: 31, fiber: 8, calories: 460 }
  },
  {
    id: "fig-walnut-oats",
    slot: "Breakfast",
    title: "Fig walnut overnight oats",
    subtitle: "Overnight oats with kefir, figs, walnuts, berries, and flax.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Rolled oats", group: "Whole grain" },
      { name: "Kefir", group: "Dairy" },
      { name: "Figs", group: "Fruit" },
      { name: "Walnuts", group: "Nut" },
      { name: "Berries", group: "Fruit" },
      { name: "Flaxseed", group: "Seed" }
    ],
    nutrients: { potassium: 1280, magnesium: 210, protein: 24, fiber: 15, calories: 560 }
  },
  {
    id: "yogurt-kiwi-bowl",
    slot: "Breakfast",
    title: "Kiwi mineral bowl",
    subtitle: "Yogurt with kiwi, berries, pumpkin seeds, oats, and honey.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Greek yogurt", group: "Dairy" },
      { name: "Kiwi", group: "Fruit" },
      { name: "Berries", group: "Fruit" },
      { name: "Pumpkin seeds", group: "Seed" },
      { name: "Rolled oats", group: "Whole grain" }
    ],
    nutrients: { potassium: 1310, magnesium: 228, protein: 33, fiber: 14, calories: 540 }
  },
  {
    id: "cottage-herb-melon",
    slot: "Breakfast",
    title: "Cottage herb breakfast plate",
    subtitle: "Cottage cheese, melon, cucumber, olives, chia, and seeded toast.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Cottage cheese", group: "Dairy" },
      { name: "Melon", group: "Fruit" },
      { name: "Cucumber", group: "Vegetable" },
      { name: "Olives", group: "Fat" },
      { name: "Chia seeds", group: "Seed" },
      { name: "Whole grain toast", group: "Whole grain" }
    ],
    nutrients: { potassium: 980, magnesium: 172, protein: 29, fiber: 12, calories: 470 }
  },
  {
    id: "tomato-spinach-scramble",
    slot: "Breakfast",
    title: "Tomato spinach scramble",
    subtitle: "Soft scramble with avocado, tomatoes, spinach, and sourdough.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Eggs", group: "Protein" },
      { name: "Avocado", group: "Fat" },
      { name: "Tomatoes", group: "Vegetable" },
      { name: "Spinach", group: "Greens" },
      { name: "Sourdough", group: "Whole grain" }
    ],
    nutrients: { potassium: 1120, magnesium: 126, protein: 29, fiber: 9, calories: 430 }
  },
  {
    id: "kefir-berry-blend",
    slot: "Breakfast",
    title: "Kefir berry oat blend",
    subtitle: "Kefir, berries, banana, oats, pumpkin seeds, and cinnamon.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Kefir", group: "Dairy" },
      { name: "Berries", group: "Fruit" },
      { name: "Banana", group: "Fruit" },
      { name: "Rolled oats", group: "Whole grain" },
      { name: "Pumpkin seeds", group: "Seed" }
    ],
    nutrients: { potassium: 1280, magnesium: 218, protein: 27, fiber: 14, calories: 510 }
  },
  {
    id: "salmon-farro-bowl",
    slot: "Lunch",
    title: "Salmon farro bowl",
    subtitle: "Salmon, farro, chickpeas, spinach, cucumbers, and dill yogurt.",
    protein: "Fish",
    ingredients: [
      { name: "Salmon", group: "Protein" },
      { name: "Farro", group: "Whole grain" },
      { name: "Chickpeas", group: "Legume" },
      { name: "Spinach", group: "Greens" },
      { name: "Cucumber", group: "Vegetable" },
      { name: "Greek yogurt", group: "Dairy" }
    ],
    nutrients: { potassium: 1380, magnesium: 212, protein: 45, fiber: 13, calories: 650 }
  },
  {
    id: "beef-lentil-peppers",
    slot: "Lunch",
    title: "Beef and lentil peppers",
    subtitle: "Lean beef, lentils, roasted peppers, herbs, and a spoon of tzatziki.",
    protein: "Beef",
    ingredients: [
      { name: "Lean beef", group: "Protein" },
      { name: "Lentils", group: "Legume" },
      { name: "Bell peppers", group: "Vegetable" },
      { name: "Parsley", group: "Herb" },
      { name: "Greek yogurt", group: "Dairy" }
    ],
    nutrients: { potassium: 1420, magnesium: 168, protein: 43, fiber: 14, calories: 610 }
  },
  {
    id: "chicken-tabbouleh-bowl",
    slot: "Lunch",
    title: "Chicken tabbouleh bowl",
    subtitle: "Chicken breast, quinoa, parsley, mint, tomatoes, cucumbers, and tahini lemon.",
    protein: "Chicken",
    ingredients: [
      { name: "Chicken breast", group: "Protein" },
      { name: "Quinoa", group: "Whole grain" },
      { name: "Parsley", group: "Herb" },
      { name: "Mint", group: "Herb" },
      { name: "Tomatoes", group: "Vegetable" },
      { name: "Cucumber", group: "Vegetable" },
      { name: "Tahini", group: "Seed" }
    ],
    nutrients: { potassium: 1270, magnesium: 172, protein: 44, fiber: 11, calories: 590 }
  },
  {
    id: "sardine-bean-toast",
    slot: "Lunch",
    title: "Sardine white bean toast",
    subtitle: "Sardines, white beans, tomato, arugula, and toasted grain bread.",
    protein: "Fish",
    ingredients: [
      { name: "Sardines", group: "Protein" },
      { name: "White beans", group: "Legume" },
      { name: "Tomatoes", group: "Vegetable" },
      { name: "Arugula", group: "Greens" },
      { name: "Whole grain toast", group: "Whole grain" }
    ],
    nutrients: { potassium: 1180, magnesium: 142, protein: 34, fiber: 12, calories: 530 }
  },
  {
    id: "chicken-hummus-grain-box",
    slot: "Lunch",
    title: "Chicken hummus grain box",
    subtitle: "Chicken, bulgur, hummus, carrots, cucumbers, olives, and grapes.",
    protein: "Chicken",
    ingredients: [
      { name: "Chicken breast", group: "Protein" },
      { name: "Bulgur", group: "Whole grain" },
      { name: "Hummus", group: "Legume" },
      { name: "Carrots", group: "Vegetable" },
      { name: "Cucumber", group: "Vegetable" },
      { name: "Olives", group: "Fat" },
      { name: "Grapes", group: "Fruit" }
    ],
    nutrients: { potassium: 1160, magnesium: 154, protein: 42, fiber: 11, calories: 570 }
  },
  {
    id: "beef-gyro-salad",
    slot: "Lunch",
    title: "Beef gyro salad",
    subtitle: "Lean beef, romaine, tomatoes, chickpeas, yogurt sauce, and pita wedges.",
    protein: "Beef",
    ingredients: [
      { name: "Lean beef", group: "Protein" },
      { name: "Romaine", group: "Greens" },
      { name: "Tomatoes", group: "Vegetable" },
      { name: "Chickpeas", group: "Legume" },
      { name: "Greek yogurt", group: "Dairy" },
      { name: "Pita", group: "Whole grain" }
    ],
    nutrients: { potassium: 1280, magnesium: 178, protein: 39, fiber: 12, calories: 620 }
  },
  {
    id: "chicken-white-bean-soup",
    slot: "Lunch",
    title: "Chicken white bean soup",
    subtitle: "Chicken, white beans, kale, carrots, lemon, and olive oil broth.",
    protein: "Chicken",
    ingredients: [
      { name: "Chicken thigh", group: "Protein" },
      { name: "White beans", group: "Legume" },
      { name: "Kale", group: "Greens" },
      { name: "Carrots", group: "Vegetable" },
      { name: "Lemon", group: "Fruit" },
      { name: "Olive oil", group: "Fat" }
    ],
    nutrients: { potassium: 1320, magnesium: 148, protein: 40, fiber: 13, calories: 560 }
  },
  {
    id: "chicken-sweet-potato-kale",
    slot: "Dinner",
    title: "Chicken, sweet potato, and kale skillet",
    subtitle: "Lemon chicken with sweet potatoes, kale, garlic, and olive oil.",
    protein: "Chicken",
    ingredients: [
      { name: "Chicken thigh", group: "Protein" },
      { name: "Sweet potato", group: "Vegetable" },
      { name: "Kale", group: "Greens" },
      { name: "Garlic", group: "Vegetable" },
      { name: "Olive oil", group: "Fat" }
    ],
    nutrients: { potassium: 1540, magnesium: 162, protein: 50, fiber: 12, calories: 690 }
  },
  {
    id: "cod-bean-stew",
    slot: "Dinner",
    title: "Cod and white bean stew",
    subtitle: "Cod, cannellini beans, tomatoes, fennel, and rosemary broth.",
    protein: "Fish",
    ingredients: [
      { name: "Cod", group: "Protein" },
      { name: "White beans", group: "Legume" },
      { name: "Tomatoes", group: "Vegetable" },
      { name: "Fennel", group: "Vegetable" },
      { name: "Rosemary", group: "Herb" }
    ],
    nutrients: { potassium: 1390, magnesium: 192, protein: 44, fiber: 15, calories: 580 }
  },
  {
    id: "tuna-potato-plate",
    slot: "Dinner",
    title: "Seared tuna potato plate",
    subtitle: "Tuna, potatoes, green beans, olives, capers, and parsley.",
    protein: "Fish",
    ingredients: [
      { name: "Tuna", group: "Protein" },
      { name: "Potatoes", group: "Vegetable" },
      { name: "Green beans", group: "Vegetable" },
      { name: "Olives", group: "Fat" },
      { name: "Capers", group: "Vegetable" },
      { name: "Parsley", group: "Herb" }
    ],
    nutrients: { potassium: 1490, magnesium: 138, protein: 48, fiber: 10, calories: 620 }
  },
  {
    id: "beef-barley-spinach",
    slot: "Dinner",
    title: "Beef barley spinach skillet",
    subtitle: "Beef strips, pearl barley, spinach, mushrooms, and tomatoes.",
    protein: "Beef",
    ingredients: [
      { name: "Lean beef", group: "Protein" },
      { name: "Barley", group: "Whole grain" },
      { name: "Spinach", group: "Greens" },
      { name: "Mushrooms", group: "Vegetable" },
      { name: "Tomatoes", group: "Vegetable" }
    ],
    nutrients: { potassium: 1360, magnesium: 168, protein: 46, fiber: 11, calories: 640 }
  },
  {
    id: "salmon-roasted-veg",
    slot: "Dinner",
    title: "Salmon with roasted vegetables",
    subtitle: "Salmon, quinoa, zucchini, peppers, eggplant, and herb oil.",
    protein: "Fish",
    ingredients: [
      { name: "Salmon", group: "Protein" },
      { name: "Quinoa", group: "Whole grain" },
      { name: "Zucchini", group: "Vegetable" },
      { name: "Bell peppers", group: "Vegetable" },
      { name: "Eggplant", group: "Vegetable" },
      { name: "Olive oil", group: "Fat" }
    ],
    nutrients: { potassium: 1470, magnesium: 194, protein: 47, fiber: 12, calories: 710 }
  },
  {
    id: "trout-lentil-greens",
    slot: "Dinner",
    title: "Trout lentil greens plate",
    subtitle: "Trout, lentils, Swiss chard, roasted carrots, and lemon dill.",
    protein: "Fish",
    ingredients: [
      { name: "Trout", group: "Protein" },
      { name: "Lentils", group: "Legume" },
      { name: "Swiss chard", group: "Greens" },
      { name: "Carrots", group: "Vegetable" },
      { name: "Lemon", group: "Fruit" },
      { name: "Dill", group: "Herb" }
    ],
    nutrients: { potassium: 1560, magnesium: 202, protein: 49, fiber: 15, calories: 680 }
  },
  {
    id: "chicken-eggplant-traybake",
    slot: "Dinner",
    title: "Chicken eggplant traybake",
    subtitle: "Chicken breast, eggplant, tomatoes, chickpeas, oregano, and feta.",
    protein: "Chicken",
    ingredients: [
      { name: "Chicken breast", group: "Protein" },
      { name: "Eggplant", group: "Vegetable" },
      { name: "Tomatoes", group: "Vegetable" },
      { name: "Chickpeas", group: "Legume" },
      { name: "Oregano", group: "Herb" },
      { name: "Feta", group: "Dairy" }
    ],
    nutrients: { potassium: 1430, magnesium: 144, protein: 47, fiber: 11, calories: 600 }
  },
  {
    id: "hummus-avocado-plate",
    slot: "Snack",
    title: "Hummus and avocado plate",
    subtitle: "Hummus, avocado, cucumbers, peppers, and olives.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Hummus", group: "Legume" },
      { name: "Avocado", group: "Fat" },
      { name: "Cucumber", group: "Vegetable" },
      { name: "Bell peppers", group: "Vegetable" },
      { name: "Olives", group: "Fat" }
    ],
    nutrients: { potassium: 940, magnesium: 118, protein: 11, fiber: 11, calories: 390 }
  },
  {
    id: "kefir-date-shake",
    slot: "Snack",
    title: "Kefir and date shake",
    subtitle: "Kefir, dates, almond butter, cocoa, and cinnamon.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Kefir", group: "Dairy" },
      { name: "Dates", group: "Fruit" },
      { name: "Almond butter", group: "Nut" },
      { name: "Cocoa", group: "Pantry" }
    ],
    nutrients: { potassium: 860, magnesium: 148, protein: 18, fiber: 5, calories: 320 }
  },
  {
    id: "edamame-cacao-mix",
    slot: "Snack",
    title: "Edamame cacao mix",
    subtitle: "Roasted edamame, walnuts, cocoa nibs, and berries.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Edamame", group: "Legume" },
      { name: "Walnuts", group: "Nut" },
      { name: "Cocoa nibs", group: "Pantry" },
      { name: "Berries", group: "Fruit" }
    ],
    nutrients: { potassium: 690, magnesium: 162, protein: 17, fiber: 9, calories: 280 }
  },
  {
    id: "banana-tahini-skyr",
    slot: "Snack",
    title: "Banana tahini skyr cup",
    subtitle: "Skyr, banana, tahini, cinnamon, and a little honey.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Skyr", group: "Dairy" },
      { name: "Banana", group: "Fruit" },
      { name: "Tahini", group: "Seed" },
      { name: "Honey", group: "Pantry" }
    ],
    nutrients: { potassium: 890, magnesium: 92, protein: 22, fiber: 4, calories: 310 }
  },
  {
    id: "apricot-pistachio-yogurt",
    slot: "Snack",
    title: "Apricot pistachio yogurt",
    subtitle: "Greek yogurt with pistachios, dried apricot, and orange zest.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Greek yogurt", group: "Dairy" },
      { name: "Pistachios", group: "Nut" },
      { name: "Dried apricots", group: "Fruit" },
      { name: "Orange zest", group: "Fruit" }
    ],
    nutrients: { potassium: 640, magnesium: 108, protein: 17, fiber: 5, calories: 290 }
  },
  {
    id: "cocoa-oat-smoothie",
    slot: "Snack",
    title: "Cocoa oat smoothie",
    subtitle: "Kefir, oats, banana, cocoa, and almond butter.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Kefir", group: "Dairy" },
      { name: "Rolled oats", group: "Whole grain" },
      { name: "Banana", group: "Fruit" },
      { name: "Cocoa", group: "Pantry" },
      { name: "Almond butter", group: "Nut" }
    ],
    nutrients: { potassium: 760, magnesium: 146, protein: 16, fiber: 6, calories: 300 }
  },
  {
    id: "pear-edamame-dark-chocolate",
    slot: "Snack",
    title: "Pear, edamame, and dark chocolate",
    subtitle: "Pear slices with roasted edamame and a square of dark chocolate.",
    protein: "Vegetarian",
    ingredients: [
      { name: "Pear", group: "Fruit" },
      { name: "Edamame", group: "Legume" },
      { name: "Dark chocolate", group: "Pantry" }
    ],
    nutrients: { potassium: 710, magnesium: 122, protein: 14, fiber: 8, calories: 260 }
  }
];

export const weeklyPlan = [
  {
    id: "mon",
    label: "Mon",
    name: "Monday reset",
    focus: "Front-load the week with salmon, greens, and sweet potato so potassium stays ahead of schedule.",
    prep: "Roast extra sweet potato and cook extra farro for Wednesday's lunch prep.",
    meals: {
      breakfast: "citrus-yogurt-oats",
      lunch: "salmon-farro-bowl",
      dinner: "chicken-sweet-potato-kale",
      snack: "hummus-avocado-plate"
    }
  },
  {
    id: "tue",
    label: "Tue",
    name: "Tuesday strength",
    focus: "Lean beef and cod keep iron and protein high without drifting away from Mediterranean staples.",
    prep: "Make a double batch of lentils at lunch so Thursday's dinner comes together faster.",
    meals: {
      breakfast: "spinach-feta-omelet",
      lunch: "beef-lentil-peppers",
      dinner: "cod-bean-stew",
      snack: "kefir-date-shake"
    }
  },
  {
    id: "wed",
    label: "Wed",
    name: "Wednesday balance",
    focus: "Quinoa, tuna, and legumes give a lighter midweek feel while still covering magnesium comfortably.",
    prep: "Keep chopped parsley and cucumbers ready so the tabbouleh bowl stays low effort.",
    meals: {
      breakfast: "fig-walnut-oats",
      lunch: "chicken-tabbouleh-bowl",
      dinner: "tuna-potato-plate",
      snack: "edamame-cacao-mix"
    }
  },
  {
    id: "thu",
    label: "Thu",
    name: "Thursday mineral push",
    focus: "A seed-heavy breakfast and fish-at-lunch pattern keeps magnesium steady before a beef dinner.",
    prep: "Toast extra grain bread and keep yogurt sauce ready for Friday's lunch box.",
    meals: {
      breakfast: "yogurt-kiwi-bowl",
      lunch: "sardine-bean-toast",
      dinner: "beef-barley-spinach",
      snack: "banana-tahini-skyr"
    }
  },
  {
    id: "fri",
    label: "Fri",
    name: "Friday steady",
    focus: "This is the lightest potassium day, so it leaves room for an optional booster if dinner lands late.",
    prep: "If training or appetite runs high, add the potato or bean booster to close the gap easily.",
    meals: {
      breakfast: "cottage-herb-melon",
      lunch: "chicken-hummus-grain-box",
      dinner: "salmon-roasted-veg",
      snack: "apricot-pistachio-yogurt"
    }
  },
  {
    id: "sat",
    label: "Sat",
    name: "Saturday cook day",
    focus: "Trout, lentils, and a cocoa oat smoothie make this a strong replenishment day with minimal complexity.",
    prep: "Batch-cook lentils and roasted carrots so Sunday's soup feels almost done already.",
    meals: {
      breakfast: "tomato-spinach-scramble",
      lunch: "beef-gyro-salad",
      dinner: "trout-lentil-greens",
      snack: "cocoa-oat-smoothie"
    }
  },
  {
    id: "sun",
    label: "Sun",
    name: "Sunday reset",
    focus: "Use the soup and traybake pattern to reset the fridge and set up a smooth start to next week.",
    prep: "Save leftover chicken, beans, and herbs for next week's first lunch.",
    meals: {
      breakfast: "kefir-berry-blend",
      lunch: "chicken-white-bean-soup",
      dinner: "chicken-eggplant-traybake",
      snack: "pear-edamame-dark-chocolate"
    }
  }
];
