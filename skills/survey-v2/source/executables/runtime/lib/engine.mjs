import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath
} from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  prettyJson,
  sha256Bytes,
  sha256Value,
  stableValue,
  withoutKey
} from "./canonical.mjs";
import {
  assertHandlerSurface,
  HANDLER_SURFACE
} from "./handler-surface.mjs";
import {
  DependencyError,
  captureReferenceSnapshot
} from "./dependency-snapshot.mjs";
import {
  appendAcceptedEvent,
  atomicWriteBytes,
  atomicWriteJson,
  ensureDirectoryNoFollow,
  readNoFollowBytes,
  readVerifiedSession,
  sealSession,
  verifySession,
  withSessionLockOptions,
  writeSession
} from "./storage.mjs";
import {
  attachRatificationEvidence,
  envelopeDigest,
  renderEnvelopeModel,
  walkthroughSegments
} from "./envelope.mjs";

export class ProtocolError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProtocolError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new ProtocolError(code, message);
}

async function readJson(target) {
  return JSON.parse(await readFile(target, "utf8"));
}

function actor(role, ref, assertionSource = "host-adapter:survey-v2-runtime") {
  return { role, ref, assertionSource };
}

function assertSafeIdentity(value, pattern, label) {
  if (typeof value !== "string" || !pattern.test(value)) fail("INVALID_ARGUMENT", `${label} is invalid`);
  return value;
}

function makePresentation(kind, body, candidateRevision = 0) {
  const withoutDigest = {
    $schema: "urn:mission-kit:survey-v2:schema:presentation:v1",
    kind,
    candidateRevision,
    ...body
  };
  return {
    ...withoutDigest,
    payloadDigest: sha256Value(withoutDigest)
  };
}

function instrumentWithoutDigest(instrument) {
  const copy = { ...instrument };
  delete copy.freezeDigest;
  return copy;
}

function normalizeInstrument(draft, round, boundRound1Digest = undefined) {
  const normalized = {
    ...draft,
    $schema: "urn:mission-kit:survey-v2:schema:instrument:v1",
    schemaVersion: "1.0.0",
    round,
    revision: draft?.revision ?? 1
  };
  if (round === 2) normalized.boundRound1Digest = boundRound1Digest;
  normalized.freezeDigest = sha256Value(instrumentWithoutDigest(normalized));
  return normalized;
}

function questionView(instrument, questionId) {
  const question = instrument.questions.find((item) => item.id === questionId);
  if (!question) fail("MISSING_QUESTION", `instrument has no ${questionId}`);
  return makePresentation("question", {
    questionId,
    prompt: question.prompt,
    options: question.options.map(({ id, label, meaning }) => ({ id, label, meaning })),
    responseSyntax: "Pick one or more option letters."
  });
}

function setOutbox(session, payload, transitionId) {
  session.outbox = {
    transitionId,
    digest: payload.payloadDigest,
    payload
  };
}

function appendAttempt(session, transitionId) {
  if (!session.outbox) fail("NO_CURRENT_VIEW", "no current payload is available");
  session.attempts.push({
    ordinal: session.attempts.length,
    transitionId,
    digest: session.outbox.digest,
    phase: session.phase
  });
}

function latest(array, label) {
  if (!Array.isArray(array) || array.length === 0) fail("MISSING_DRAFT", `${label} draft is absent`);
  return array[array.length - 1];
}

function normalizePicks(question, payload) {
  if (typeof payload.raw !== "string") fail("RJ01", "Director response must preserve one raw string");
  const raw = payload.raw.trim();
  if (!/^[a-d](?:\s*(?:,|\+|\/|\band\b|\s+)\s*[a-d])*$/i.test(raw)) {
    fail("RJ01", "response syntax must contain only option IDs separated by whitespace, comma, plus, slash, or 'and'");
  }
  const parsedRaw = raw
    .toLowerCase()
    .split(/\s*(?:,|\+|\/|\band\b|\s+)\s*/)
    .filter(Boolean);
  const selected = Array.isArray(payload.picks)
    ? payload.picks.map((item) => String(item).toLowerCase())
    : parsedRaw;
  if (
    selected.some((item) => !/^[a-d]$/.test(item)) ||
    sha256Value([...new Set(selected)].sort()) !== sha256Value([...new Set(parsedRaw)].sort())
  ) {
    fail("RJ01", "explicit picks must exactly match the option IDs in the raw response");
  }
  const optionOrder = question.options.map((option) => option.id);
  const normalizedPicks = [...new Set(selected)].sort((left, right) => optionOrder.indexOf(left) - optionOrder.indexOf(right));
  if (
    normalizedPicks.length === 0 ||
    normalizedPicks.some((pick) => !optionOrder.includes(pick))
  ) {
    fail("RJ01", "response must select one or more current-question option IDs");
  }
  const contradictions = [];
  if (question.optionRelationship === "exclusive" && normalizedPicks.length > 1) {
    contradictions.push({ kind: "exclusive-multi-pick", picks: normalizedPicks });
  }
  if (question.optionRelationship === "mixed") {
    for (const incompatible of question.incompatibilities) {
      if (incompatible.every((pick) => normalizedPicks.includes(pick))) {
        contradictions.push({ kind: "declared-incompatibility", picks: incompatible });
      }
    }
  }
  return {
    raw: payload.raw,
    normalizedPicks,
    contradictions,
    rationale: typeof payload.rationale === "string" ? payload.rationale : null
  };
}

function assertRecord(value, code, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code, message);
  return value;
}

function assertExactKeys(value, expected, code, message) {
  assertRecord(value, code, message);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (sha256Value(actual) !== sha256Value(wanted)) fail(code, message);
  return value;
}

function semanticEventPayload(payload) {
  const semantic = { ...payload };
  delete semantic.writerRecovery;
  delete semantic.trustedRuntimeEvidence;
  return semantic;
}

function validateInterpretationDraft(session, interpretation, round) {
  assertRecord(interpretation, "INTERPRETATION_SCHEMA", `Round-${round} interpretation must be an object`);
  const expectedResponseDigest = round === 1
    ? session.interpretations.round1ResponseDigest
    : session.interpretations.round2ResponseDigest;
  if (interpretation.responseDigest !== expectedResponseDigest) {
    fail("ANCESTRY_MISMATCH", `Round-${round} interpretation does not bind its response digest`);
  }
  if (
    !Array.isArray(interpretation.items) ||
    interpretation.items.length !== 3 ||
    !interpretation.items.every((item) => item && typeof item === "object") ||
    !interpretation.observedAxisMapping ||
    typeof interpretation.observedAxisMapping !== "object" ||
    !Array.isArray(interpretation.tensions) ||
    !Array.isArray(interpretation.anchors) ||
    typeof interpretation.composite !== "string" ||
    interpretation.composite.length === 0
  ) {
    fail(
      "INTERPRETATION_SCHEMA",
      `Round-${round} interpretation requires three items, observedAxisMapping, tensions, anchors, and composite`
    );
  }
  if (round === 2 && interpretation.round1Digest !== session.interpretations.round1Digest) {
    fail("ANCESTRY_MISMATCH", "Round-2 interpretation does not bind sealed Round-1 meaning");
  }
}

function validateHookOutput(output, hook, bindingDigest) {
  assertRecord(output, "DEPENDENCY_OUTPUT_INVALID", `${hook} output is absent`);
  if (
    output.hook !== hook ||
    output.complete !== true ||
    output.bindingDigest !== bindingDigest ||
    typeof output.resultDigest !== "string" ||
    output.resultDigest !== sha256Value(withoutKey(output, "resultDigest"))
  ) {
    fail("DEPENDENCY_OUTPUT_INVALID", `${hook} output is incomplete, unbound, or has a wrong result digest`);
  }
}

function dependencyApplicable(session) {
  return session.dependencies.outputs.initResolve?.applicability === "applicable";
}

function requireInterpretationHook(session, interpretation, round) {
  if (!dependencyApplicable(session)) return;
  const hook = round === 1 ? "commit-r1" : "commit-r2";
  const bindingDigest = round === 1
    ? sha256Value({
      responseDigest: session.interpretations.round1ResponseDigest,
      interpretation: withoutKey(interpretation, "dependencyOutput")
    })
    : sha256Value({
      round1Digest: session.interpretations.round1Digest,
      responseDigest: session.interpretations.round2ResponseDigest,
      interpretation: withoutKey(interpretation, "dependencyOutput")
    });
  validateHookOutput(interpretation.dependencyOutput, hook, bindingDigest);
}

function assertCurrentViewAcknowledgement(session, payload, candidateRevision) {
  if (
    !session.outbox ||
    payload.acknowledgedViewDigest !== session.outbox.digest ||
    payload.candidateRevision !== candidateRevision
  ) {
    fail("VIEW_ACK_MISMATCH", "acknowledgement must bind the exact current view and candidate revision");
  }
}

function authorityMatches(authorityId, commandActor, session) {
  if (!commandActor || typeof commandActor.ref !== "string") return false;
  switch (authorityId) {
    case "AU01":
      return commandActor.role === "proposer" && commandActor.ref === session.authority.proposerRef;
    case "AU02":
      return (
        commandActor.role === "director" &&
        commandActor.ref === session.authority.directorRef &&
        commandActor.assertionSource.startsWith("host-adapter:")
      );
    case "AU03":
      return commandActor.role === "substrate";
    case "AU04":
      return (
        (
          commandActor.role === "director" &&
          commandActor.ref === session.authority.directorRef &&
          commandActor.assertionSource.startsWith("host-adapter:")
        ) ||
        (commandActor.role === "proposer" && commandActor.ref === session.authority.proposerRef)
      );
    case "AU05":
      return commandActor.role === "host" && commandActor.assertionSource.startsWith("host-adapter:");
    default:
      return false;
  }
}

function transitionFor(protocol, session, event) {
  const phase = protocol.machines.find((machine) => machine.id === "phase");
  const runtime = protocol.machines.find((machine) => machine.id === "runtime");
  const directPhase = phase.transitions.find((transition) => transition.event === event);
  if (directPhase) return { machine: "phase", transition: directPhase };
  const directRuntime = runtime.transitions.find((transition) => transition.event === event);
  if (directRuntime) return { machine: "runtime", transition: directRuntime };
  const phaseFamily = phase.families.find((family) => family.event === event);
  if (phaseFamily) return { machine: "phase", transition: phaseFamily, family: true };
  const runtimeFamily = runtime.families.find((family) => family.event === event);
  if (runtimeFamily) return { machine: "runtime", transition: runtimeFamily, family: true };
  fail("UNKNOWN_EVENT", `event ${event} is not declared by the pinned protocol`);
}

function validateTransitionSource(protocol, session, selected) {
  const machine = protocol.machines.find((item) => item.id === selected.machine);
  const current = selected.machine === "phase" ? session.phase : session.runtimeStatus;
  if (selected.family) {
    const selector = machine.selectors.find((item) => item.id === selected.transition.fromSelector);
    if (!selector?.members.includes(current)) {
      fail("ILLEGAL_STATE", `${selected.transition.id} does not select current ${selected.machine} state ${current}`);
    }
    if (selected.transition.runtimeSelector) {
      const runtime = protocol.machines.find((item) => item.id === "runtime");
      const runtimeSelector = runtime.selectors.find((item) => item.id === selected.transition.runtimeSelector);
      if (!runtimeSelector?.members.includes(session.runtimeStatus)) {
        fail("ILLEGAL_PRODUCT_STATE", `${selected.transition.id} does not select runtime ${session.runtimeStatus}`);
      }
    }
  } else if (selected.transition.from !== current) {
    fail("ILLEGAL_STATE", `${selected.transition.id} requires ${selected.transition.from}, got ${current}`);
  }
  if (selected.machine === "phase" && !selected.family && session.runtimeStatus !== "active") {
    fail("ILLEGAL_PRODUCT_STATE", `${selected.transition.id} requires active runtime`);
  }
}

async function validateById(root, schemaId, value) {
  const validatorsPath = path.join(root, "generated", "validators.mjs");
  const validators = await import(pathToFileURL(validatorsPath).href);
  const result = validators.validateById(schemaId, value);
  if (!result.valid) fail("SCHEMA_INVALID", `${schemaId}: ${result.errors.join("; ")}`);
}

async function loadContext(root) {
  const protocol = await readJson(path.join(root, "source", "protocol", "survey.protocol.json"));
  const dependency = await readJson(path.join(root, "source", "dependencies", "references", "mission-kit-axioms.reference.json"));
  const projectionLock = await readJson(path.join(root, "generated", "projection-lock.json"));
  return { protocol, dependency, projectionLock };
}

function resolverAttempt(session, descriptor, registry, remediation = {}) {
  const binding = registry?.bindings?.[descriptor.resolution.bindingKey];
  const attempt = {
    attemptId: remediation.attemptId ?? `${session.sessionId}:binding:${session.dependencies.resolverAttempts.length + 1}`,
    kind: "host-registry",
    bindingKey: descriptor.resolution.bindingKey,
    repository: descriptor.source.repository,
    registryId: remediation.registryId ?? registry?.registryId ?? "host-registry",
    locatorEvidenceDigest: sha256Value(
      typeof binding?.root === "string"
        ? { kind: "host-path-observation", root: binding.root }
        : { kind: "missing-host-path-observation" }
    ),
    actorToolEvidence: "deterministic-runtime"
  };
  if (
    typeof attempt.attemptId !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/.test(attempt.attemptId) ||
    typeof attempt.registryId !== "string" ||
    attempt.registryId.length === 0
  ) {
    fail("REMEDIATION_INVALID", "resolver attempt identity and registry evidence must be safe strings");
  }
  return attempt;
}

function sealInitializationReceipt(session, descriptor, {
  applicability,
  snapshot,
  resolverAttemptId = null
}) {
  const receiptWithoutDigest = {
    receiptId: `${session.sessionId}:init-resolve:${session.dependencies.resolverReceipts.length + 1}`,
    dependencyId: descriptor.id,
    hook: "init-resolve",
    applicability,
    evaluatedFactsDigest: sha256Value({ axiomCorpus: session.inputs.axiomCorpus }),
    pendingInputDigest: session.inputs.pendingInputDigest,
    resolverAttemptId,
    remainingStages: applicability === "applicable"
      ? ["commit-r1", "commit-r2", "pre-candidate", "rehydrate"]
      : [],
    producedBy: "deterministic-runtime",
    ...(applicability === "applicable" ? { snapshot } : {})
  };
  const receipt = {
    ...receiptWithoutDigest,
    resultDigest: sha256Value(receiptWithoutDigest)
  };
  session.dependencies.resolverReceipts.push(receipt);
  return receipt;
}

function validateInitializationReceipt(session, receipt) {
  assertRecord(receipt, "INITIALIZATION_RECEIPT_INVALID", "initialization resolver receipt is absent");
  const expectedKeys = receipt.applicability === "applicable"
    ? [
      "receiptId",
      "dependencyId",
      "hook",
      "applicability",
      "evaluatedFactsDigest",
      "pendingInputDigest",
      "resolverAttemptId",
      "remainingStages",
      "producedBy",
      "snapshot",
      "resultDigest"
    ]
    : [
      "receiptId",
      "dependencyId",
      "hook",
      "applicability",
      "evaluatedFactsDigest",
      "pendingInputDigest",
      "resolverAttemptId",
      "remainingStages",
      "producedBy",
      "resultDigest"
    ];
  assertExactKeys(
    receipt,
    expectedKeys,
    "INITIALIZATION_RECEIPT_INVALID",
    "initialization resolver receipt has an unknown, missing, or inapplicable field"
  );
  const expectedStages = receipt.applicability === "applicable"
    ? ["commit-r1", "commit-r2", "pre-candidate", "rehydrate"]
    : [];
  if (
    !["applicable", "not-applicable"].includes(receipt.applicability) ||
    receipt.dependencyId !== session.dependencies.plan[0] ||
    receipt.hook !== "init-resolve" ||
    receipt.evaluatedFactsDigest !== sha256Value({ axiomCorpus: session.inputs.axiomCorpus }) ||
    receipt.pendingInputDigest !== session.inputs.pendingInputDigest ||
    receipt.producedBy !== "deterministic-runtime" ||
    sha256Value(receipt.remainingStages) !== sha256Value(expectedStages) ||
    receipt.resultDigest !== sha256Value(withoutKey(receipt, "resultDigest"))
  ) {
    fail("INITIALIZATION_RECEIPT_INVALID", "initialization resolver receipt is unbound, incomplete, or has an invalid digest");
  }
  if (receipt.applicability === "applicable") validateDependencySnapshot(receipt.snapshot);
  return receipt;
}

async function resolveInitializationReceipt(session, descriptor, registry, remediation = {}) {
  const attempt = resolverAttempt(session, descriptor, registry, remediation);
  session.dependencies.resolverAttempts.push(attempt);
  try {
    const snapshot = await captureReferenceSnapshot(descriptor, registry);
    return {
      attempt,
      receipt: sealInitializationReceipt(session, descriptor, {
        applicability: "applicable",
        snapshot,
        resolverAttemptId: attempt.attemptId
      }),
      failure: null
    };
  } catch (error) {
    if (!(error instanceof DependencyError)) throw error;
    return {
      attempt,
      receipt: null,
      failure: {
        code: error.code,
        message: error.message,
        terminal: error.terminal
      }
    };
  }
}

function candidateCurrent(session) {
  const candidates = session.candidates.filter((candidate) => !candidate.superseded);
  if (candidates.length !== 1) fail("CANDIDATE_CARDINALITY", `expected one current candidate, got ${candidates.length}`);
  return candidates[0];
}

const clearOutbox = async ({ session }) => {
  session.outbox = null;
};

const recordPresentationAttempt = async ({ session, transition }) => {
  appendAttempt(session, transition.id);
};

function acceptQuestionResponse(nextQuestionId, completedRound) {
  return async ({ session, transition, payload, commandEventId }) => {
    if (!session.outbox?.payload || session.outbox.payload.kind !== "question") {
      fail("NO_CURRENT_QUESTION", "response has no current question view");
    }
    const questionId = session.outbox.payload.questionId;
    if (
      payload.questionId !== questionId ||
      payload.acknowledgedViewDigest !== session.outbox.digest
    ) {
      fail("RJ01", "response must acknowledge the exact current question ID and presentation digest");
    }
    const instrument = Number(questionId.slice(1)) <= 3
      ? session.interpretations.round1Instrument
      : session.interpretations.round2Instrument;
    const question = instrument?.questions.find((item) => item.id === questionId);
    if (!question) fail("NO_CURRENT_QUESTION", "current question is absent from the frozen instrument");
    const response = normalizePicks(question, payload);
    session.responses[questionId] = {
      questionId,
      ...response,
      eventId: commandEventId,
      acknowledgedViewDigest: session.outbox.digest
    };
    if (nextQuestionId) {
      setOutbox(session, questionView(instrument, nextQuestionId), transition.id);
    } else {
      session.outbox = null;
    }
    if (completedRound === 1) {
      session.interpretations.round1ResponseDigest = sha256Value(
        ["Q1", "Q2", "Q3"].map((id) => session.responses[id])
      );
    } else if (completedRound === 2) {
      session.interpretations.round2ResponseDigest = sha256Value(
        ["Q4", "Q5", "Q6"].map((id) => session.responses[id])
      );
    }
  };
}

const phaseHandlerRegistry = Object.freeze({
  "A01/M01": clearOutbox,
  "A02/M02": clearOutbox,
  "A03/M03": async ({ root, session, transition }) => {
    const instrument = latest(session.drafts.round1Instruments, "Round-1 instrument");
    await validateById(root, "urn:mission-kit:survey-v2:schema:instrument:v1", instrument);
    const ids = instrument.questions.map((question) => question.id).join(",");
    const dimensions = new Set(instrument.questions.map((question) => question.intentDimension));
    if (instrument.round !== 1 || ids !== "Q1,Q2,Q3" || dimensions.size !== 3) {
      fail("INSTRUMENT_GEOMETRY", "Round 1 must contain Q1,Q2,Q3 in order with three distinct intent dimensions");
    }
    session.interpretations.round1Instrument = instrument;
    setOutbox(session, questionView(instrument, "Q1"), transition.id);
  },
  "A04/M04": async ({ session }) => {
    if (session.attempts.some((attempt) => attempt.phase === "round_1_q1_ready")) {
      fail("DISCLOSURE_ALREADY_ATTEMPTED", "Round 1 cannot reopen after a Q1 attempt");
    }
    session.interpretations.round1Instrument = null;
    session.outbox = null;
  },
  "A05/M05": recordPresentationAttempt,
  "A06/M06": acceptQuestionResponse("Q2", null),
  "A07/M07": recordPresentationAttempt,
  "A08/M08": acceptQuestionResponse("Q3", null),
  "A09/M09": recordPresentationAttempt,
  "A10/M10": acceptQuestionResponse(null, 1),
  "A11/M11": clearOutbox,
  "A12/M12": async ({ session }) => {
    const interpretation = latest(session.drafts.round1Interpretations, "Round-1 interpretation");
    validateInterpretationDraft(session, interpretation, 1);
    requireInterpretationHook(session, interpretation, 1);
    session.interpretations.round1 = interpretation;
    session.interpretations.round1Digest = sha256Value(interpretation);
    if (dependencyApplicable(session)) {
      session.dependencies.outputs.commitR1 = interpretation.dependencyOutput;
    }
  },
  "A13/M13": clearOutbox,
  "A14/M14": async ({ root, session, transition }) => {
    const instrument = latest(session.drafts.round2Instruments, "Round-2 instrument");
    await validateById(root, "urn:mission-kit:survey-v2:schema:instrument:v1", instrument);
    const ids = instrument.questions.map((question) => question.id).join(",");
    const dimensions = new Set(instrument.questions.map((question) => question.intentDimension));
    if (
      instrument.round !== 2 ||
      ids !== "Q4,Q5,Q6" ||
      dimensions.size !== 3 ||
      instrument.boundRound1Digest !== session.interpretations.round1Digest
    ) {
      fail("INSTRUMENT_GEOMETRY", "Round 2 must contain Q4,Q5,Q6 with three distinct intent dimensions and bind sealed Round 1");
    }
    session.interpretations.round2Instrument = instrument;
    setOutbox(session, questionView(instrument, "Q4"), transition.id);
  },
  "A15/M15": async ({ session }) => {
    if (session.attempts.some((attempt) => attempt.phase === "round_2_q4_ready")) {
      fail("DISCLOSURE_ALREADY_ATTEMPTED", "Round 2 cannot reopen after a Q4 attempt");
    }
    session.interpretations.round2Instrument = null;
    session.outbox = null;
  },
  "A16/M16": recordPresentationAttempt,
  "A17/M17": acceptQuestionResponse("Q5", null),
  "A18/M18": recordPresentationAttempt,
  "A19/M19": acceptQuestionResponse("Q6", null),
  "A20/M20": recordPresentationAttempt,
  "A21/M21": acceptQuestionResponse(null, 2),
  "A22/M22": clearOutbox,
  "A23/M23": async ({ session }) => {
    const interpretation = latest(session.drafts.round2Interpretations, "Round-2 interpretation");
    validateInterpretationDraft(session, interpretation, 2);
    requireInterpretationHook(session, interpretation, 2);
    session.interpretations.round2 = interpretation;
    session.interpretations.round2Digest = sha256Value(interpretation);
    if (dependencyApplicable(session)) {
      session.dependencies.outputs.commitR2 = interpretation.dependencyOutput;
    }
  },
  "A24/M24": clearOutbox,
  "A25/M25": async ({ root, session, payload }) => {
    const model = latest(session.drafts.composites, "composite");
    await validateById(root, "urn:mission-kit:survey-v2:schema:envelope-model:v1", model);
    const context = await loadContext(root);
    const instrument = [
      ...session.interpretations.round1Instrument.questions,
      ...session.interpretations.round2Instrument.questions
    ];
    const responses = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"].map((id) => session.responses[id]);
    const expectedMethodology = {
      name: "Survey v2",
      schemaVersion: "1.0.0",
      protocolDigest: session.protocol.digest,
      projectionDigest: session.package.projectionDigest
    };
    const expectedAuthority = {
      ...session.authority,
      ratificationAuthority: "director-only"
    };
    const expectedHandoff = {
      from: "intent-open",
      to: "intent-captured",
      authorityRef: session.authority.directorRef,
      planningInputRef: "self"
    };
    if (
      model.workItem !== session.inputs.workItem ||
      sha256Value(model.outcomeAxes) !== sha256Value(session.inputs.outcomeAxes) ||
      sha256Value(model.methodology) !== sha256Value(expectedMethodology) ||
      sha256Value(model.authority) !== sha256Value(expectedAuthority) ||
      sha256Value(model.lifecycleHandoff) !== sha256Value(expectedHandoff) ||
      sha256Value(model.instrument) !== sha256Value(instrument) ||
      sha256Value(model.responses) !== sha256Value(responses) ||
      model.interpretations.round1Digest !== session.interpretations.round1Digest ||
      model.interpretations.round2Digest !== session.interpretations.round2Digest ||
      sha256Value(model.interpretations.round1) !== session.interpretations.round1Digest ||
      sha256Value(model.interpretations.round2) !== session.interpretations.round2Digest ||
      model.ratification.authority !== "director-only" ||
      model.ratification.status !== "pending" ||
      model.ratification.eventId !== null ||
      model.ratification.semanticDigest !== null ||
      model.ratification.renderDigest !== null
    ) {
      fail(
        "CANDIDATE_ANCESTRY",
        "candidate must contain exact intent ancestry and an unclaimed Director ratification target"
      );
    }
    if (dependencyApplicable(session)) {
      const bindingDigest = sha256Value({
        modelDigest: sha256Value(model),
        round1Digest: session.interpretations.round1Digest,
        round2Digest: session.interpretations.round2Digest
      });
      validateHookOutput(payload.dependencyOutput, "pre-candidate", bindingDigest);
      const expectedPaths = session.dependencies.outputs.initResolve.snapshot.inventory.map((item) => item.path).sort();
      const decidedPaths = (payload.dependencyOutput.decisions ?? []).map((item) => item.path).sort();
      if (sha256Value(decidedPaths) !== sha256Value(expectedPaths)) {
        fail("DEPENDENCY_MAPPING_INCOMPLETE", "pre-candidate output must decide every frozen snapshot member exactly once");
      }
      session.dependencies.outputs.preCandidate = payload.dependencyOutput;
    }
    const initialization = session.dependencies.outputs.initResolve;
    const expectedDependency = {
      dependencyId: context.dependency.id,
      kind: context.dependency.kind,
      repository: context.dependency.source.repository,
      selector: context.dependency.selector,
      applicability: initialization.applicability,
      snapshotDigest: initialization.applicability === "applicable"
        ? initialization.snapshot.aggregateDigest
        : null,
      contributionRefs: [
        initialization,
        session.dependencies.outputs.commitR1,
        session.dependencies.outputs.commitR2,
        session.dependencies.outputs.preCandidate
      ].filter(Boolean).map((output) => output.resultDigest)
    };
    if (
      model.dependencies.length !== 1 ||
      sha256Value(model.dependencies[0]) !== sha256Value(expectedDependency)
    ) {
      fail(
        "DEPENDENCY_MAPPING_INCOMPLETE",
        "candidate dependency evidence must exactly project the sealed resolution and hook contributions"
      );
    }
    const renderedBytes = renderEnvelopeModel(model);
    session.candidates.push({
      revision: session.candidates.length + 1,
      model,
      semanticDigest: sha256Value(model),
      renderDigest: sha256Bytes(Buffer.from(renderedBytes, "utf8")),
      renderedBytes,
      superseded: false
    });
  },
  "A26/M26": async ({ session, transition, payload }) => {
    const candidate = candidateCurrent(session);
    const validation = assertRecord(payload.validation, "CANDIDATE_VALIDATION_REQUIRED", "candidate validation evidence is absent");
    const requiredChecks = ["schema", "contribution", "projection"];
    if (
      validation.passed !== true ||
      validation.semanticDigest !== candidate.semanticDigest ||
      validation.renderDigest !== candidate.renderDigest ||
      !Array.isArray(validation.checks) ||
      !requiredChecks.every((id) => validation.checks.some((check) => check.id === id && check.passed === true))
    ) {
      fail("CANDIDATE_VALIDATION_FAILED", "T26 requires passing digest-bound mechanical checks");
    }
    session.interpretations.candidateValidation = validation;
    const segments = walkthroughSegments(candidate.model);
    session.interpretations.walkthrough = {
      candidateRevision: candidate.revision,
      segments,
      index: 0,
      acknowledgements: []
    };
    setOutbox(session, makePresentation("walkthrough", {
      segment: segments[0].content,
      index: 0,
      total: segments.length
    }, candidate.revision), transition.id);
  },
  "A27/M27": async ({ session, payload }) => {
    if (payload.validation?.passed !== false || !Array.isArray(payload.validation?.diagnostics) || payload.validation.diagnostics.length === 0) {
      fail("CANDIDATE_FAILURE_EVIDENCE", "T27 requires a failed validation with diagnostics");
    }
    session.feedback.push({ kind: "candidate-validation", diagnostics: payload.validation.diagnostics });
    candidateCurrent(session).superseded = true;
    session.outbox = null;
  },
  "A28/M28": recordPresentationAttempt,
  "A29/M29": async ({ session, transition, payload, commandEventId }) => {
    const walkthrough = session.interpretations.walkthrough;
    if (!walkthrough || walkthrough.index >= walkthrough.segments.length - 1) {
      fail("WALKTHROUGH_COMPLETE", "no later walkthrough segment remains");
    }
    assertCurrentViewAcknowledgement(session, payload, walkthrough.candidateRevision);
    walkthrough.acknowledgements.push({
      index: walkthrough.index,
      digest: session.outbox.digest,
      eventId: commandEventId
    });
    walkthrough.index += 1;
    setOutbox(session, makePresentation("walkthrough", {
      segment: walkthrough.segments[walkthrough.index].content,
      index: walkthrough.index,
      total: walkthrough.segments.length
    }, walkthrough.candidateRevision), transition.id);
    appendAttempt(session, transition.id);
  },
  "A30/M30": async ({ session, transition, payload, commandEventId }) => {
    const candidate = candidateCurrent(session);
    const walkthrough = session.interpretations.walkthrough;
    if (!walkthrough || walkthrough.index !== walkthrough.segments.length - 1) {
      fail("WALKTHROUGH_INCOMPLETE", "current segment is not the final required segment");
    }
    assertCurrentViewAcknowledgement(session, payload, walkthrough.candidateRevision);
    walkthrough.acknowledgements.push({
      index: walkthrough.index,
      digest: session.outbox.digest,
      eventId: commandEventId
    });
    setOutbox(session, makePresentation("ratification", {
      semanticDigest: candidate.semanticDigest,
      renderDigest: candidate.renderDigest,
      prompt: "Ratify this exact reviewed intent candidate, or return it with correction or withholding. Finalization appends only the mechanical event and candidate-digest attestation."
    }, candidate.revision), transition.id);
    appendAttempt(session, transition.id);
  },
  "A31/M31": async ({ session, payload, commandEventId }) => {
    const candidate = candidateCurrent(session);
    if (
      payload.semanticDigest !== candidate.semanticDigest ||
      payload.renderDigest !== candidate.renderDigest ||
      payload.acknowledgedViewDigest !== session.outbox?.digest
    ) {
      fail("RATIFICATION_DIGEST_MISMATCH", "ratification must bind both candidate digests and the exact current view");
    }
    session.ratification = {
      candidateRevision: candidate.revision,
      semanticDigest: candidate.semanticDigest,
      renderDigest: candidate.renderDigest,
      eventId: commandEventId,
      directorRef: session.authority.directorRef
    };
    session.outbox = null;
  },
  "A32/M32": async ({ session, transition, payload, commandEventId }) => {
    if (
      typeof payload.feedback !== "string" ||
      payload.feedback.length === 0 ||
      !["correction", "withholding"].includes(payload.kind)
    ) {
      fail("RETURN_CLASS_INVALID", "Director return requires non-empty feedback and correction or withholding kind");
    }
    session.feedback.push({ kind: payload.kind, text: payload.feedback, eventId: commandEventId });
    setOutbox(session, makePresentation("clarification", {
      prompt: "Clarify the requested correction, withdraw pure withholding unchanged, or abort."
    }, candidateCurrent(session).revision), transition.id);
    appendAttempt(session, transition.id);
  },
  "A33/M33": async ({ session, payload }) => {
    if (payload.correctionClass !== "composite-owned") {
      fail("CORRECTION_CLASS_MISMATCH", "T33 requires proposer attestation of composite-owned correction");
    }
    candidateCurrent(session).superseded = true;
    session.ratification = null;
    session.outbox = null;
  },
  "A34/M34": async ({ root, session }) => {
    const candidate = candidateCurrent(session);
    if (
      !session.ratification ||
      session.ratification.semanticDigest !== candidate.semanticDigest ||
      session.ratification.renderDigest !== candidate.renderDigest ||
      session.ratification.directorRef !== candidate.model.authority.directorRef
    ) {
      fail("RATIFICATION_ANCESTRY", "finalization requires exact current candidate ratification");
    }
    const terminalModel = attachRatificationEvidence(candidate.model, session.ratification);
    await validateById(root, "urn:mission-kit:survey-v2:schema:envelope-model:v1", terminalModel);
    const terminalBytes = renderEnvelopeModel(terminalModel);
    session.finalization = {
      candidateRevision: candidate.revision,
      bytes: terminalBytes,
      digest: sha256Bytes(Buffer.from(terminalBytes, "utf8")),
      targetPath: `${session.slug}-survey.md`,
      validation: "pending"
    };
  },
  "A35/M35": async ({ session, commandEventId }) => {
    const candidate = candidateCurrent(session);
    const terminalModel = attachRatificationEvidence(candidate.model, session.ratification);
    const terminalBytes = renderEnvelopeModel(terminalModel);
    if (
      !session.finalization ||
      sha256Bytes(Buffer.from(session.finalization.bytes, "utf8")) !== session.finalization.digest ||
      terminalBytes !== session.finalization.bytes ||
      envelopeDigest(terminalModel) !== session.finalization.digest ||
      session.ratification.semanticDigest !== candidate.semanticDigest ||
      session.ratification.renderDigest !== candidate.renderDigest
    ) {
      fail("FINALIZATION_MISMATCH", "terminal bytes do not match ratified model");
    }
    session.finalization.validation = "passed";
    session.finalization.handoff = {
      path: session.finalization.targetPath,
      digest: session.finalization.digest,
      terminalEventId: commandEventId
    };
    session.runtimeStatus = "closed";
    session.outbox = null;
  },
  "A36/M36": async ({ session, payload }) => {
    const candidate = candidateCurrent(session);
    if (
      payload.transient !== true ||
      payload.semanticDigest !== candidate.semanticDigest ||
      payload.renderDigest !== candidate.renderDigest ||
      !Array.isArray(payload.diagnostics)
    ) {
      fail("FINALIZATION_FAILURE_CLASS", "retryable failure must be transient and preserve both candidate digests");
    }
    session.feedback.push({ kind: "finalization-retryable", diagnostics: payload.diagnostics });
  },
  "A37/M37": async ({ session, payload }) => {
    if (payload.correctionClass !== "r2-derived") {
      fail("CORRECTION_CLASS_MISMATCH", "T37 requires proposer attestation of R2-derived correction");
    }
    if (session.candidates.some((candidate) => !candidate.superseded)) candidateCurrent(session).superseded = true;
    session.interpretations.round2 = null;
    session.interpretations.round2Digest = null;
    session.ratification = null;
    session.outbox = null;
  },
  "A38/M38": async ({ session, payload }) => {
    if (payload.earliestInvalidAncestor !== "candidate") {
      fail("INVALID_ANCESTOR_CLASS", "T38 requires mechanical evidence that the candidate is the earliest invalid ancestor");
    }
    candidateCurrent(session).superseded = true;
    session.ratification = null;
    session.finalization = null;
    session.outbox = null;
  },
  "A39/M39": async ({ session, payload, commandEventId }) => {
    if (typeof payload.feedback !== "string" || payload.feedback.length === 0) {
      fail("EMPTY_FEEDBACK", "clarification is empty");
    }
    session.feedback.push({ kind: "clarification", text: payload.feedback, eventId: commandEventId });
  },
  "A40/M40": async ({ session, payload }) => {
    if (payload.earliestInvalidAncestor !== "round-2-interpretation") {
      fail("INVALID_ANCESTOR_CLASS", "T40 requires mechanical evidence that R2 meaning is the earliest invalid ancestor");
    }
    candidateCurrent(session).superseded = true;
    session.interpretations.round2 = null;
    session.interpretations.round2Digest = null;
    session.ratification = null;
    session.finalization = null;
    session.outbox = null;
  },
  "A41/M41": async ({ session, payload }) => {
    assertExactKeys(
      semanticEventPayload(payload),
      ["resolverReceiptId"],
      "INITIALIZATION_COMMAND_INVALID",
      "T41 accepts only one previously sealed resolver receipt ID"
    );
    const receipt = session.dependencies.resolverReceipts.find((item) => item.receiptId === payload.resolverReceiptId);
    const latestReceipt = session.dependencies.resolverReceipts.at(-1);
    if (!receipt || receipt !== latestReceipt || session.dependencies.outputs.initResolve) {
      fail("INITIALIZATION_INCOMPLETE", "T41 requires the latest unconsumed sealed resolver receipt");
    }
    validateInitializationReceipt(session, receipt);
    session.dependencies.outputs.initResolve = receipt;
    payload.trustedRuntimeEvidence = { initializationReceipt: receipt };
  },
  "A42/M42": async ({ root, session, payload }) => {
    const normalized = normalizeInstrument(payload.draft, 1);
    await validateById(root, "urn:mission-kit:survey-v2:schema:instrument:v1", normalized);
    session.drafts.round1Instruments.push(normalized);
    session.drafts.current.round1Instrument = normalized.freezeDigest;
  },
  "A43/M43": async ({ session, payload }) => {
    validateInterpretationDraft(session, payload.draft, 1);
    session.drafts.round1Interpretations.push(payload.draft);
    session.drafts.current.round1Interpretation = sha256Value(payload.draft);
  },
  "A44/M44": async ({ root, session, payload }) => {
    const normalized = normalizeInstrument(payload.draft, 2, session.interpretations.round1Digest);
    await validateById(root, "urn:mission-kit:survey-v2:schema:instrument:v1", normalized);
    session.drafts.round2Instruments.push(normalized);
    session.drafts.current.round2Instrument = normalized.freezeDigest;
  },
  "A45/M45": async ({ session, payload }) => {
    validateInterpretationDraft(session, payload.draft, 2);
    session.drafts.round2Interpretations.push(payload.draft);
    session.drafts.current.round2Interpretation = sha256Value(payload.draft);
  },
  "A46/M46": async ({ root, session, payload }) => {
    await validateById(root, "urn:mission-kit:survey-v2:schema:envelope-model:v1", payload.draft);
    session.drafts.composites.push(payload.draft);
    session.drafts.current.composite = sha256Value(payload.draft);
  },
  "A47/M47": async ({ session, transition, payload }) => {
    const candidate = candidateCurrent(session);
    const lastReturn = [...session.feedback].reverse().find((item) => ["withholding", "correction"].includes(item.kind));
    if (
      lastReturn?.kind !== "withholding" ||
      payload.withdrawal !== "pure-withholding" ||
      payload.semanticDigest !== candidate.semanticDigest ||
      payload.renderDigest !== candidate.renderDigest
    ) {
      fail("WITHHOLDING_WITHDRAWAL_INVALID", "T47 requires pure withholding and unchanged candidate bytes");
    }
    setOutbox(session, makePresentation("ratification", {
      semanticDigest: candidate.semanticDigest,
      renderDigest: candidate.renderDigest,
      prompt: "Ratify this exact unchanged reviewed intent candidate, or return it. Finalization appends only the mechanical event and candidate-digest attestation."
    }, candidate.revision), transition.id);
    appendAttempt(session, transition.id);
  },
  "AF01/MF01": async ({ session }) => {
    session.runtimeStatus = "closed";
    session.outbox = null;
    session.blockReason = null;
  },
  "AF02/MF02": async ({ session, transition }) => {
    if (!session.outbox?.payload) fail("NO_CURRENT_VIEW", "no exact current view is available to re-emit");
    appendAttempt(session, transition.id);
  }
});

function implementationKey(transition) {
  return `${transition.action}/${transition.mutation}`;
}

async function applyPhaseSemantics(root, runDirectory, session, transition, payload, commandEventId) {
  const handler = phaseHandlerRegistry[implementationKey(transition)];
  if (!handler) {
    fail("UNIMPLEMENTED_TRANSITION", `phase action/mutation ${implementationKey(transition)} has no registered implementation`);
  }
  await handler({ root, runDirectory, session, transition, payload, commandEventId });
}

function blockRuntime(session, transition, payload) {
  session.runtimeStatus = transition.to;
  session.blockReason = {
    transitionId: transition.id,
    code: payload.code ?? "UNSPECIFIED",
    evidence: Array.isArray(payload.evidence) ? payload.evidence : []
  };
}

function validateDependencySnapshot(snapshot) {
  assertRecord(snapshot, "SNAPSHOT_INVALID", "applicable dependency snapshot is absent");
  if (!Array.isArray(snapshot.inventory)) fail("SNAPSHOT_INVALID", "snapshot inventory is absent");
  let totalBytes = 0;
  const inventoryRecords = [];
  for (const item of snapshot.inventory) {
    const bytes = item.contentEncoding === "base64"
      ? Buffer.from(item.content, "base64")
      : Buffer.from(item.content, "utf8");
    if (bytes.length !== item.byteLength || sha256Bytes(bytes) !== item.digest) {
      fail("SNAPSHOT_INVALID", `frozen dependency item is corrupt: ${item.path}`);
    }
    totalBytes += bytes.length;
    inventoryRecords.push({
      path: item.path,
      type: item.type,
      mode: item.mode,
      byteLength: item.byteLength,
      digest: item.digest
    });
  }
  if (
    totalBytes !== snapshot.totalBytes ||
    snapshot.fileCount !== snapshot.inventory.length ||
    sha256Value(inventoryRecords) !== snapshot.inventoryDigest ||
    sha256Value(snapshot.inventory) !== snapshot.aggregateDigest
  ) {
    fail("SNAPSHOT_INVALID", "frozen dependency aggregate or inventory digest is invalid");
  }
}

function validateFrozenDependencySnapshot(session) {
  if (!dependencyApplicable(session)) return;
  validateDependencySnapshot(session.dependencies.outputs.initResolve?.snapshot);
  for (const output of Object.values(session.dependencies.outputs)) {
    if (output && typeof output === "object" && typeof output.resultDigest === "string") {
      if (output.resultDigest !== sha256Value(withoutKey(output, "resultDigest"))) {
        fail("DEPENDENCY_OUTPUT_INVALID", "stored dependency output digest is invalid");
      }
    }
  }
}

const runtimeHandlerRegistry = Object.freeze({
  "RA01/RM01": async ({ session, internal }) => {
    if (!internal) fail("COUPLED_ONLY", "RT01 is committed only while creating a new session");
    session.runtimeStatus = "rehydrating";
  },
  "RA02/RM02": async ({ session }) => {
    session.runtimeStatus = "rehydrating";
  },
  "RA03/RM03": async ({ session }) => {
    session.runtimeStatus = "rehydrating";
  },
  "RA04/RM04": async ({ session }) => {
    session.runtimeStatus = "rehydrating";
  },
  "RA05/RM05": async ({ root, session, payload, operationalContext }) => {
    assertExactKeys(
      semanticEventPayload(payload),
      ["remediation"],
      "REMEDIATION_INVALID",
      "retry accepts only typed non-semantic remediation evidence"
    );
    assertExactKeys(
      payload.remediation,
      ["type", "attemptId", "registryId", "dependencyId"],
      "REMEDIATION_INVALID",
      "retry remediation has an unknown or missing field"
    );
    if (
      payload.remediation.type !== "host-registry-rebind" ||
      payload.remediation.dependencyId !== session.dependencies.plan[0]
    ) {
      fail("REMEDIATION_INVALID", "retry remediation must rebind the declared dependency only");
    }
    if (session.phase !== "initializing" || session.dependencies.outputs.initResolve) {
      fail("REMEDIATION_SCOPE", "initialization resolver retry is legal only before T41 seals initialization");
    }
    const context = await loadContext(root);
    const result = await resolveInitializationReceipt(
      session,
      context.dependency,
      operationalContext.registry,
      payload.remediation
    );
    payload.trustedRuntimeEvidence = {
      resolverAttempt: result.attempt,
      ...(result.receipt ? { resolverReceipt: result.receipt } : { resolverFailure: result.failure })
    };
    session.runtimeStatus = "rehydrating";
  },
  "RA06/RM06": async ({ session, payload }) => {
    validateFrozenDependencySnapshot(session);
    const pendingReceipt = session.phase === "initializing" && !session.dependencies.outputs.initResolve
      ? session.dependencies.resolverReceipts.at(-1) ?? null
      : null;
    if (pendingReceipt) validateInitializationReceipt(session, pendingReceipt);
    const initResolve = session.dependencies.outputs.initResolve;
    const proofWithoutDigest = {
      hook: "rehydrate",
      phase: session.phase,
      pendingInputDigest: session.inputs.pendingInputDigest,
      initializationResultDigest: initResolve?.resultDigest ?? pendingReceipt?.resultDigest ?? null,
      frozenSnapshotDigest: initResolve?.snapshot?.aggregateDigest ?? pendingReceipt?.snapshot?.aggregateDigest ?? null,
      previousEventDigest: session.events.at(-1)?.digest ?? null,
      complete: true,
      producedBy: "deterministic-runtime"
    };
    const proof = {
      ...proofWithoutDigest,
      resultDigest: sha256Value(proofWithoutDigest)
    };
    session.dependencies.rehydrationOutputs.push(proof);
    payload.trustedRuntimeEvidence = { rehydrationOutput: proof };
    session.runtimeStatus = "active";
    session.blockReason = null;
  },
  "RA07/RM07": async ({ session, transition, payload }) => blockRuntime(session, transition, payload),
  "RA08/RM08": async ({ session, transition, payload }) => blockRuntime(session, transition, payload),
  "RA09/RM09": async ({ session }) => {
    session.runtimeStatus = "suspended";
  },
  "RA10/RM10": async ({ session, transition, payload }) => blockRuntime(session, transition, payload),
  "RA11/RM11": async ({ session, transition, payload }) => blockRuntime(session, transition, payload),
  "RA12/RM12": async () => fail("COUPLED_ONLY", "RT12 is committed only with T35"),
  "RA13/RM13": async ({ session, transition, payload }) => blockRuntime(session, transition, payload),
  "RAF01/RMF01": async () => fail("COUPLED_ONLY", "RF01 is committed only with TF01")
});

async function applyRuntimeSemantics(
  root,
  session,
  transition,
  payload,
  { internal = false, operationalContext = {} } = {}
) {
  const handler = runtimeHandlerRegistry[implementationKey(transition)];
  if (!handler) {
    fail("UNIMPLEMENTED_TRANSITION", `runtime action/mutation ${implementationKey(transition)} has no registered implementation`);
  }
  await handler({ root, session, transition, payload, internal, operationalContext });
}

const IMPLEMENTATION_SURFACE = Object.freeze({
  phase: Object.freeze(Object.keys(phaseHandlerRegistry).sort()),
  runtime: Object.freeze(Object.keys(runtimeHandlerRegistry).sort())
});
assertHandlerSurface(IMPLEMENTATION_SURFACE);
export { IMPLEMENTATION_SURFACE };

async function validateSession(root, session) {
  await validateById(root, "urn:mission-kit:survey-v2:schema:session-state:v1", session);
  verifySession(session);
}

function manifestTransition(protocol, machineId, transitionId) {
  const machine = protocol.machines.find((item) => item.id === machineId);
  const transition = [...machine.transitions, ...machine.families]
    .find((item) => item.id === transitionId);
  if (!transition) fail("PROTOCOL_IMPLEMENTATION_MISMATCH", `${transitionId} is absent from ${machineId}`);
  return {
    machine: machineId,
    transition,
    family: machine.families.some((item) => item.id === transitionId)
  };
}

async function commitBootstrapTransition(
  root,
  session,
  protocol,
  machineId,
  transitionId,
  commandEventId,
  commandActor,
  payload = {}
) {
  const semanticPayload = semanticEventPayload(payload);
  const selected = manifestTransition(protocol, machineId, transitionId);
  if (transitionId !== "RT01") validateTransitionSource(protocol, session, selected);
  if (!authorityMatches(selected.transition.authority, commandActor, session)) {
    fail("AUTHORITY_DENIED", `${transitionId} requires ${selected.transition.authority}`);
  }
  if (machineId === "phase") {
    await applyPhaseSemantics(root, null, session, selected.transition, payload, commandEventId);
    session.phase = selected.family && selected.transition.to === "same"
      ? session.phase
      : selected.transition.to;
  } else {
    await applyRuntimeSemantics(root, session, selected.transition, payload, {
      internal: transitionId === "RT01"
    });
  }
  appendAcceptedEvent(session, {
    id: commandEventId,
    eventId: selected.transition.event,
    transitionId,
    actor: commandActor,
    payload
  });
  const payloadDigest = sha256Value(semanticPayload);
  const commandDigest = sha256Value({
    event: selected.transition.event,
    actor: commandActor,
    payload: semanticPayload
  });
  session.idempotency[commandEventId] = {
    payloadDigest,
    commandDigest,
    selectedTransitionId: transitionId,
    transitionBindingDigest: sha256Value({
      commandDigest,
      selectedTransitionId: transitionId
    }),
    transitionId,
    revision: session.revision
  };
}

export async function createSurveySession(root, unsafeOptions) {
  const options = stableValue(unsafeOptions);
  const slug = assertSafeIdentity(options.slug, /^[a-z0-9][a-z0-9-]{0,79}$/, "slug");
  const sessionId = assertSafeIdentity(options.sessionId, /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/, "sessionId");
  const sessionsRoot = path.resolve(options.sessionsRoot ?? path.join(root, "surveys"));
  const slugDirectory = path.join(sessionsRoot, slug);
  await ensureDirectoryNoFollow(slugDirectory);
  const runDirectory = path.join(slugDirectory, sessionId);
  try {
    await mkdir(runDirectory);
  } catch (error) {
    if (error.code === "EEXIST") fail("SESSION_EXISTS", `session directory already exists: ${runDirectory}`);
    throw error;
  }
  const context = await loadContext(root);

  return withSessionLockOptions(runDirectory, async () => {
    const pendingSemanticInput = {
      workItem: options.workItem,
      outcomeAxes: options.outcomeAxes,
      requestedArtifactPath: `${slug}-survey.md`,
      axiomCorpus: Boolean(options.axiomCorpus),
      directorRef: options.directorRef,
      proposerRef: options.proposerRef,
      dependency: context.dependency
    };
    const session = {
      $schema: "urn:mission-kit:survey-v2:schema:session-state:v1",
      schemaVersion: "1.0.0",
      sessionId,
      slug,
      package: {
        id: "urn:mission-kit:survey-v2:package:survey-v2",
        version: "1.0.0",
        projectionDigest: context.projectionLock.aggregateDigest
      },
      protocol: {
        id: context.protocol.id,
        version: context.protocol.schemaVersion,
        digest: sha256Value(context.protocol),
        snapshot: context.protocol
      },
      revision: 0,
      phase: "new",
      runtimeStatus: "rehydrating",
      blockReason: null,
      lineage: {
        parentSessionId: options.parentSessionId ?? null,
        restartReason: options.restartReason ?? null,
        parentEvidence: options.parentEvidence ?? []
      },
      inputs: {
        workItem: options.workItem,
        outcomeAxes: options.outcomeAxes,
        requestedArtifactPath: `${slug}-survey.md`,
        axiomCorpus: Boolean(options.axiomCorpus),
        pendingInputDigest: sha256Value(pendingSemanticInput)
      },
      authority: {
        directorRef: options.directorRef,
        proposerRef: options.proposerRef,
        bindingEvidence: options.bindingEvidence ?? "host-supplied"
      },
      events: [],
      rejections: [],
      idempotency: Object.create(null),
      outbox: null,
      attempts: [],
      responses: {},
      drafts: {
        round1Instruments: [],
        round1Interpretations: [],
        round2Instruments: [],
        round2Interpretations: [],
        composites: [],
        current: {}
      },
      interpretations: {},
      dependencies: {
        plan: [context.dependency.id],
        resolverAttempts: [],
        resolverReceipts: [],
        rehydrationOutputs: [],
        outputs: {}
      },
      candidates: [],
      feedback: [],
      ratification: null,
      finalization: null,
      snapshotDigest: "sha256:".padEnd(71, "0")
    };

    await commitBootstrapTransition(
      root,
      session,
      context.protocol,
      "runtime",
      "RT01",
      `${sessionId}:RT01`,
      actor("host", "survey-v2-runtime")
    );
    await commitBootstrapTransition(
      root,
      session,
      context.protocol,
      "runtime",
      "RT06",
      `${sessionId}:RT06`,
      actor("host", "survey-v2-runtime")
    );
    await commitBootstrapTransition(
      root,
      session,
      context.protocol,
      "phase",
      "T01",
      `${sessionId}:T01`,
      actor("proposer", options.proposerRef),
      { pendingInputDigest: session.inputs.pendingInputDigest }
    );

    let initializationReceipt;
    if (!options.axiomCorpus) {
      initializationReceipt = sealInitializationReceipt(session, context.dependency, {
        applicability: "not-applicable"
      });
    } else {
      const resolution = await resolveInitializationReceipt(
        session,
        context.dependency,
        options.registry,
        {
          attemptId: `${sessionId}:binding:1`,
          registryId: options.registry?.registryId ?? "host-registry"
        }
      );
      initializationReceipt = resolution.receipt;
      if (resolution.failure) {
        const failureTransitionId = resolution.failure.terminal ? "RT13" : "RT10";
        await commitBootstrapTransition(
          root,
          session,
          context.protocol,
          "runtime",
          failureTransitionId,
          `${sessionId}:${failureTransitionId}`,
          actor("substrate", "survey-v2-runtime"),
          {
            code: resolution.failure.code,
            evidence: [resolution.failure.message],
            trustedRuntimeEvidence: {
              resolverAttempt: resolution.attempt,
              resolverFailure: resolution.failure
            }
          }
        );
      }
    }
    if (initializationReceipt) {
      await commitBootstrapTransition(
        root,
        session,
        context.protocol,
        "phase",
        "T41",
        `${sessionId}:T41`,
        actor("proposer", options.proposerRef),
        { resolverReceiptId: initializationReceipt.receiptId }
      );
    }

    sealSession(session);
    await validateSession(root, session);
    await atomicWriteJson(path.join(runDirectory, "session.json"), session, { noReplace: true });
    return { runDirectory, session };
  });
}

function recordRejection(session, command, reason) {
  const payloadDigest = sha256Value(command.payload ?? {});
  const commandDigest = sha256Value({
    event: command.event,
    actor: command.actor,
    payload: command.payload ?? {}
  });
  const selectedTransitionId = command.selectedTransitionId;
  const transitionBindingDigest = sha256Value({ commandDigest, selectedTransitionId });
  const rejection = {
    ordinal: session.rejections.length,
    ruleId: "RJ01",
    eventId: command.eventId,
    phase: session.phase,
    revision: session.revision,
    event: command.event,
    actor: command.actor,
    payload: command.payload ?? {},
    payloadDigest,
    commandDigest,
    selectedTransitionId,
    transitionBindingDigest,
    currentViewDigest: session.outbox?.digest ?? null,
    reason
  };
  session.rejections.push(rejection);
  session.idempotency[command.eventId] = {
    payloadDigest,
    commandDigest,
    selectedTransitionId,
    transitionBindingDigest,
    transitionId: "REJECTION:RJ01",
    revision: session.revision
  };
}

export async function applySurveyCommand(
  root,
  runDirectory,
  unsafeCommand,
  unsafeHostContext,
  unsafeOperationalContext = {}
) {
  const semanticCommand = stableValue(unsafeCommand);
  if (Object.hasOwn(semanticCommand, "actor")) {
    fail("ACTOR_CONTEXT_FORBIDDEN", "semantic command payload may not self-assert actor authority");
  }
  const hostContext = stableValue(unsafeHostContext);
  const operationalContext = stableValue(unsafeOperationalContext);
  const command = { ...semanticCommand, actor: hostContext };
  let postCommitMaterialization = null;
  const result = await withSessionLockOptions(
    runDirectory,
    async ({ staleLockEvidence }) => {
      const session = await readVerifiedSession(runDirectory);
      await validateSession(root, session);
      if (
        typeof command.eventId !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/.test(command.eventId)
      ) {
        fail("EVENT_ID_INVALID", "eventId must be a safe bounded identifier");
      }
      assertRecord(command.actor, "ACTOR_REQUIRED", "actor context is required");
      if (
        typeof command.actor.role !== "string" ||
        typeof command.actor.ref !== "string" ||
        typeof command.actor.assertionSource !== "string"
      ) {
        fail("ACTOR_INVALID", "actor role, ref, and assertionSource must be strings");
      }
      const protocol = session.protocol.snapshot;
      if (sha256Value(protocol) !== session.protocol.digest) fail("PROTOCOL_SNAPSHOT_MISMATCH", "pinned protocol digest is invalid");
      const payloadDigest = sha256Value(command.payload ?? {});
      const commandDigest = sha256Value({
        event: command.event,
        actor: command.actor,
        payload: command.payload ?? {}
      });
      const replay = Object.hasOwn(session.idempotency, command.eventId)
        ? session.idempotency[command.eventId]
        : null;
      if (replay) {
        if (replay.commandDigest !== commandDigest) {
          if (session.runtimeStatus === "active") {
            session.runtimeStatus = "blocked_terminal";
            session.blockReason = {
              transitionId: "RT13",
              code: "EVENT_ID_COMMAND_CONFLICT",
              evidence: [command.eventId]
            };
            appendAcceptedEvent(session, {
              id: `${command.eventId}:RT13`,
              eventId: "TERMINAL_INTEGRITY_FAILURE",
              transitionId: "RT13",
              actor: actor("substrate", "survey-v2-runtime"),
              payload: session.blockReason
            });
            const conflictEventId = `${command.eventId}:RT13`;
            const conflictActor = actor("substrate", "survey-v2-runtime");
            const conflictCommandDigest = sha256Value({
              event: "TERMINAL_INTEGRITY_FAILURE",
              actor: conflictActor,
              payload: session.blockReason
            });
            session.idempotency[conflictEventId] = {
              payloadDigest: sha256Value(session.blockReason),
              commandDigest: conflictCommandDigest,
              selectedTransitionId: "RT13",
              transitionBindingDigest: sha256Value({
                commandDigest: conflictCommandDigest,
                selectedTransitionId: "RT13"
              }),
              transitionId: "RT13",
              revision: session.revision
            };
            await writeSession(runDirectory, session);
          }
          fail("EVENT_ID_CONFLICT", "event ID was reused with changed event, actor, or payload bytes");
        }
        const replaySelection = transitionFor(protocol, session, command.event);
        const replayBindingDigest = sha256Value({
          commandDigest,
          selectedTransitionId: replaySelection.transition.id
        });
        if (
          replay.selectedTransitionId !== replaySelection.transition.id ||
          replay.transitionBindingDigest !== replayBindingDigest
        ) {
          fail("EVENT_ID_CONFLICT", "event ID replay no longer binds its original selected transition");
        }
        return {
          replayed: true,
          rejected: replay.transitionId === "REJECTION:RJ01",
          transitionId: replay.transitionId,
          session,
          emission: session.outbox?.payload ?? null
        };
      }
      if (command.expectedRevision !== undefined && command.expectedRevision !== session.revision) {
        fail("STALE_REVISION", `expected revision ${command.expectedRevision}, got ${session.revision}`);
      }

      const selected = transitionFor(protocol, session, command.event);
      const transitionBindingDigest = sha256Value({
        commandDigest,
        selectedTransitionId: selected.transition.id
      });

      validateTransitionSource(protocol, session, selected);
      if (!authorityMatches(selected.transition.authority, command.actor, session)) {
        fail("AUTHORITY_DENIED", `${selected.transition.id} requires ${selected.transition.authority}`);
      }

      const eventPayload = {
        ...(command.payload ?? {}),
        ...(staleLockEvidence ? { writerRecovery: staleLockEvidence } : {})
      };
      if (
        Object.hasOwn(command.payload ?? {}, "writerRecovery") ||
        Object.hasOwn(command.payload ?? {}, "trustedRuntimeEvidence")
      ) {
        fail("RESERVED_PAYLOAD_FIELD", "writerRecovery and trustedRuntimeEvidence are reserved for trusted runtime evidence");
      }
      try {
        if (selected.machine === "phase") {
          await applyPhaseSemantics(root, runDirectory, session, selected.transition, eventPayload, command.eventId);
          session.phase = selected.family && selected.transition.to === "same"
            ? session.phase
            : selected.transition.to;
        } else {
          await applyRuntimeSemantics(root, session, selected.transition, eventPayload, {
            operationalContext
          });
        }
      } catch (error) {
        if (error instanceof ProtocolError && error.code === "RJ01") {
          recordRejection(
            session,
            { ...command, selectedTransitionId: selected.transition.id },
            error.message
          );
          sealSession(session);
          await validateSession(root, session);
          await writeSession(runDirectory, session);
          return { replayed: false, rejected: true, session, emission: session.outbox?.payload ?? null };
        }
        throw error;
      }

      appendAcceptedEvent(session, {
        id: command.eventId,
        eventId: selected.transition.event,
        transitionId: selected.transition.id,
        actor: command.actor,
        payload: eventPayload
      });
      session.idempotency[command.eventId] = {
        payloadDigest,
        commandDigest,
        selectedTransitionId: selected.transition.id,
        transitionBindingDigest,
        transitionId: selected.transition.id,
        revision: session.revision
      };
      sealSession(session);
      await validateSession(root, session);
      await writeSession(runDirectory, session);
      if (selected.transition.id === "T35") {
        postCommitMaterialization = {
          target: path.join(runDirectory, session.finalization.targetPath),
          bytes: Buffer.from(session.finalization.bytes, "utf8"),
          digest: session.finalization.digest
        };
      }
      return {
        replayed: false,
        rejected: false,
        transitionId: selected.transition.id,
        session,
        emission: session.outbox?.payload ?? null
      };
    }
  );

  if (postCommitMaterialization) {
    await materializeSealedEnvelope(postCommitMaterialization);
    const materialized = await readNoFollowBytes(postCommitMaterialization.target);
    if (sha256Bytes(materialized) !== postCommitMaterialization.digest) {
      fail("MATERIALIZATION_MISMATCH", "terminal envelope file digest does not match sealed bytes");
    }
  }
  return result;
}

export async function retrySurveyInitialization(
  root,
  runDirectory,
  {
    eventIdPrefix = "initialization-retry",
    expectedRevision,
    registry,
    attemptId,
    registryId = "host-registry"
  },
  unsafeHostContext
) {
  const before = await readVerifiedSession(runDirectory);
  if (before.phase !== "initializing" || before.runtimeStatus !== "blocked_recoverable") {
    fail("REMEDIATION_SCOPE", "initialization retry requires initializing/blocked_recoverable state");
  }
  if (expectedRevision !== undefined && expectedRevision !== before.revision) {
    fail("STALE_REVISION", `expected revision ${expectedRevision}, got ${before.revision}`);
  }
  const dependencyId = before.dependencies.plan[0];
  const retryResult = await applySurveyCommand(root, runDirectory, {
    event: "RETRY",
    eventId: `${eventIdPrefix}:RT05`,
    expectedRevision: before.revision,
    payload: {
      remediation: {
        type: "host-registry-rebind",
        attemptId: attemptId ?? `${before.sessionId}:binding:${before.dependencies.resolverAttempts.length + 1}`,
        registryId,
        dependencyId
      }
    }
  }, unsafeHostContext, { registry });
  const retryEvidence = retryResult.session.events.at(-1)?.payload?.trustedRuntimeEvidence;
  if (!retryEvidence?.resolverReceipt) {
    const failure = retryEvidence?.resolverFailure ?? {
      code: "RESOLUTION_PROOF_ABSENT",
      message: "retry produced no sealed resolver receipt",
      terminal: false
    };
    return applySurveyCommand(root, runDirectory, {
      event: failure.terminal ? "TERMINAL_FAILURE" : "RECOVERABLE_FAILURE",
      eventId: `${eventIdPrefix}:${failure.terminal ? "RT08" : "RT07"}`,
      expectedRevision: retryResult.session.revision,
      payload: {
        code: failure.code,
        evidence: [failure.message]
      }
    }, unsafeHostContext);
  }
  const rehydrated = await applySurveyCommand(root, runDirectory, {
    event: "REHYDRATION_PASS",
    eventId: `${eventIdPrefix}:RT06`,
    expectedRevision: retryResult.session.revision,
    payload: {}
  }, unsafeHostContext);
  return applySurveyCommand(root, runDirectory, {
    event: "COMPLETE_INITIALIZATION",
    eventId: `${eventIdPrefix}:T41`,
    expectedRevision: rehydrated.session.revision,
    payload: {
      resolverReceiptId: retryEvidence.resolverReceipt.receiptId
    }
  }, actor("proposer", rehydrated.session.authority.proposerRef, "host-adapter:survey-v2-runtime-proposer"));
}

export async function materializeSealedEnvelope({ target, bytes, digest }) {
  try {
    await atomicWriteBytes(target, bytes, { noReplace: true });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = await readNoFollowBytes(target);
    if (sha256Bytes(existing) !== digest || !existing.equals(bytes)) {
      fail("ENVELOPE_DRIFT", "refusing to overwrite a divergent terminal envelope");
    }
  }
}

const presentationEvents = {
  round_1_q1_ready: "PRESENT_Q1",
  round_1_q2_ready: "PRESENT_Q2",
  round_1_q3_ready: "PRESENT_Q3",
  round_2_q4_ready: "PRESENT_Q4",
  round_2_q5_ready: "PRESENT_Q5",
  round_2_q6_ready: "PRESENT_Q6",
  walkthrough_ready: "START_WALKTHROUGH"
};

export async function presentSurvey(root, runDirectory, {
  eventId,
  expectedRevision
}) {
  const session = await readVerifiedSession(runDirectory);
  const event = presentationEvents[session.phase] ?? (
    [
      "round_1_q1_awaiting",
      "round_1_q2_awaiting",
      "round_1_q3_awaiting",
      "round_2_q4_awaiting",
      "round_2_q5_awaiting",
      "round_2_q6_awaiting",
      "walkthrough_in_progress",
      "awaiting_ratification",
      "revision_requested"
    ].includes(session.phase) ? "REEMIT_CURRENT" : null
  );
  if (!event) fail("NOT_PRESENTABLE", `phase ${session.phase} has no Director presentation`);
  return applySurveyCommand(root, runDirectory, {
    event,
    eventId,
    expectedRevision,
    payload: {}
  }, actor("substrate", "survey-v2-runtime"));
}

export async function surveyStatus(runDirectory) {
  const quarantinePath = path.join(runDirectory, "quarantine.json");
  const quarantineStat = await lstat(quarantinePath).catch(() => null);
  if (quarantineStat) {
    return {
      effectiveState: "quarantined",
      quarantinePath
    };
  }
  const session = await readVerifiedSession(runDirectory);
  return {
    effectiveState: session.runtimeStatus,
    sessionId: session.sessionId,
    revision: session.revision,
    phase: session.phase,
    runtimeStatus: session.runtimeStatus,
    currentViewDigest: session.outbox?.digest ?? null,
    handoff: session.finalization?.handoff ?? null
  };
}

export async function finalizeSurveyEnvelope(root, runDirectory, {
  eventIdPrefix = "envelope",
  expectedRevision
} = {}) {
  let session = await readVerifiedSession(runDirectory);
  if (expectedRevision !== undefined && expectedRevision !== session.revision) {
    fail("STALE_REVISION", `expected revision ${expectedRevision}, got ${session.revision}`);
  }
  if (session.phase === "ratified") {
    await applySurveyCommand(root, runDirectory, {
      event: "BEGIN_FINALIZATION",
      eventId: `${eventIdPrefix}:T34`,
      expectedRevision: session.revision,
      payload: {}
    }, actor("substrate", "survey-v2-runtime"));
    session = await readVerifiedSession(runDirectory);
  }
  if (session.phase === "finalizing") {
    return applySurveyCommand(root, runDirectory, {
      event: "FINALIZATION_PASS",
      eventId: `${eventIdPrefix}:T35`,
      expectedRevision: session.revision,
      payload: {}
    }, actor("substrate", "survey-v2-runtime"));
  }
  if (session.phase !== "intent_captured") fail("NOT_FINALIZABLE", `phase ${session.phase} is not finalizable`);
  const target = path.join(runDirectory, session.finalization.targetPath);
  const bytes = Buffer.from(session.finalization.bytes, "utf8");
  await materializeSealedEnvelope({ target, bytes, digest: session.finalization.digest });
  return {
    replayed: true,
    session,
    handoff: session.finalization.handoff
  };
}

export async function checkSurveyEnvelope(runDirectory) {
  const session = await readVerifiedSession(runDirectory);
  if (session.phase !== "intent_captured" || !session.finalization?.handoff) {
    fail("NO_HANDOFF", "session has no sealed intent-captured handoff");
  }
  const target = path.join(runDirectory, session.finalization.targetPath);
  const actual = await readNoFollowBytes(target);
  const digest = sha256Bytes(actual);
  const candidate = candidateCurrent(session);
  const terminalModel = attachRatificationEvidence(candidate.model, session.ratification);
  const expectedBytes = renderEnvelopeModel(terminalModel);
  if (
    digest !== session.finalization.digest ||
    actual.toString("utf8") !== session.finalization.bytes ||
    expectedBytes !== session.finalization.bytes ||
    envelopeDigest(terminalModel) !== session.finalization.digest
  ) {
    fail("ENVELOPE_DRIFT", "materialized envelope differs from sealed session bytes");
  }
  return {
    path: target,
    digest,
    sessionTerminalEventDigest: session.events[session.events.length - 1].digest
  };
}

export function parseCliArguments(argv) {
  const result = Object.create(null);
  for (const argument of argv) {
    if (!argument.startsWith("--") || !argument.includes("=")) {
      fail("INVALID_ARGUMENT", `expected --key=value, got ${argument}`);
    }
    const separator = argument.indexOf("=");
    const key = argument.slice(2, separator);
    const value = argument.slice(separator + 1);
    if (!key || Object.hasOwn(result, key)) fail("INVALID_ARGUMENT", `duplicate or empty argument ${key}`);
    result[key] = value;
  }
  return result;
}

export async function readPayloadArgument(root, args) {
  if (args["payload-json"] && args["payload-file"]) fail("INVALID_ARGUMENT", "choose payload-json or payload-file");
  if (args["payload-file"]) {
    const target = path.resolve(root, args["payload-file"]);
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      fail("INVALID_ARGUMENT", "payload-file must remain beneath the declared payload root");
    }
    const rootPhysical = await realpath(root);
    let current = root;
    for (const segment of relative.split(path.sep).filter(Boolean)) {
      current = path.join(current, segment);
      const stat = await lstat(current).catch((error) => {
        fail("INVALID_ARGUMENT", `payload-file path is unavailable: ${error.message}`);
      });
      if (stat.isSymbolicLink()) {
        fail("INVALID_ARGUMENT", "payload-file path may not traverse a symlink");
      }
      if (current !== target && !stat.isDirectory()) {
        fail("INVALID_ARGUMENT", "payload-file ancestor must be a directory");
      }
    }
    const targetPhysical = await realpath(target);
    if (targetPhysical !== rootPhysical && !targetPhysical.startsWith(`${rootPhysical}${path.sep}`)) {
      fail("INVALID_ARGUMENT", "payload-file physical path escapes the declared payload root");
    }
    const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW).catch((error) => {
      fail("INVALID_ARGUMENT", `payload-file cannot be opened without following links: ${error.message}`);
    });
    try {
      const stat = await handle.stat();
      if (!stat.isFile()) fail("INVALID_ARGUMENT", "payload-file must be a regular file");
      return JSON.parse((await handle.readFile()).toString("utf8"));
    } finally {
      await handle.close();
    }
  }
  return args["payload-json"] ? JSON.parse(args["payload-json"]) : {};
}

export function runtimeRootFromScript(moduleUrl) {
  const scriptDirectory = path.dirname(fileURLToPath(moduleUrl));
  return path.resolve(scriptDirectory, "..");
}

export function printJson(value) {
  process.stdout.write(prettyJson(value));
}
