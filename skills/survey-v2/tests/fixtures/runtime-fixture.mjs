import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  applySurveyCommand,
  createSurveySession
} from "../../source/executables/runtime/lib/engine.mjs";
import { surveyRoot } from "./root.mjs";

let fixtureCounter = 0;

export function proposer(ref = "proposer-fixture") {
  return { role: "proposer", ref, assertionSource: "test-host" };
}

export function director(ref = "director-fixture") {
  return { role: "director", ref, assertionSource: "host-adapter:test" };
}

export function substrate() {
  return { role: "substrate", ref: "survey-v2-runtime", assertionSource: "test-host" };
}

export function host() {
  return { role: "host", ref: "survey-v2-runtime", assertionSource: "host-adapter:test" };
}

function question(id, round) {
  return {
    id,
    round,
    intentDimension: `dimension-${id}`,
    prompt: `Choose the intent posture for ${id}.`,
    options: [
      { id: "a", label: "Alpha", meaning: "alpha constraint" },
      { id: "b", label: "Beta", meaning: "beta constraint" },
      { id: "c", label: "Gamma", meaning: "gamma constraint" }
    ],
    optionRelationship: id === "Q1" ? "exclusive" : "composable",
    incompatibilities: [],
    designRationale: `This question discriminates ${id} intent.`,
    axisPreAnchors: { primary: ["quality"], secondary: ["speed"] },
    ...(round === 2 ? { round1Relation: "refines" } : {}),
    sourceEvidenceRefs: ["work-item"]
  };
}

export function instrumentDraft(round) {
  const start = round === 1 ? 1 : 4;
  return {
    revision: 1,
    questions: [0, 1, 2].map((offset) => question(`Q${start + offset}`, round)),
    orthogonalityRationale: "Each question covers one independently useful intent dimension."
  };
}

export function interpretationDraft(session, round) {
  return {
    revision: 1,
    responseDigest: round === 1
      ? session.interpretations.round1ResponseDigest
      : session.interpretations.round2ResponseDigest,
    ...(round === 2 ? { round1Digest: session.interpretations.round1Digest } : {}),
    items: [1, 2, 3].map((index) => ({
      questionId: `Q${round === 1 ? index : index + 3}`,
      meaning: `Interpreted meaning ${index}.`
    })),
    observedAxisMapping: {
      quality: `round-${round}`
    },
    tensions: [],
    anchors: [`round-${round}-anchor`],
    composite: `Round ${round} composite meaning.`
  };
}

export function envelopeModel(session) {
  const candidateInstrument = [
    ...session.interpretations.round1Instrument.questions,
    ...session.interpretations.round2Instrument.questions
  ];
  const candidateResponses = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]
    .map((id) => session.responses[id]);
  return {
    $schema: "urn:mission-kit:survey-v2:schema:envelope-model:v1",
    schemaVersion: "1.0.0",
    title: "Fixture intent",
    workItem: session.inputs.workItem,
    methodology: {
      name: "Survey v2",
      schemaVersion: "1.0.0",
      protocolDigest: session.protocol.digest,
      projectionDigest: session.package.projectionDigest
    },
    authority: {
      ...session.authority,
      ratificationAuthority: "director-only"
    },
    outcomeAxes: session.inputs.outcomeAxes,
    instrument: candidateInstrument,
    responses: candidateResponses,
    interpretations: {
      round1: session.interpretations.round1,
      round1Digest: session.interpretations.round1Digest,
      round2: session.interpretations.round2,
      round2Digest: session.interpretations.round2Digest,
      axisMapping: { quality: "primary", speed: "secondary" },
      anchors: ["quality"]
    },
    contradictions: [],
    tensions: [],
    compositeIntent: "Deliver a small coherent result with explicit quality evidence.",
    scope: ["intent capture"],
    antiGoals: ["implementation sequencing"],
    openDesignQuestions: ["Which design best realizes the captured constraints?"],
    dependencies: [{
      dependencyId: session.dependencies.plan[0],
      kind: "reference",
      repository: "apnex/mission-kit",
      selector: { kind: "subdirectory", path: "axioms" },
      applicability: "not-applicable",
      snapshotDigest: null,
      contributionRefs: [session.dependencies.outputs.initResolve.resultDigest]
    }],
    calibration: {
      stakeholderTimeCostMinutes: 6,
      comparisonBaseline: "unstructured intent interview",
      notes: "Fixture calibration evidence."
    },
    ratification: {
      authority: "director-only",
      status: "pending",
      eventId: null,
      semanticDigest: null,
      renderDigest: null
    },
    lifecycleHandoff: {
      from: "intent-open",
      to: "intent-captured",
      authorityRef: session.authority.directorRef,
      planningInputRef: "self"
    }
  };
}

export async function newRun() {
  fixtureCounter += 1;
  const sessionsRoot = await mkdtemp(path.join(os.tmpdir(), "survey-v2-runtime-"));
  const created = await createSurveySession(surveyRoot, {
    slug: `fixture-${fixtureCounter}`,
    sessionId: `run-${fixtureCounter}`,
    workItem: "Capture the intent for a fixture design.",
    outcomeAxes: ["quality", "speed"],
    directorRef: "director-fixture",
    proposerRef: "proposer-fixture",
    sessionsRoot,
    axiomCorpus: false
  });
  return {
    ...created,
    sessionsRoot,
    cleanup: () => rm(sessionsRoot, { recursive: true, force: true })
  };
}

export async function transition(run, {
  event,
  eventId,
  actor,
  payload = {},
  expectedRevision = run.session.revision
}) {
  const result = await applySurveyCommand(surveyRoot, run.runDirectory, {
    event,
    eventId,
    payload,
    expectedRevision
  }, actor);
  run.session = result.session;
  return result;
}

export async function reachAwaitingQ1(run) {
  await transition(run, {
    event: "BEGIN_R1_DESIGN",
    eventId: `${run.session.sessionId}:begin-r1`,
    actor: proposer()
  });
  await transition(run, {
    event: "SAVE_R1_INSTRUMENT_DRAFT",
    eventId: `${run.session.sessionId}:draft-r1`,
    actor: proposer(),
    payload: { draft: instrumentDraft(1) }
  });
  await transition(run, {
    event: "FREEZE_R1",
    eventId: `${run.session.sessionId}:freeze-r1`,
    actor: proposer()
  });
  await transition(run, {
    event: "PRESENT_Q1",
    eventId: `${run.session.sessionId}:present-q1`,
    actor: substrate()
  });
  return run;
}

export async function reachAwaitingRatification(
  run,
  { mutateComposite = (value) => value } = {}
) {
  await reachAwaitingQ1(run);
  for (const [questionId, responseEvent, presentEvent] of [
    ["Q1", "RESPOND_Q1", "PRESENT_Q2"],
    ["Q2", "RESPOND_Q2", "PRESENT_Q3"],
    ["Q3", "RESPOND_Q3", null]
  ]) {
    await transition(run, {
      event: responseEvent,
      eventId: `${run.session.sessionId}:respond-${questionId}`,
      actor: director(),
      payload: {
        raw: "a",
        questionId,
        acknowledgedViewDigest: run.session.outbox.digest
      }
    });
    if (presentEvent) {
      await transition(run, {
        event: presentEvent,
        eventId: `${run.session.sessionId}:present-${questionId}-next`,
        actor: substrate()
      });
    }
  }
  await transition(run, {
    event: "BEGIN_R1_INTERPRETATION",
    eventId: `${run.session.sessionId}:begin-r1-interpretation`,
    actor: proposer()
  });
  await transition(run, {
    event: "SAVE_R1_INTERPRETATION_DRAFT",
    eventId: `${run.session.sessionId}:save-r1-interpretation`,
    actor: proposer(),
    payload: { draft: interpretationDraft(run.session, 1) }
  });
  await transition(run, {
    event: "COMMIT_R1_INTERPRETATION",
    eventId: `${run.session.sessionId}:commit-r1-interpretation`,
    actor: proposer()
  });
  await transition(run, {
    event: "BEGIN_R2_DESIGN",
    eventId: `${run.session.sessionId}:begin-r2`,
    actor: proposer()
  });
  await transition(run, {
    event: "SAVE_R2_INSTRUMENT_DRAFT",
    eventId: `${run.session.sessionId}:save-r2-instrument`,
    actor: proposer(),
    payload: { draft: instrumentDraft(2) }
  });
  await transition(run, {
    event: "FREEZE_R2",
    eventId: `${run.session.sessionId}:freeze-r2`,
    actor: proposer()
  });
  await transition(run, {
    event: "PRESENT_Q4",
    eventId: `${run.session.sessionId}:present-Q4`,
    actor: substrate()
  });
  for (const [questionId, responseEvent, presentEvent] of [
    ["Q4", "RESPOND_Q4", "PRESENT_Q5"],
    ["Q5", "RESPOND_Q5", "PRESENT_Q6"],
    ["Q6", "RESPOND_Q6", null]
  ]) {
    await transition(run, {
      event: responseEvent,
      eventId: `${run.session.sessionId}:respond-${questionId}`,
      actor: director(),
      payload: {
        raw: "b",
        questionId,
        acknowledgedViewDigest: run.session.outbox.digest
      }
    });
    if (presentEvent) {
      await transition(run, {
        event: presentEvent,
        eventId: `${run.session.sessionId}:present-${questionId}-next`,
        actor: substrate()
      });
    }
  }
  await transition(run, {
    event: "BEGIN_R2_INTERPRETATION",
    eventId: `${run.session.sessionId}:begin-r2-interpretation`,
    actor: proposer()
  });
  await transition(run, {
    event: "SAVE_R2_INTERPRETATION_DRAFT",
    eventId: `${run.session.sessionId}:save-r2-interpretation`,
    actor: proposer(),
    payload: { draft: interpretationDraft(run.session, 2) }
  });
  await transition(run, {
    event: "COMMIT_R2_INTERPRETATION",
    eventId: `${run.session.sessionId}:commit-r2-interpretation`,
    actor: proposer()
  });
  await transition(run, {
    event: "BEGIN_COMPOSITE",
    eventId: `${run.session.sessionId}:begin-composite`,
    actor: proposer()
  });
  await transition(run, {
    event: "SAVE_COMPOSITE_DRAFT",
    eventId: `${run.session.sessionId}:save-composite`,
    actor: proposer(),
    payload: { draft: mutateComposite(envelopeModel(run.session)) }
  });
  await transition(run, {
    event: "COMMIT_CANDIDATE",
    eventId: `${run.session.sessionId}:commit-candidate`,
    actor: proposer()
  });
  const candidate = run.session.candidates[0];
  await transition(run, {
    event: "CANDIDATE_VALIDATION_PASS",
    eventId: `${run.session.sessionId}:validate-candidate`,
    actor: substrate(),
    payload: {
      validation: {
        passed: true,
        semanticDigest: candidate.semanticDigest,
        renderDigest: candidate.renderDigest,
        checks: ["schema", "contribution", "projection"].map((id) => ({ id, passed: true }))
      }
    }
  });
  await transition(run, {
    event: "START_WALKTHROUGH",
    eventId: `${run.session.sessionId}:start-walkthrough`,
    actor: substrate()
  });
  const walkthroughAdvanceCount =
    run.session.interpretations.walkthrough.segments.length - 1;
  for (let index = 0; index < walkthroughAdvanceCount; index += 1) {
    await transition(run, {
      event: "ACK_WALKTHROUGH_ADVANCE",
      eventId: `${run.session.sessionId}:walkthrough-${index}`,
      actor: director(),
      payload: {
        acknowledgedViewDigest: run.session.outbox.digest,
        candidateRevision: candidate.revision
      }
    });
  }
  await transition(run, {
    event: "ACK_WALKTHROUGH_COMPLETE",
    eventId: `${run.session.sessionId}:walkthrough-complete`,
    actor: director(),
    payload: {
      acknowledgedViewDigest: run.session.outbox.digest,
      candidateRevision: candidate.revision
    }
  });
  return run;
}
