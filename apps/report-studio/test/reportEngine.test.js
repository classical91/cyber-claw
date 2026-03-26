import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExecutiveBrief,
  buildLaunchPlan,
  buildRiskRegister,
  createChannel,
  createModule,
  ensureStateShape,
  getStudioHealth,
  scoreChannel
} from "../src/reportEngine.js";

function createStateFixture() {
  return ensureStateShape({
    project: {
      brandName: "Profit Extraction Studio",
      niche: "AI prompting for freelancers",
      buyer: "Freelancers and solo agencies",
      transformation: "Stop getting generic outputs and ship stronger client work.",
      angle: "You do not have a prompting problem. You have an extraction problem.",
      promise: "Turn research into a fast-read guide that helps buyers get better AI outputs.",
      platformCoverage: {
        udemy: true,
        coursera: true,
        "amazon-kindle": true,
        "youtube-experts": true
      },
      topicSignals: {
        "lots-of-courses": true,
        "lots-of-reviews": true,
        "clear-transformation": true
      },
      sourceMix: "Courses, YouTube, books, and forums",
      evidenceNotes:
        "Prompt engineering and role-based prompting appear repeatedly across paid courses, creator content, and public question threads.",
      expertPattern: "Experts repeat context, constraints, and iteration.",
      faqCluster: "Why AI sounds generic and how to fix it."
    },
    signals: {
      demandProof: 4,
      specificity: 4,
      sourceDepth: 4,
      backendPotential: 5,
      decisionWindow: "This week"
    },
    offer: {
      reportName: "The AI Output Extraction System",
      entryPrice: "$17",
      leadMagnet: "10 prompt mistakes",
      premiumUpsell: "200 prompts",
      backendOffer: "Prompt teardown session",
      deliveryModel: "Checkout plus manual follow-up email",
      callToAction: "Grab the guide today.",
      affiliatePlan: "Optional tool links with disclosure"
    },
    modules: [
      createModule({
        id: "module-a",
        title: "The extraction mindset",
        outcome: "Reframe prompting as context plus output design.",
        proofSource: "Repeated course patterns",
        depth: 4
      })
    ],
    channels: [
      createChannel({
        id: "channel-a",
        channel: "Short-form video",
        hook: "The real reason AI gives you generic garbage",
        cta: "Get the guide",
        cadence: "3 clips this week",
        confidence: 4,
        effort: 2,
        urgency: 5
      }),
      createChannel({
        id: "channel-b",
        channel: "Podcast tour",
        hook: "",
        cta: "",
        cadence: "Later",
        confidence: 2,
        effort: 5,
        urgency: 2
      })
    ],
    guardrails: {
      factCheckPlan: "Test prompts and verify claims before shipping.",
      rightsPlan: "Summarize ideas in original language.",
      disclosurePlan: "Disclose affiliate links.",
      exclusions: "No legal, medical, or tax advice.",
      boundaryNote: "Educational synthesis only."
    }
  });
}

test("channel scoring rewards confidence, urgency, and lower effort", () => {
  const state = createStateFixture();
  const stronger = scoreChannel(state.channels[0], state);
  const weaker = scoreChannel(state.channels[1], state);

  assert.ok(stronger.score > weaker.score);
  assert.equal(stronger.recommendation, "Ship now");
});

test("launch plan pushes incomplete or expensive channels into testing", () => {
  const state = createStateFixture();
  const plan = buildLaunchPlan(state);

  assert.equal(plan.now[0].id, "channel-a");
  assert.equal(plan.test[0].id, "channel-b");
});

test("risk register flags missing backend and compliance gaps", () => {
  const base = createStateFixture();
  const state = ensureStateShape({
    ...base,
    offer: {
      ...base.offer,
      backendOffer: ""
    },
    guardrails: {
      ...base.guardrails,
      rightsPlan: ""
    }
  });

  const risks = buildRiskRegister(state);
  const titles = risks.map((risk) => risk.title);

  assert.ok(titles.includes("Missing backend path"));
  assert.ok(titles.includes("Compliance gap"));
});

test("risk register flags a narrow market scan when too few platforms are checked", () => {
  const base = createStateFixture();
  const state = ensureStateShape({
    ...base,
    project: {
      ...base.project,
      platformCoverage: {
        udemy: true
      }
    }
  });

  const titles = buildRiskRegister(state).map((risk) => risk.title);

  assert.ok(titles.includes("Platform scan is too narrow"));
});

test("risk register flags weak demand confirmation when too few signals are checked", () => {
  const base = createStateFixture();
  const state = ensureStateShape({
    ...base,
    project: {
      ...base.project,
      topicSignals: {
        "lots-of-courses": true
      }
    }
  });

  const titles = buildRiskRegister(state).map((risk) => risk.title);

  assert.ok(titles.includes("Opportunity signals are unconfirmed"));
});

test("studio health stays within a sensible range", () => {
  const health = getStudioHealth(createStateFixture());

  assert.ok(health.overall >= 0 && health.overall <= 100);
  assert.ok(health.marketProof > 0);
  assert.ok(health.safety > 0);
});

test("executive brief reflects the report and lead channel", () => {
  const brief = buildExecutiveBrief(createStateFixture());

  assert.match(brief, /AI Output Extraction System/);
  assert.match(brief, /Short-form video/);
  assert.match(brief, /4\/12 suggested learning platforms/);
  assert.match(brief, /3\/4 demand signals/);
});
