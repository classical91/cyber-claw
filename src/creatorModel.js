export const DRAFT_TYPES = { VIDEO: "video", SHORT: "short" };

export const SHORT_SAMPLE = {
  meta: {
    title: "The Bible Is a Map of Awakening",
    angle: "The Bible is not just history. It can be read as a map of consciousness."
  },
  script: {
    hook: "The Bible is not history. It's a map of consciousness.",
    body: "The Old Testament reveals states of fear, slavery, and faith through symbolic figures.",
    reveal: "The New Testament is fulfillment, when God awakens as you.",
    cta: "Follow for more divine insight and inner transformation."
  },
  visuals: {
    main: "Ancient biblical figures dissolve into light and reappear as the same modern man.",
    overlay: "An ancient scroll unfolds into shimmering light revealing a glowing human silhouette."
  },
  package: {
    title: "The Bible is a Map of Your Awakening - Not Just a Story",
    description: "The Bible can be read as your spiritual autobiography.",
    hashtags: "#NevilleGoddard #BookWisdom #MindPower #SpiritualGrowth #YouAreTheCreator #BibleMystery #ConsciousnessAwakening"
  }
};

export const VIDEO_SAMPLE = {
  meta: {
    title: "The Bible as a Map of Consciousness",
    coreIdea: "Scripture as a map of states, not only historical record."
  },
  script: {
    hook: "What if biblical characters describe states inside you?",
    chapterOne: "Old Testament states: fear, slavery, faith."
  },
  visuals: {
    thumbnail: "Modern face merging with ancient parchment silhouette."
  },
  package: {
    title: "The Bible Is a Map of Your Awakening, Not Just a Story",
    description: "A symbolic and consciousness-based reading of scripture."
  }
};

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createSample(type) {
  return clone(type === DRAFT_TYPES.VIDEO ? VIDEO_SAMPLE : SHORT_SAMPLE);
}

export function getValueAtPath(object, path) {
  return path.split(".").reduce((v, p) => v?.[p], object);
}

export function setValueAtPath(object, path, value) {
  const parts = path.split(".");
  let target = object;
  for (let i = 0; i < parts.length - 1; i += 1) target = target[parts[i]];
  target[parts[parts.length - 1]] = value;
}
