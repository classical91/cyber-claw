export const STORAGE_KEY = "profit-extraction-studio/v1";

export const WORKFLOW_STEPS = [
  {
    id: "market-map",
    title: "Market Map",
    description: "Pick a knowledge niche and document where buyers already spend to learn."
  },
  {
    id: "research-angle",
    title: "Research Angle",
    description: "Turn raw demand into a specific promise, thesis, and beginner-friendly outcome."
  },
  {
    id: "report-stack",
    title: "Report Stack",
    description: "Package the paid report, add-on assets, and backend offer into a clear ladder."
  },
  {
    id: "promotion",
    title: "Promotion",
    description: "Choose channels, hooks, and calls to action that can ship quickly."
  },
  {
    id: "guardrails",
    title: "Guardrails",
    description: "Keep the product factual, ethical, and within a safe topic boundary."
  }
];

export const MARKET_PLATFORM_GROUPS = [
  {
    id: "course-platforms",
    title: "Course Platforms",
    description: "Start where people already pay for guided learning.",
    items: [
      { id: "udemy", label: "Udemy" },
      { id: "coursera", label: "Coursera" },
      { id: "skillshare", label: "Skillshare" },
      { id: "kajabi", label: "Kajabi marketplaces" },
      { id: "masterclass", label: "MasterClass" }
    ]
  },
  {
    id: "book-platforms",
    title: "Book Platforms",
    description: "Use publishing demand as a second proof layer.",
    items: [
      { id: "amazon-kindle", label: "Amazon Kindle" },
      { id: "audible", label: "Audible" },
      { id: "gumroad-creators", label: "Gumroad creators" }
    ]
  },
  {
    id: "expert-platforms",
    title: "Expert Platforms",
    description: "See what educators and operators keep teaching in public.",
    items: [
      { id: "youtube-experts", label: "YouTube experts" },
      { id: "substack-writers", label: "Substack writers" },
      { id: "twitter-educators", label: "Twitter/X educators" },
      { id: "linkedin-leaders", label: "LinkedIn thought leaders" }
    ]
  }
];

export const MARKET_SIGNAL_ITEMS = [
  { id: "lots-of-courses", label: "Lots of courses" },
  { id: "lots-of-reviews", label: "Lots of reviews" },
  { id: "lots-of-questions", label: "Lots of questions" },
  { id: "clear-transformation", label: "Clear transformation" }
];

export const EXAMPLE_MARKETS = [
  "Affiliate marketing",
  "Personal finance",
  "AI automation",
  "Real estate investing",
  "Trading",
  "Fitness coaching",
  "Self improvement",
  "Sales psychology"
];

const MARKET_PLATFORM_IDS = MARKET_PLATFORM_GROUPS.flatMap((group) =>
  group.items.map((item) => item.id)
);
const MARKET_PLATFORM_LABELS = new Map(
  MARKET_PLATFORM_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item.label]))
);
const MARKET_SIGNAL_IDS = MARKET_SIGNAL_ITEMS.map((item) => item.id);
const MARKET_SIGNAL_LABELS = new Map(MARKET_SIGNAL_ITEMS.map((item) => [item.id, item.label]));

let idCounter = 0;

const DEFAULT_PROJECT = {
  brandName: "",
  niche: "",
  buyer: "",
  transformation: "",
  angle: "",
  promise: "",
  format: "Fast-read guide",
  researchWindow: "Same day",
  platformCoverage: {},
  topicSignals: {},
  sourceMix: "",
  evidenceNotes: "",
  expertPattern: "",
  faqCluster: ""
};

const DEFAULT_SIGNALS = {
  demandProof: 3,
  specificity: 3,
  sourceDepth: 3,
  backendPotential: 3,
  decisionWindow: "This week"
};

const DEFAULT_OFFER = {
  reportName: "",
  entryPrice: "$17",
  leadMagnet: "",
  premiumUpsell: "",
  backendOffer: "",
  deliveryModel: "",
  callToAction: "",
  affiliatePlan: ""
};

const DEFAULT_GUARDRAILS = {
  factCheckPlan: "",
  rightsPlan: "",
  disclosurePlan: "",
  exclusions: "",
  boundaryNote: ""
};

function createId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function clampScore(value, fallback = 3) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(5, Math.round(parsed)));
}

function safeText(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function isFilled(value) {
  return safeText(value).trim().length > 0;
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function toPercent(ratio) {
  return Math.round(ratio * 100);
}

function fromScore(value) {
  return Math.round(((clampScore(value) - 1) / 4) * 100);
}

function uniqueRisk(risks, title, detail, severity = "watch") {
  if (risks.some((risk) => risk.title === title)) {
    return risks;
  }

  return [...risks, { title, detail, severity }];
}

function createPlatformCoverage(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};

  return Object.fromEntries(
    MARKET_PLATFORM_IDS.map((id) => [id, Boolean(safeSource[id])])
  );
}

function createTopicSignals(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};

  return Object.fromEntries(
    MARKET_SIGNAL_IDS.map((id) => [id, Boolean(safeSource[id])])
  );
}

export function countSelectedPlatforms(platformCoverage) {
  return Object.values(createPlatformCoverage(platformCoverage)).filter(Boolean).length;
}

export function listSelectedPlatforms(platformCoverage) {
  const safeCoverage = createPlatformCoverage(platformCoverage);

  return MARKET_PLATFORM_IDS.filter((id) => safeCoverage[id]).map(
    (id) => MARKET_PLATFORM_LABELS.get(id) || id
  );
}

function getPlatformCoverageRatio(platformCoverage) {
  return countSelectedPlatforms(platformCoverage) / MARKET_PLATFORM_IDS.length;
}

export function countSelectedTopicSignals(topicSignals) {
  return Object.values(createTopicSignals(topicSignals)).filter(Boolean).length;
}

export function listSelectedTopicSignals(topicSignals) {
  const safeSignals = createTopicSignals(topicSignals);

  return MARKET_SIGNAL_IDS.filter((id) => safeSignals[id]).map(
    (id) => MARKET_SIGNAL_LABELS.get(id) || id
  );
}

function getTopicSignalRatio(topicSignals) {
  return countSelectedTopicSignals(topicSignals) / MARKET_SIGNAL_IDS.length;
}

function getModuleCompletion(module) {
  const safeModule = createModule(module);
  return average([
    isFilled(safeModule.title) ? 1 : 0,
    isFilled(safeModule.outcome) ? 1 : 0,
    isFilled(safeModule.proofSource) ? 1 : 0
  ]);
}

function getChannelCompletion(channel) {
  const safeChannel = createChannel(channel);
  return average([
    isFilled(safeChannel.channel) ? 1 : 0,
    isFilled(safeChannel.hook) ? 1 : 0,
    isFilled(safeChannel.cta) ? 1 : 0,
    isFilled(safeChannel.cadence) ? 1 : 0
  ]);
}

function hasHighStakesSignals(state) {
  const safeState = ensureStateShape(state);
  const haystack = [
    safeState.project.niche,
    safeState.project.transformation,
    safeState.project.buyer,
    safeState.offer.reportName
  ].join(" ");

  return /(health|medical|doctor|treatment|legal|law|tax|invest|investment|credit|debt|mortgage|insurance)/i.test(
    haystack
  );
}

export function createModule(overrides = {}) {
  return {
    id: safeText(overrides.id) || createId("module"),
    title: safeText(overrides.title),
    outcome: safeText(overrides.outcome),
    proofSource: safeText(overrides.proofSource),
    depth: clampScore(overrides.depth)
  };
}

export function createChannel(overrides = {}) {
  return {
    id: safeText(overrides.id) || createId("channel"),
    channel: safeText(overrides.channel),
    hook: safeText(overrides.hook),
    cta: safeText(overrides.cta),
    cadence: safeText(overrides.cadence),
    confidence: clampScore(overrides.confidence),
    effort: clampScore(overrides.effort),
    urgency: clampScore(overrides.urgency)
  };
}

export function createInitialState() {
  return {
    project: {
      ...DEFAULT_PROJECT,
      platformCoverage: createPlatformCoverage(),
      topicSignals: createTopicSignals()
    },
    signals: { ...DEFAULT_SIGNALS },
    offer: { ...DEFAULT_OFFER },
    guardrails: { ...DEFAULT_GUARDRAILS },
    modules: [createModule()],
    channels: [createChannel()],
    activeStep: WORKFLOW_STEPS[0].id
  };
}

export function ensureStateShape(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const projectSource = source.project && typeof source.project === "object" ? source.project : {};
  const signalSource = source.signals && typeof source.signals === "object" ? source.signals : {};
  const offerSource = source.offer && typeof source.offer === "object" ? source.offer : {};
  const guardrailSource =
    source.guardrails && typeof source.guardrails === "object" ? source.guardrails : {};

  const modules =
    Array.isArray(source.modules) && source.modules.length > 0
      ? source.modules.map((module) => createModule(module))
      : [createModule()];

  const channels =
    Array.isArray(source.channels) && source.channels.length > 0
      ? source.channels.map((channel) => createChannel(channel))
      : [createChannel()];

  const activeStep = WORKFLOW_STEPS.some((step) => step.id === source.activeStep)
    ? source.activeStep
    : WORKFLOW_STEPS[0].id;

  return {
    project: {
      ...DEFAULT_PROJECT,
      ...projectSource,
      brandName: safeText(projectSource.brandName),
      niche: safeText(projectSource.niche),
      buyer: safeText(projectSource.buyer),
      transformation: safeText(projectSource.transformation),
      angle: safeText(projectSource.angle),
      promise: safeText(projectSource.promise),
      format: safeText(projectSource.format) || DEFAULT_PROJECT.format,
      researchWindow: safeText(projectSource.researchWindow) || DEFAULT_PROJECT.researchWindow,
      platformCoverage: createPlatformCoverage(projectSource.platformCoverage),
      topicSignals: createTopicSignals(projectSource.topicSignals),
      sourceMix: safeText(projectSource.sourceMix),
      evidenceNotes: safeText(projectSource.evidenceNotes),
      expertPattern: safeText(projectSource.expertPattern),
      faqCluster: safeText(projectSource.faqCluster)
    },
    signals: {
      demandProof: clampScore(signalSource.demandProof),
      specificity: clampScore(signalSource.specificity),
      sourceDepth: clampScore(signalSource.sourceDepth),
      backendPotential: clampScore(signalSource.backendPotential),
      decisionWindow: safeText(signalSource.decisionWindow) || DEFAULT_SIGNALS.decisionWindow
    },
    offer: {
      ...DEFAULT_OFFER,
      ...offerSource,
      reportName: safeText(offerSource.reportName),
      entryPrice: safeText(offerSource.entryPrice) || DEFAULT_OFFER.entryPrice,
      leadMagnet: safeText(offerSource.leadMagnet),
      premiumUpsell: safeText(offerSource.premiumUpsell),
      backendOffer: safeText(offerSource.backendOffer),
      deliveryModel: safeText(offerSource.deliveryModel),
      callToAction: safeText(offerSource.callToAction),
      affiliatePlan: safeText(offerSource.affiliatePlan)
    },
    guardrails: {
      ...DEFAULT_GUARDRAILS,
      ...guardrailSource,
      factCheckPlan: safeText(guardrailSource.factCheckPlan),
      rightsPlan: safeText(guardrailSource.rightsPlan),
      disclosurePlan: safeText(guardrailSource.disclosurePlan),
      exclusions: safeText(guardrailSource.exclusions),
      boundaryNote: safeText(guardrailSource.boundaryNote)
    },
    modules,
    channels,
    activeStep
  };
}

export function createSampleState() {
  return ensureStateShape({
    project: {
      brandName: "Profit Extraction Studio",
      niche: "AI prompting for freelancers and small agencies",
      buyer: "Freelancers, solo operators, and lean service businesses using AI for client work",
      transformation:
        "Stop getting generic answers and turn prompting into reusable workflows that save time and improve outputs.",
      angle: "You do not have a prompting problem. You have an extraction problem.",
      promise:
        "Condense the best frameworks, mistakes, and prompt examples into one fast-read guide people can act on immediately.",
      format: "Guide + prompt pack",
      researchWindow: "Same day",
      platformCoverage: {
        udemy: true,
        coursera: true,
        skillshare: true,
        kajabi: true,
        masterclass: false,
        "amazon-kindle": true,
        audible: true,
        "gumroad-creators": true,
        "youtube-experts": true,
        "substack-writers": true,
        "twitter-educators": true,
        "linkedin-leaders": true
      },
      topicSignals: {
        "lots-of-courses": true,
        "lots-of-reviews": true,
        "lots-of-questions": true,
        "clear-transformation": true
      },
      sourceMix: "Courses, bestselling books, YouTube explainers, Reddit questions, and creator breakdowns",
      evidenceNotes:
        "Prompt engineering, AI workflows, and role-specific prompting appear repeatedly across course catalogs and creator channels. Buyers want shortcuts, examples, and business-ready prompts instead of abstract theory.",
      expertPattern:
        "The strongest advice repeats context, constraints, formatting, iteration, and domain-specific examples rather than clever one-line prompts.",
      faqCluster:
        "Why AI sounds generic, how to get better outputs, prompt examples for freelancing, prompt stacks for marketing, and how to build a reusable library."
    },
    signals: {
      demandProof: 5,
      specificity: 4,
      sourceDepth: 4,
      backendPotential: 5,
      decisionWindow: "This week"
    },
    offer: {
      reportName: "The AI Output Extraction System",
      entryPrice: "$17",
      leadMagnet: "10 Prompt Mistakes Beginners Make",
      premiumUpsell: "200 prompts for freelancers and creators",
      backendOffer: "Prompt teardown session or done-with-you AI workflow setup",
      deliveryModel: "Simple checkout plus manual delivery email with upsell links",
      callToAction: "Comment or click to get the guide and the prompt appendix today.",
      affiliatePlan: "Optional tool links for prompt libraries and AI utilities with clear disclosure."
    },
    modules: [
      createModule({
        title: "The Extraction Mindset",
        outcome: "Reframe prompting as research, context, and output design instead of clever wording.",
        proofSource: "Patterns repeated across prompting courses and creator tutorials",
        depth: 4
      }),
      createModule({
        title: "The Core Prompt Stack",
        outcome: "Teach context, format, constraints, and iteration as a repeatable system.",
        proofSource: "Prompt engineering course summaries and public expert advice",
        depth: 5
      }),
      createModule({
        title: "Freelancer Prompt Appendix",
        outcome: "Give role-based prompts for copy, outreach, research, and revision work.",
        proofSource: "High-interest beginner questions and freelancer workflow examples",
        depth: 4
      })
    ],
    channels: [
      createChannel({
        channel: "Short-form video",
        hook: "The real reason AI gives you generic garbage",
        cta: "Grab the guide for the full framework and prompt pack.",
        cadence: "3 clips this week",
        confidence: 4,
        effort: 3,
        urgency: 5
      }),
      createChannel({
        channel: "Email follow-up",
        hook: "Thanks for buying. Here are the next three prompts to try first.",
        cta: "Reply with your use case if you want the done-for-you version.",
        cadence: "Manual follow-up after every purchase",
        confidence: 5,
        effort: 2,
        urgency: 5
      }),
      createChannel({
        channel: "Facebook groups",
        hook: "10 prompting mistakes beginners keep making",
        cta: "Comment and I will send the guide link.",
        cadence: "2 useful posts this week",
        confidence: 3,
        effort: 3,
        urgency: 4
      })
    ],
    guardrails: {
      factCheckPlan:
        "Test every prompt, verify factual claims, and remove unsupported earnings language before publishing.",
      rightsPlan:
        "Summarize patterns and frameworks in original language rather than copying lessons, chapters, or proprietary materials.",
      disclosurePlan:
        "Disclose affiliate links, manual follow-up, and that results vary based on execution and niche quality.",
      exclusions:
        "Avoid health, legal, tax, and individualized financial advice. Stay in light business, creative, and productivity topics.",
      boundaryNote:
        "Use the report as synthesis and education, not as a substitute for licensed or regulated expertise."
    },
    activeStep: WORKFLOW_STEPS[0].id
  });
}

export function getWorkflowProgress(state) {
  const safeState = ensureStateShape(state);
  const modulesProgress = average(safeState.modules.map((module) => getModuleCompletion(module)));
  const channelsProgress = average(safeState.channels.map((channel) => getChannelCompletion(channel)));
  const platformCoverage = getPlatformCoverageRatio(safeState.project.platformCoverage);
  const topicSignalCoverage = getTopicSignalRatio(safeState.project.topicSignals);

  const marketMap = toPercent(
    average([
      isFilled(safeState.project.brandName) ? 1 : 0,
      isFilled(safeState.project.niche) ? 1 : 0,
      isFilled(safeState.project.buyer) ? 1 : 0,
      platformCoverage,
      topicSignalCoverage,
      isFilled(safeState.project.sourceMix) ? 1 : 0,
      isFilled(safeState.project.evidenceNotes) ? 1 : 0
    ])
  );

  const researchAngle = toPercent(
    average([
      isFilled(safeState.project.transformation) ? 1 : 0,
      isFilled(safeState.project.angle) ? 1 : 0,
      isFilled(safeState.project.promise) ? 1 : 0,
      isFilled(safeState.project.expertPattern) ? 1 : 0,
      isFilled(safeState.project.faqCluster) ? 1 : 0
    ])
  );

  const reportStack = toPercent(
    average([
      isFilled(safeState.offer.reportName) ? 1 : 0,
      isFilled(safeState.offer.entryPrice) ? 1 : 0,
      isFilled(safeState.offer.leadMagnet) ? 1 : 0,
      isFilled(safeState.offer.premiumUpsell) ? 1 : 0,
      isFilled(safeState.offer.backendOffer) ? 1 : 0,
      isFilled(safeState.offer.deliveryModel) ? 1 : 0,
      modulesProgress
    ])
  );

  const promotion = toPercent(
    average([
      isFilled(safeState.offer.callToAction) ? 1 : 0,
      channelsProgress
    ])
  );

  const guardrails = toPercent(
    average([
      isFilled(safeState.guardrails.factCheckPlan) ? 1 : 0,
      isFilled(safeState.guardrails.rightsPlan) ? 1 : 0,
      isFilled(safeState.guardrails.disclosurePlan) ? 1 : 0,
      isFilled(safeState.guardrails.exclusions) ? 1 : 0,
      isFilled(safeState.guardrails.boundaryNote) ? 1 : 0
    ])
  );

  return [
    { id: "market-map", title: "Market Map", completion: marketMap },
    { id: "research-angle", title: "Research Angle", completion: researchAngle },
    { id: "report-stack", title: "Report Stack", completion: reportStack },
    { id: "promotion", title: "Promotion", completion: promotion },
    { id: "guardrails", title: "Guardrails", completion: guardrails }
  ];
}

export function scoreChannel(channel, state) {
  const safeState = ensureStateShape(state);
  const safeChannel = createChannel(channel);
  const completionBonus = Math.round(getChannelCompletion(safeChannel) * 8);
  const offerBonus = isFilled(safeState.offer.callToAction) ? 2 : 0;
  const score =
    safeChannel.confidence * 4 +
    safeChannel.urgency * 3 +
    completionBonus +
    offerBonus -
    safeChannel.effort * 2;

  let recommendation = "Keep warm";
  if (safeChannel.confidence <= 2 || getChannelCompletion(safeChannel) < 0.5) {
    recommendation = "Test messaging";
  } else if (score >= 30 && safeChannel.effort <= 3) {
    recommendation = "Ship now";
  } else if (score >= 22) {
    recommendation = "Run this week";
  }

  return {
    score,
    recommendation
  };
}

export function rankChannels(state) {
  const safeState = ensureStateShape(state);

  return safeState.channels
    .map((channel) => ({
      ...channel,
      ...scoreChannel(channel, safeState)
    }))
    .sort((left, right) => right.score - left.score || left.channel.localeCompare(right.channel));
}

export function buildLaunchPlan(state) {
  const buckets = {
    now: [],
    next: [],
    test: [],
    later: []
  };

  for (const channel of rankChannels(state)) {
    if (channel.confidence <= 2 || (channel.effort >= 4 && channel.score < 26)) {
      buckets.test.push(channel);
      continue;
    }

    if (channel.score >= 30 && channel.effort <= 3) {
      buckets.now.push(channel);
      continue;
    }

    if (channel.score >= 22) {
      buckets.next.push(channel);
      continue;
    }

    buckets.later.push(channel);
  }

  return buckets;
}

export function buildOfferLadder(state) {
  const safeState = ensureStateShape(state);

  return [
    {
      stage: "Lead magnet",
      title: safeState.offer.leadMagnet || "Add a free teaser asset",
      detail:
        safeState.offer.leadMagnet
          ? "Use it to prove the angle before asking for money."
          : "A checklist, mistakes list, or mini cheat sheet is a good low-friction first asset."
    },
    {
      stage: "Entry offer",
      title: safeState.offer.reportName || "Define the paid report",
      detail: `${safeState.offer.entryPrice || "$17"} for a ${
        safeState.project.format.toLowerCase() || "fast-read guide"
      } aimed at ${safeState.project.buyer || "a clear buyer"}.`
    },
    {
      stage: "Upsell",
      title: safeState.offer.premiumUpsell || "Add a higher-value asset",
      detail:
        safeState.offer.premiumUpsell
          ? "Templates, appendices, or bonus files make the jump from low-ticket to mid-ticket feel natural."
          : "A prompt pack, checklist bundle, or template library is a simple next step."
    },
    {
      stage: "Backend",
      title: safeState.offer.backendOffer || "Define the service or premium path",
      detail:
        safeState.offer.backendOffer
          ? "This is where consulting, setup work, or a deeper product can create real margin."
          : "Think audit, consulting, implementation, or a premium course after the low-ticket offer."
    }
  ];
}

export function buildLaunchSprint(state) {
  const safeState = ensureStateShape(state);
  const rankedChannels = rankChannels(safeState);
  const topChannel = rankedChannels[0];
  const topModule = [...safeState.modules].sort((left, right) => right.depth - left.depth)[0];

  return [
    {
      title: "Lock the thesis",
      detail: `Tighten the angle around "${
        safeState.project.angle || "the specific transformation buyers already want"
      }" before you add more content.`
    },
    {
      title: "Finish the core asset",
      detail: `Build ${
        topModule?.title || "the first report section"
      } first so the product has one unmistakably useful deliverable.`
    },
    {
      title: "Ship the first promotion loop",
      detail: `Post ${topChannel?.channel || "the fastest available channel"} with a hook like "${
        topChannel?.hook || safeState.offer.callToAction || "a clear problem-solution promise"
      }".`
    },
    {
      title: "Follow up by hand",
      detail: `Deliver through ${
        safeState.offer.deliveryModel || "a simple checkout plus email flow"
      } and offer ${
        safeState.offer.backendOffer || safeState.offer.premiumUpsell || "a clear next step"
      } to warm buyers.`
    }
  ];
}

export function buildRiskRegister(state) {
  const safeState = ensureStateShape(state);
  const selectedPlatforms = countSelectedPlatforms(safeState.project.platformCoverage);
  const selectedTopicSignals = countSelectedTopicSignals(safeState.project.topicSignals);
  let risks = [];

  if (safeState.signals.demandProof <= 2) {
    risks = uniqueRisk(
      risks,
      "Demand proof is thin",
      "The niche does not yet show strong evidence that people already pay to learn this topic. Tighten the market proof before packaging the report.",
      "high"
    );
  }

  if (safeState.signals.specificity <= 2) {
    risks = uniqueRisk(
      risks,
      "The niche is still too broad",
      "Buyers convert more easily on a narrow transformation than on a general topic. Tighten the niche before expanding the report.",
      "high"
    );
  }

  if (safeState.signals.sourceDepth <= 2 || safeState.project.evidenceNotes.trim().length < 60) {
    risks = uniqueRisk(
      risks,
      "Research base is shallow",
      "The app is missing enough proof from courses, books, communities, or creator material to justify a strong offer.",
      "watch"
    );
  }

  if (selectedPlatforms < 3) {
    risks = uniqueRisk(
      risks,
      "Platform scan is too narrow",
      "The market map should check multiple learning platforms before trusting the niche. Scan at least three from the course, book, and expert lists.",
      "watch"
    );
  }

  if (selectedTopicSignals < 2) {
    risks = uniqueRisk(
      risks,
      "Opportunity signals are unconfirmed",
      "The niche should clearly show courses, reviews, questions, or a strong transformation before you trust it. Confirm at least two of those signals.",
      "watch"
    );
  }

  if (
    !isFilled(safeState.offer.reportName) ||
    average(safeState.modules.map((module) => getModuleCompletion(module))) < 0.55
  ) {
    risks = uniqueRisk(
      risks,
      "Offer is still generic",
      "The report title, module stack, or buyer outcome needs more shape before this feels like a distinct product.",
      "watch"
    );
  }

  if (safeState.signals.backendPotential >= 4 && !isFilled(safeState.offer.backendOffer)) {
    risks = uniqueRisk(
      risks,
      "Missing backend path",
      "The topic looks strong enough for a higher-value offer, but the backend step is still undefined.",
      "watch"
    );
  }

  if (
    rankChannels(safeState).length === 0 ||
    average(safeState.channels.map((channel) => getChannelCompletion(channel))) < 0.5
  ) {
    risks = uniqueRisk(
      risks,
      "Traffic plan is incomplete",
      "At least one channel needs a specific hook, cadence, and call to action before launch.",
      "high"
    );
  }

  if (!isFilled(safeState.guardrails.factCheckPlan) || !isFilled(safeState.guardrails.rightsPlan)) {
    risks = uniqueRisk(
      risks,
      "Compliance gap",
      "Write down how claims will be checked and how source material will be summarized without copying.",
      "high"
    );
  }

  if (hasHighStakesSignals(safeState) && !isFilled(safeState.guardrails.exclusions)) {
    risks = uniqueRisk(
      risks,
      "High-stakes niche needs tighter limits",
      "This topic touches regulated or sensitive advice. Add exclusions and stronger boundaries before publishing.",
      "high"
    );
  }

  if (safeState.modules.length > 7 || safeState.channels.length > 5) {
    risks = uniqueRisk(
      risks,
      "Focus drift",
      "The plan is carrying too many modules or channels for a first launch. Trim to the fastest path to proof.",
      "watch"
    );
  }

  if (isFilled(safeState.offer.affiliatePlan) && !isFilled(safeState.guardrails.disclosurePlan)) {
    risks = uniqueRisk(
      risks,
      "Disclosure is missing",
      "If the report includes affiliate links or sponsored tools, the disclosure plan needs to be explicit.",
      "watch"
    );
  }

  return risks.slice(0, 6);
}

export function getStudioHealth(state) {
  const safeState = ensureStateShape(state);
  const progress = getWorkflowProgress(safeState);
  const rankedChannels = rankChannels(safeState);
  const moduleCompletion = toPercent(
    average(safeState.modules.map((module) => getModuleCompletion(module)))
  );
  const channelCompletion = toPercent(
    average(safeState.channels.map((channel) => getChannelCompletion(channel)))
  );
  const platformCoverage = Math.round(getPlatformCoverageRatio(safeState.project.platformCoverage) * 100);
  const topicSignalCoverage = Math.round(getTopicSignalRatio(safeState.project.topicSignals) * 100);
  const highStakesPenalty =
    hasHighStakesSignals(safeState) && !isFilled(safeState.guardrails.exclusions) ? 28 : 0;

  const marketProof = Math.round(
    average([
      fromScore(safeState.signals.demandProof),
      fromScore(safeState.signals.specificity),
      fromScore(safeState.signals.sourceDepth),
      platformCoverage,
      topicSignalCoverage,
      progress[0].completion,
      progress[1].completion
    ])
  );

  const offerStrength = Math.round(
    average([
      moduleCompletion,
      progress[2].completion,
      fromScore(safeState.signals.backendPotential),
      isFilled(safeState.offer.reportName) ? 100 : 40,
      isFilled(safeState.offer.backendOffer) ? 100 : 50
    ])
  );

  const launchReadiness = Math.round(
    average([
      channelCompletion,
      progress[3].completion,
      rankedChannels[0] ? fromScore(rankedChannels[0].confidence) : 35,
      isFilled(safeState.offer.deliveryModel) ? 100 : 40
    ])
  );

  const safety = Math.max(
    20,
    Math.round(
      average([
        progress[4].completion,
        isFilled(safeState.guardrails.factCheckPlan) ? 100 : 30,
        isFilled(safeState.guardrails.rightsPlan) ? 100 : 30,
        isFilled(safeState.guardrails.disclosurePlan) ? 100 : 45,
        isFilled(safeState.guardrails.exclusions) ? 100 : 35
      ])
    ) - highStakesPenalty
  );

  const overall = Math.round(average([marketProof, offerStrength, launchReadiness, safety]));

  return {
    overall,
    marketProof,
    offerStrength,
    launchReadiness,
    safety,
    leadChannel: rankedChannels[0]?.channel || "Add a launch channel"
  };
}

export function buildExecutiveBrief(state) {
  const safeState = ensureStateShape(state);
  const rankedChannels = rankChannels(safeState);
  const leadRisk = buildRiskRegister(safeState)[0];
  const topModule = [...safeState.modules].sort((left, right) => right.depth - left.depth)[0];
  const selectedPlatforms = countSelectedPlatforms(safeState.project.platformCoverage);
  const selectedTopicSignals = countSelectedTopicSignals(safeState.project.topicSignals);

  return `${
    safeState.offer.reportName || safeState.project.brandName || "This product"
  } is being positioned for ${
    safeState.project.buyer || "a clearly defined buyer"
  } inside ${safeState.project.niche || "a researched knowledge niche"} after scanning ${selectedPlatforms}/${
    MARKET_PLATFORM_IDS.length
  } suggested learning platforms and confirming ${selectedTopicSignals}/${MARKET_SIGNAL_IDS.length} demand signals. The core hook is "${
    safeState.project.angle || safeState.project.promise || "a sharper transformation promise"
  }", and the first asset to finish is ${
    topModule?.title || "a concise, useful core module"
  }. The fastest channel to test is ${
    rankedChannels[0]?.channel || "a lightweight direct-response channel"
  } because it currently balances confidence, urgency, and shipping speed best. The main watch-out is ${
    leadRisk?.title.toLowerCase() || "keeping the package specific, factual, and easy to launch"
  }, so the next move is to tighten the proof, ship one hook, and follow up manually after each sale.`;
}

export function buildMarkdownBrief(state) {
  const safeState = ensureStateShape(state);
  const health = getStudioHealth(safeState);
  const risks = buildRiskRegister(safeState);
  const offerLadder = buildOfferLadder(safeState);
  const launchPlan = buildLaunchPlan(safeState);
  const sprint = buildLaunchSprint(safeState);
  const selectedPlatforms = listSelectedPlatforms(safeState.project.platformCoverage);
  const selectedSignals = listSelectedTopicSignals(safeState.project.topicSignals);

  const modulesBlock = safeState.modules
    .map(
      (module) =>
        `- ${module.title || "Untitled module"}: ${module.outcome || "Outcome not defined"}`
    )
    .join("\n");

  const channelsBlock = rankChannels(safeState)
    .map(
      (channel) =>
        `- ${channel.channel || "Untitled channel"} (${channel.recommendation}) - ${channel.hook || "Hook TBD"}`
    )
    .join("\n");

  const riskBlock =
    risks.length > 0
      ? risks.map((risk) => `- ${risk.title}: ${risk.detail}`).join("\n")
      : "- No major launch risks surfaced yet.";

  const ladderBlock = offerLadder
    .map((step) => `- ${step.stage}: ${step.title} - ${step.detail}`)
    .join("\n");

  const sprintBlock = sprint
    .map((step) => `- ${step.title}: ${step.detail}`)
    .join("\n");

  const formatBucket = (label, items) =>
    items.length > 0
      ? `## ${label}\n${items
          .map(
            (item) =>
              `- ${item.channel || "Untitled channel"} - ${item.hook || "Hook TBD"} (${item.score})`
          )
          .join("\n")}`
      : `## ${label}\n- No channels mapped here yet.`;

  return `# ${safeState.offer.reportName || safeState.project.brandName || "Profit extraction brief"}

## Executive Summary
${buildExecutiveBrief(safeState)}

## Opportunity Score
- Overall: ${health.overall}/100
- Market proof: ${health.marketProof}/100
- Offer strength: ${health.offerStrength}/100
- Launch readiness: ${health.launchReadiness}/100
- Safety: ${health.safety}/100

## Product Positioning
- Brand: ${safeState.project.brandName || "Not defined"}
- Niche: ${safeState.project.niche || "Not defined"}
- Buyer: ${safeState.project.buyer || "Not defined"}
- Transformation: ${safeState.project.transformation || "Not defined"}
- Promise: ${safeState.project.promise || "Not defined"}
- Platforms scanned: ${selectedPlatforms.length}/${MARKET_PLATFORM_IDS.length}
- Platform list: ${selectedPlatforms.length > 0 ? selectedPlatforms.join(", ") : "Not defined"}
- Demand signals confirmed: ${selectedSignals.length}/${MARKET_SIGNAL_IDS.length}
- Demand signal list: ${selectedSignals.length > 0 ? selectedSignals.join(", ") : "Not defined"}
- Format: ${safeState.project.format}
- Research window: ${safeState.project.researchWindow}

## Offer Ladder
${ladderBlock}

## Report Modules
${modulesBlock}

## Promotion Channels
${channelsBlock}

${formatBucket("Ship Now", launchPlan.now)}

${formatBucket("Run This Week", launchPlan.next)}

${formatBucket("Test Messaging", launchPlan.test)}

${formatBucket("Keep Warm", launchPlan.later)}

## Guardrails
- Fact-check plan: ${safeState.guardrails.factCheckPlan || "Not defined"}
- Rights plan: ${safeState.guardrails.rightsPlan || "Not defined"}
- Disclosure plan: ${safeState.guardrails.disclosurePlan || "Not defined"}
- Exclusions: ${safeState.guardrails.exclusions || "Not defined"}
- Boundary note: ${safeState.guardrails.boundaryNote || "Not defined"}

## 7-Day Sprint
${sprintBlock}

## Risks
${riskBlock}
`;
}
