import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  rename,
  unlink
} from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  prettyJson,
  sha256Bytes,
  sha256Value,
  withoutKey
} from "./canonical.mjs";
import {
  attachRatificationEvidence,
  renderEnvelopeModel,
  walkthroughSegments
} from "./envelope.mjs";
import {
  validateById as validateGeneratedById
} from "../../../../generated/validators.mjs";
import protocolSelection from "../../../protocol/protocol-selection.json" with {
  type: "json"
};

const protocolSelectionValidation = validateGeneratedById(
  protocolSelection.$schema,
  protocolSelection
);
if (!protocolSelectionValidation.valid) {
  throw new TypeError(
    `current executor protocol selection is invalid: ${
      protocolSelectionValidation.errors.join("; ")
    }`
  );
}
const currentExecutorSelection = protocolSelection.defaultSelection;
export const HISTORICAL_SESSION_SCHEMA_ID =
  protocolSelection.historicalCompatibility.sessionSchema;
export const CURRENT_EXECUTOR_SESSION_SCHEMA_ID =
  currentExecutorSelection.sessionSchema;
export const CURRENT_EXECUTOR_QUARANTINE_SCHEMA_ID =
  currentExecutorSelection.execution.quarantineSchema;
export const CURRENT_EXECUTOR_PACKAGE_ID =
  currentExecutorSelection.package.id;
export const CURRENT_EXECUTOR_PACKAGE_VERSION =
  currentExecutorSelection.package.version;

export class MatchingFrozenPackageRequiredError extends Error {
  constructor(message) {
    super(message);
    this.name = "MatchingFrozenPackageRequiredError";
    this.code = "MATCHING_FROZEN_PACKAGE_REQUIRED";
  }
}

function assertCurrentExecutorSessionSchema(session) {
  if (session?.$schema === HISTORICAL_SESSION_SCHEMA_ID) {
    throw new MatchingFrozenPackageRequiredError(
      "Historical protocol-v1 sessions require execution by their exact frozen package; the current package executor cannot resume them."
    );
  }
}

async function existingDirectoryNoFollow(directory) {
  const absolute = path.resolve(directory);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const segment of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await lstat(current);
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new SessionIntegrityError(
        "schema-invalid-session",
        `directory path contains non-directory or symlink: ${current}`
      );
    }
  }
  return true;
}

export async function preflightCurrentExecutorSession(runDirectory) {
  if (!await existingDirectoryNoFollow(runDirectory)) return;
  let parsed;
  try {
    parsed = JSON.parse(
      (await readNoFollowFile(path.join(runDirectory, "session.json")))
        .toString("utf8")
    );
  } catch {
    // The normal locked read owns every failure except this read-only
    // historical-schema routing decision.
    return;
  }
  assertCurrentExecutorSessionSchema(parsed);
}

export class SessionIntegrityError extends Error {
  constructor(failureClass, message) {
    super(message);
    this.name = "SessionIntegrityError";
    this.failureClass = failureClass;
  }
}

export class SessionLockedError extends Error {
  constructor(message) {
    super(message);
    this.name = "SessionLockedError";
  }
}

async function fsyncDirectory(directory) {
  const handle = await open(directory, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function ensureDirectoryNoFollow(directory) {
  const absolute = path.resolve(directory);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const segment of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    await mkdir(current).catch((error) => {
      if (error.code !== "EEXIST") throw error;
    });
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new SessionIntegrityError("schema-invalid-session", `directory path contains non-directory or symlink: ${current}`);
    }
  }
  return absolute;
}

async function readNoFollowFile(target) {
  let handle;
  try {
    handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if (error.code === "ELOOP") {
      throw new SessionIntegrityError("schema-invalid-session", `refusing symlink file: ${target}`);
    }
    throw error;
  }
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) {
      throw new SessionIntegrityError("schema-invalid-session", `not a regular file: ${target}`);
    }
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

export async function readNoFollowBytes(target) {
  return readNoFollowFile(target);
}

async function readNoFollowIdentity(target) {
  let handle;
  try {
    handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if (error.code === "ELOOP") {
      throw new SessionIntegrityError("schema-invalid-session", `refusing symlink file: ${target}`);
    }
    throw error;
  }
  try {
    const before = await handle.stat({ bigint: true });
    if (!before.isFile()) throw new SessionIntegrityError("schema-invalid-session", `not a regular file: ${target}`);
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    if (before.dev !== after.dev || before.ino !== after.ino || BigInt(bytes.length) !== after.size) {
      throw new SessionIntegrityError("schema-invalid-session", `file identity changed while reading: ${target}`);
    }
    return { bytes, stat: after };
  } finally {
    await handle.close();
  }
}

export function appendAcceptedEvent(session, {
  id,
  eventId,
  transitionId,
  actor,
  payload = {}
}) {
  const previousDigest = session.events.length
    ? session.events[session.events.length - 1].digest
    : null;
  const event = {
    ordinal: session.events.length,
    id,
    eventId,
    transitionId,
    actor,
    payload,
    previousDigest
  };
  event.digest = sha256Value(event);
  session.events.push(event);
  session.revision += 1;
  return event;
}

export function sealSession(session) {
  session.snapshotDigest = sha256Value(withoutKey(session, "snapshotDigest"));
  return session;
}

function assertSessionInvariant(condition, message, failureClass = "semantic-product-invalid") {
  if (!condition) {
    throw new SessionIntegrityError(failureClass, message);
  }
}

function valuesEqual(left, right) {
  if (left === undefined || right === undefined) return left === right;
  return sha256Value(left) === sha256Value(right);
}

function normalizeReplayInstrument(draft, round, boundRound1Digest = undefined) {
  const normalized = {
    ...draft,
    $schema: "urn:mission-kit:survey-v2:schema:instrument:v1",
    schemaVersion: "1.0.0",
    round,
    revision: draft?.revision ?? 1
  };
  if (round === 2) normalized.boundRound1Digest = boundRound1Digest;
  normalized.freezeDigest = sha256Value(withoutKey(normalized, "freezeDigest"));
  return normalized;
}

function normalizeReplayResponse(question, event) {
  const payload = event.payload;
  assertSessionInvariant(
    typeof payload.raw === "string" &&
      /^[a-d](?:\s*(?:,|\+|\/|\band\b|\s+)\s*[a-d])*$/i.test(payload.raw.trim()),
    `response event ${event.id} has invalid raw pick evidence`
  );
  const parsedRaw = payload.raw
    .trim()
    .toLowerCase()
    .split(/\s*(?:,|\+|\/|\band\b|\s+)\s*/)
    .filter(Boolean);
  const selected = Array.isArray(payload.picks)
    ? payload.picks.map((item) => String(item).toLowerCase())
    : parsedRaw;
  assertSessionInvariant(
    selected.every((item) => /^[a-d]$/.test(item)) &&
      valuesEqual([...new Set(selected)].sort(), [...new Set(parsedRaw)].sort()),
    `response event ${event.id} explicit picks differ from its raw evidence`
  );
  const optionOrder = question.options.map((option) => option.id);
  const normalizedPicks = [...new Set(selected)]
    .sort((left, right) => optionOrder.indexOf(left) - optionOrder.indexOf(right));
  assertSessionInvariant(
    normalizedPicks.length > 0 &&
      normalizedPicks.every((pick) => optionOrder.includes(pick)),
    `response event ${event.id} selects an unknown option`
  );
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
    questionId: payload.questionId,
    raw: payload.raw,
    normalizedPicks,
    contradictions,
    rationale: typeof payload.rationale === "string" ? payload.rationale : null,
    eventId: event.id,
    acknowledgedViewDigest: payload.acknowledgedViewDigest
  };
}

function verifyDependencyProductDigests(session) {
  const checkResultDigest = (value, label) => {
    assertSessionInvariant(
      value &&
        typeof value === "object" &&
        value.resultDigest === sha256Value(withoutKey(value, "resultDigest")),
      `${label} result digest does not re-derive`
    );
  };
  for (const [index, receipt] of session.dependencies.resolverReceipts.entries()) {
    checkResultDigest(receipt, `resolver receipt ${index}`);
  }
  for (const [index, output] of session.dependencies.rehydrationOutputs.entries()) {
    checkResultDigest(output, `rehydration output ${index}`);
  }
  for (const [name, output] of Object.entries(session.dependencies.outputs)) {
    checkResultDigest(output, `dependency output ${name}`);
  }
  const initialization = session.dependencies.outputs.initResolve;
  const snapshot = initialization?.applicability === "applicable"
    ? initialization.snapshot
    : null;
  if (!snapshot) return;
  let totalBytes = 0;
  const inventoryRecords = [];
  for (const item of snapshot.inventory) {
    const bytes = item.contentEncoding === "base64"
      ? Buffer.from(item.content, "base64")
      : Buffer.from(item.content, "utf8");
    assertSessionInvariant(
      bytes.length === item.byteLength && sha256Bytes(bytes) === item.digest,
      `frozen dependency item ${item.path} does not re-derive`
    );
    totalBytes += bytes.length;
    inventoryRecords.push({
      path: item.path,
      type: item.type,
      mode: item.mode,
      byteLength: item.byteLength,
      digest: item.digest
    });
  }
  assertSessionInvariant(
    totalBytes === snapshot.totalBytes &&
      snapshot.fileCount === snapshot.inventory.length &&
      sha256Value(inventoryRecords) === snapshot.inventoryDigest &&
      sha256Value(snapshot.inventory) === snapshot.aggregateDigest,
    "frozen dependency snapshot aggregate does not re-derive"
  );
}

function verifyCandidateAncestry(session, model, replay) {
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
  const expectedInstrument = [
    ...replay.round1Instrument.questions,
    ...replay.round2Instrument.questions
  ];
  const expectedResponses = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]
    .map((questionId) => replay.responses[questionId]);
  const initialization = replay.dependencyOutputs.initResolve;
  const expectedDependency = {
    dependencyId: session.dependencies.plan[0],
    kind: "reference",
    repository: "apnex/mission-kit",
    selector: { kind: "subdirectory", path: "axioms" },
    applicability: initialization.applicability,
    snapshotDigest: initialization.applicability === "applicable"
      ? initialization.snapshot.aggregateDigest
      : null,
    contributionRefs: [
      initialization,
      replay.dependencyOutputs.commitR1,
      replay.dependencyOutputs.commitR2,
      replay.dependencyOutputs.preCandidate
    ].filter(Boolean).map((output) => output.resultDigest)
  };
  assertSessionInvariant(
    model.workItem === session.inputs.workItem &&
      valuesEqual(model.outcomeAxes, session.inputs.outcomeAxes) &&
      valuesEqual(model.methodology, expectedMethodology) &&
      valuesEqual(model.authority, expectedAuthority) &&
      valuesEqual(model.lifecycleHandoff, expectedHandoff) &&
      valuesEqual(model.instrument, expectedInstrument) &&
      valuesEqual(model.responses, expectedResponses) &&
      model.interpretations.round1Digest === replay.round1Digest &&
      model.interpretations.round2Digest === replay.round2Digest &&
      valuesEqual(model.interpretations.round1, replay.round1) &&
      valuesEqual(model.interpretations.round2, replay.round2) &&
      valuesEqual(model.dependencies, [expectedDependency]) &&
      model.ratification.authority === "director-only" &&
      model.ratification.status === "pending" &&
      model.ratification.eventId === null &&
      model.ratification.semanticDigest === null &&
      model.ratification.renderDigest === null,
    "candidate ancestry does not re-derive from accepted session evidence"
  );
}

function verifySemanticProducts(session) {
  assertSessionInvariant(
    sha256Value(session.protocol.snapshot) === session.protocol.digest,
    "pinned protocol digest does not re-derive"
  );
  verifyDependencyProductDigests(session);

  const replay = {
    round1Drafts: [],
    round1InterpretationDrafts: [],
    round2Drafts: [],
    round2InterpretationDrafts: [],
    compositeDrafts: [],
    current: {},
    round1Instrument: undefined,
    round2Instrument: undefined,
    responses: {},
    round1ResponseDigest: undefined,
    round2ResponseDigest: undefined,
    round1: undefined,
    round2: undefined,
    round1Digest: undefined,
    round2Digest: undefined,
    candidateValidation: undefined,
    walkthrough: undefined,
    candidates: [],
    feedback: [],
    ratification: null,
    finalization: null,
    dependencyOutputs: {}
  };
  const currentCandidate = () => {
    const current = replay.candidates.filter((candidate) => !candidate.superseded);
    assertSessionInvariant(current.length === 1, `semantic replay found ${current.length} current candidates`);
    return current[0];
  };
  const supersedeCurrentCandidate = () => {
    currentCandidate().superseded = true;
  };
  const responseTransitions = new Map([
    ["T06", ["Q1", 1, false]],
    ["T08", ["Q2", 1, false]],
    ["T10", ["Q3", 1, true]],
    ["T17", ["Q4", 2, false]],
    ["T19", ["Q5", 2, false]],
    ["T21", ["Q6", 2, true]]
  ]);

  for (const event of session.events) {
    if (event.transitionId === "T41") {
      const receipt = event.payload?.trustedRuntimeEvidence?.initializationReceipt;
      assertSessionInvariant(
        receipt?.receiptId === event.payload.resolverReceiptId,
        "T41 does not carry its exact initialization receipt"
      );
      replay.dependencyOutputs.initResolve = receipt;
    } else if (event.transitionId === "T42") {
      const instrument = normalizeReplayInstrument(event.payload.draft, 1);
      replay.round1Drafts.push(instrument);
      replay.current.round1Instrument = instrument.freezeDigest;
    } else if (event.transitionId === "T03") {
      replay.round1Instrument = replay.round1Drafts.at(-1);
      assertSessionInvariant(replay.round1Instrument, "T03 has no preceding Round-1 draft");
    } else if (event.transitionId === "T04") {
      replay.round1Instrument = null;
    } else if (responseTransitions.has(event.transitionId)) {
      const [questionId, round, completesRound] = responseTransitions.get(event.transitionId);
      const instrument = round === 1 ? replay.round1Instrument : replay.round2Instrument;
      const question = instrument?.questions.find((item) => item.id === questionId);
      assertSessionInvariant(question, `${event.transitionId} has no frozen ${questionId}`);
      const response = normalizeReplayResponse(question, event);
      assertSessionInvariant(
        response.questionId === questionId,
        `${event.transitionId} response identifies ${response.questionId}, expected ${questionId}`
      );
      replay.responses[questionId] = response;
      if (completesRound && round === 1) {
        replay.round1ResponseDigest = sha256Value(
          ["Q1", "Q2", "Q3"].map((id) => replay.responses[id])
        );
      }
      if (completesRound && round === 2) {
        replay.round2ResponseDigest = sha256Value(
          ["Q4", "Q5", "Q6"].map((id) => replay.responses[id])
        );
      }
    } else if (event.transitionId === "T43") {
      replay.round1InterpretationDrafts.push(event.payload.draft);
      replay.current.round1Interpretation = sha256Value(event.payload.draft);
    } else if (event.transitionId === "T12") {
      replay.round1 = replay.round1InterpretationDrafts.at(-1);
      assertSessionInvariant(replay.round1, "T12 has no preceding Round-1 interpretation draft");
      replay.round1Digest = sha256Value(replay.round1);
      if (replay.dependencyOutputs.initResolve?.applicability === "applicable") {
        replay.dependencyOutputs.commitR1 = replay.round1.dependencyOutput;
      }
    } else if (event.transitionId === "T44") {
      const instrument = normalizeReplayInstrument(
        event.payload.draft,
        2,
        replay.round1Digest
      );
      replay.round2Drafts.push(instrument);
      replay.current.round2Instrument = instrument.freezeDigest;
    } else if (event.transitionId === "T14") {
      replay.round2Instrument = replay.round2Drafts.at(-1);
      assertSessionInvariant(replay.round2Instrument, "T14 has no preceding Round-2 draft");
    } else if (event.transitionId === "T15") {
      replay.round2Instrument = null;
    } else if (event.transitionId === "T45") {
      replay.round2InterpretationDrafts.push(event.payload.draft);
      replay.current.round2Interpretation = sha256Value(event.payload.draft);
    } else if (event.transitionId === "T23") {
      replay.round2 = replay.round2InterpretationDrafts.at(-1);
      assertSessionInvariant(replay.round2, "T23 has no preceding Round-2 interpretation draft");
      replay.round2Digest = sha256Value(replay.round2);
      if (replay.dependencyOutputs.initResolve?.applicability === "applicable") {
        replay.dependencyOutputs.commitR2 = replay.round2.dependencyOutput;
      }
    } else if (event.transitionId === "T46") {
      replay.compositeDrafts.push(event.payload.draft);
      replay.current.composite = sha256Value(event.payload.draft);
    } else if (event.transitionId === "T25") {
      const model = replay.compositeDrafts.at(-1);
      assertSessionInvariant(model, "T25 has no preceding composite draft");
      if (replay.dependencyOutputs.initResolve?.applicability === "applicable") {
        replay.dependencyOutputs.preCandidate = event.payload.dependencyOutput;
      }
      verifyCandidateAncestry(session, model, replay);
      const renderedBytes = renderEnvelopeModel(model);
      replay.candidates.push({
        revision: replay.candidates.length + 1,
        model,
        semanticDigest: sha256Value(model),
        renderDigest: sha256Bytes(Buffer.from(renderedBytes, "utf8")),
        renderedBytes,
        superseded: false
      });
    } else if (event.transitionId === "T26") {
      const candidate = currentCandidate();
      replay.candidateValidation = event.payload.validation;
      replay.walkthrough = {
        candidateRevision: candidate.revision,
        segments: walkthroughSegments(candidate.model),
        index: 0,
        acknowledgements: []
      };
    } else if (event.transitionId === "T27") {
      replay.feedback.push({
        kind: "candidate-validation",
        diagnostics: event.payload.validation.diagnostics
      });
      supersedeCurrentCandidate();
    } else if (event.transitionId === "T29") {
      assertSessionInvariant(
        replay.walkthrough &&
          replay.walkthrough.index < replay.walkthrough.segments.length - 1,
        "T29 has no later walkthrough segment"
      );
      replay.walkthrough.acknowledgements.push({
        index: replay.walkthrough.index,
        digest: event.payload.acknowledgedViewDigest,
        eventId: event.id
      });
      replay.walkthrough.index += 1;
    } else if (event.transitionId === "T30") {
      assertSessionInvariant(
        replay.walkthrough &&
          replay.walkthrough.index === replay.walkthrough.segments.length - 1,
        "T30 does not acknowledge the final walkthrough segment"
      );
      replay.walkthrough.acknowledgements.push({
        index: replay.walkthrough.index,
        digest: event.payload.acknowledgedViewDigest,
        eventId: event.id
      });
    } else if (event.transitionId === "T31") {
      const candidate = currentCandidate();
      replay.ratification = {
        candidateRevision: candidate.revision,
        semanticDigest: candidate.semanticDigest,
        renderDigest: candidate.renderDigest,
        eventId: event.id,
        directorRef: session.authority.directorRef
      };
    } else if (event.transitionId === "T32") {
      replay.feedback.push({
        kind: event.payload.kind,
        text: event.payload.feedback,
        eventId: event.id
      });
    } else if (event.transitionId === "T33") {
      supersedeCurrentCandidate();
      replay.ratification = null;
    } else if (event.transitionId === "T34") {
      const candidate = currentCandidate();
      const terminalModel = attachRatificationEvidence(candidate.model, replay.ratification);
      const bytes = renderEnvelopeModel(terminalModel);
      replay.finalization = {
        candidateRevision: candidate.revision,
        bytes,
        digest: sha256Bytes(Buffer.from(bytes, "utf8")),
        targetPath: `${session.slug}-survey.md`,
        validation: "pending"
      };
    } else if (event.transitionId === "T35") {
      assertSessionInvariant(replay.finalization, "T35 has no finalization product");
      replay.finalization.validation = "passed";
      replay.finalization.handoff = {
        path: replay.finalization.targetPath,
        digest: replay.finalization.digest,
        terminalEventId: event.id
      };
    } else if (event.transitionId === "T36") {
      replay.feedback.push({
        kind: "finalization-retryable",
        diagnostics: event.payload.diagnostics
      });
    } else if (event.transitionId === "T37") {
      if (replay.candidates.some((candidate) => !candidate.superseded)) {
        supersedeCurrentCandidate();
      }
      replay.round2 = null;
      replay.round2Digest = null;
      replay.ratification = null;
    } else if (event.transitionId === "T38") {
      supersedeCurrentCandidate();
      replay.ratification = null;
      replay.finalization = null;
    } else if (event.transitionId === "T39") {
      replay.feedback.push({
        kind: "clarification",
        text: event.payload.feedback,
        eventId: event.id
      });
    } else if (event.transitionId === "T40") {
      supersedeCurrentCandidate();
      replay.round2 = null;
      replay.round2Digest = null;
      replay.ratification = null;
      replay.finalization = null;
    }
  }

  const expectedInterpretations = {};
  for (const [name, value] of [
    ["round1Instrument", replay.round1Instrument],
    ["round2Instrument", replay.round2Instrument],
    ["round1ResponseDigest", replay.round1ResponseDigest],
    ["round2ResponseDigest", replay.round2ResponseDigest],
    ["round1", replay.round1],
    ["round2", replay.round2],
    ["round1Digest", replay.round1Digest],
    ["round2Digest", replay.round2Digest],
    ["candidateValidation", replay.candidateValidation],
    ["walkthrough", replay.walkthrough]
  ]) {
    if (value !== undefined) expectedInterpretations[name] = value;
  }
  assertSessionInvariant(
    valuesEqual(session.drafts.round1Instruments, replay.round1Drafts) &&
      valuesEqual(session.drafts.round1Interpretations, replay.round1InterpretationDrafts) &&
      valuesEqual(session.drafts.round2Instruments, replay.round2Drafts) &&
      valuesEqual(session.drafts.round2Interpretations, replay.round2InterpretationDrafts) &&
      valuesEqual(session.drafts.composites, replay.compositeDrafts) &&
      valuesEqual(session.drafts.current, replay.current),
    "draft history or current pointers do not replay from accepted events"
  );
  assertSessionInvariant(
    valuesEqual(session.responses, replay.responses),
    "raw or normalized Director responses do not replay from accepted events"
  );
  assertSessionInvariant(
    valuesEqual(session.interpretations, expectedInterpretations),
    "interpretation, validation or walkthrough products do not replay from accepted events"
  );
  assertSessionInvariant(
    valuesEqual(session.candidates, replay.candidates),
    "candidate model, digests, rendered bytes or supersession do not replay from accepted events"
  );
  assertSessionInvariant(
    valuesEqual(session.feedback, replay.feedback),
    "feedback history does not replay from accepted events"
  );
  assertSessionInvariant(
    valuesEqual(session.ratification, replay.ratification),
    "ratification ancestry does not replay from accepted events"
  );
  assertSessionInvariant(
    valuesEqual(session.finalization, replay.finalization),
    "finalization or handoff bytes do not replay from accepted events"
  );
  if (session.outbox) {
    const payloadDigest = sha256Value(withoutKey(session.outbox.payload, "payloadDigest"));
    assertSessionInvariant(
      session.outbox.payload.payloadDigest === payloadDigest &&
        session.outbox.digest === payloadDigest,
      "current outbox presentation digest does not re-derive"
    );
  }
  for (let index = 0; index < session.attempts.length; index += 1) {
    assertSessionInvariant(
      session.attempts[index].ordinal === index,
      `presentation attempt ordinal differs at ${index}`
    );
  }
}

function authorityMatchesSnapshot(authorityId, eventActor, session) {
  if (
    !eventActor ||
    typeof eventActor.role !== "string" ||
    typeof eventActor.ref !== "string" ||
    typeof eventActor.assertionSource !== "string"
  ) {
    return false;
  }
  switch (authorityId) {
    case "AU01":
      return eventActor.role === "proposer" && eventActor.ref === session.authority?.proposerRef;
    case "AU02":
      return (
        eventActor.role === "director" &&
        eventActor.ref === session.authority?.directorRef &&
        eventActor.assertionSource.startsWith("host-adapter:")
      );
    case "AU03":
      return eventActor.role === "substrate";
    case "AU04":
      return (
        (
          eventActor.role === "director" &&
          eventActor.ref === session.authority?.directorRef &&
          eventActor.assertionSource.startsWith("host-adapter:")
        ) ||
        (eventActor.role === "proposer" && eventActor.ref === session.authority?.proposerRef)
      );
    case "AU05":
      return eventActor.role === "host" && eventActor.assertionSource.startsWith("host-adapter:");
    default:
      return false;
  }
}

function replayProtocolAndIdentity(session) {
  const protocol = session.protocol?.snapshot;
  if (!protocol || !Array.isArray(protocol.machines)) {
    throw new SessionIntegrityError("schema-invalid-session", "pinned protocol snapshot is absent");
  }
  const phaseMachine = protocol.machines.find((machine) => machine.id === "phase");
  const runtimeMachine = protocol.machines.find((machine) => machine.id === "runtime");
  if (!phaseMachine || !runtimeMachine) {
    throw new SessionIntegrityError("schema-invalid-session", "pinned protocol machines are incomplete");
  }
  const transitionIndex = new Map();
  for (const machine of [phaseMachine, runtimeMachine]) {
    for (const transition of machine.transitions) {
      if (transitionIndex.has(transition.id)) {
        throw new SessionIntegrityError("schema-invalid-session", `duplicate protocol transition ${transition.id}`);
      }
      transitionIndex.set(transition.id, { machine, transition, family: false });
    }
    for (const transition of machine.families) {
      if (transitionIndex.has(transition.id)) {
        throw new SessionIntegrityError("schema-invalid-session", `duplicate protocol transition ${transition.id}`);
      }
      transitionIndex.set(transition.id, { machine, transition, family: true });
    }
  }

  let phase = phaseMachine.initial;
  let runtime = "start";
  const acceptedIds = new Set();
  const eventById = new Map();
  for (const event of session.events) {
    if (
      typeof event.id !== "string" ||
      acceptedIds.has(event.id) ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(event.id)
    ) {
      throw new SessionIntegrityError("event-chain-invalid", `accepted event ID is unsafe or duplicated: ${event.id}`);
    }
    acceptedIds.add(event.id);
    eventById.set(event.id, event);
    const selected = transitionIndex.get(event.transitionId);
    if (!selected || event.eventId !== selected.transition.event) {
      throw new SessionIntegrityError("event-chain-invalid", `event ${event.id} has an unknown or mismatched transition/event`);
    }
    if (!authorityMatchesSnapshot(selected.transition.authority, event.actor, session)) {
      throw new SessionIntegrityError("event-chain-invalid", `event ${event.id} violates ${selected.transition.authority}`);
    }
    if (selected.machine.id === "phase") {
      if (runtime !== "active" && selected.transition.id !== "TF01") {
        throw new SessionIntegrityError("event-chain-invalid", `${event.transitionId} did not execute from active runtime`);
      }
      if (selected.family) {
        const selector = phaseMachine.selectors.find((item) => item.id === selected.transition.fromSelector);
        if (!selector?.members.includes(phase)) {
          throw new SessionIntegrityError("event-chain-invalid", `${event.transitionId} source selector does not contain ${phase}`);
        }
        if (selected.transition.runtimeSelector) {
          const selector = runtimeMachine.selectors.find((item) => item.id === selected.transition.runtimeSelector);
          if (!selector?.members.includes(runtime)) {
            throw new SessionIntegrityError("event-chain-invalid", `${event.transitionId} runtime selector does not contain ${runtime}`);
          }
        }
        if (selected.transition.to !== "same") phase = selected.transition.to;
      } else {
        if (selected.transition.from !== phase) {
          throw new SessionIntegrityError("event-chain-invalid", `${event.transitionId} source ${selected.transition.from} differs from ${phase}`);
        }
        phase = selected.transition.to;
      }
      if (event.transitionId === "T35" || event.transitionId === "TF01") runtime = "closed";
    } else {
      if (event.transitionId === "RT12" || event.transitionId === "RF01") {
        throw new SessionIntegrityError("event-chain-invalid", `${event.transitionId} may appear only as a coupled phase effect`);
      }
      if (selected.family) {
        const selector = runtimeMachine.selectors.find((item) => item.id === selected.transition.fromSelector);
        if (!selector?.members.includes(runtime)) {
          throw new SessionIntegrityError("event-chain-invalid", `${event.transitionId} source selector does not contain ${runtime}`);
        }
      } else if (selected.transition.from !== runtime) {
        throw new SessionIntegrityError("event-chain-invalid", `${event.transitionId} source ${selected.transition.from} differs from ${runtime}`);
      }
      runtime = selected.transition.to === "same" ? runtime : selected.transition.to;
    }
  }
  if (phase !== session.phase || runtime !== session.runtimeStatus) {
    throw new SessionIntegrityError(
      "snapshot-mismatch",
      `protocol replay ended at ${phase}/${runtime}, snapshot is ${session.phase}/${session.runtimeStatus}`
    );
  }

  const rejectionById = new Map();
  for (const rejection of session.rejections) {
    if (
      rejection.ruleId !== "RJ01" ||
      typeof rejection.eventId !== "string" ||
      acceptedIds.has(rejection.eventId) ||
      rejectionById.has(rejection.eventId)
    ) {
      throw new SessionIntegrityError("event-chain-invalid", "rejection IDs must be unique and disjoint from accepted events");
    }
    rejectionById.set(rejection.eventId, rejection);
  }

  const idempotencyKeys = Object.keys(session.idempotency);
  if (idempotencyKeys.length !== acceptedIds.size + rejectionById.size) {
    throw new SessionIntegrityError("event-chain-invalid", "idempotency ledger cardinality differs from event and rejection evidence");
  }
  for (const key of idempotencyKeys) {
    const record = session.idempotency[key];
    const event = eventById.get(key);
    const rejection = rejectionById.get(key);
    if (Boolean(event) === Boolean(rejection)) {
      throw new SessionIntegrityError("event-chain-invalid", `idempotency key ${key} is orphaned or ambiguous`);
    }
    const selectedTransitionId = event?.transitionId ?? rejection.selectedTransitionId;
    const selected = transitionIndex.get(selectedTransitionId);
    if (!selected) {
      throw new SessionIntegrityError("event-chain-invalid", `idempotency key ${key} selects unknown transition`);
    }
    const semanticPayload = event
      ? withoutKey(withoutKey(event.payload, "writerRecovery"), "trustedRuntimeEvidence")
      : rejection.payload;
    const eventName = event?.eventId ?? rejection.event;
    const eventActor = event?.actor ?? rejection.actor;
    const payloadDigest = sha256Value(semanticPayload);
    const commandDigest = sha256Value({
      event: eventName,
      actor: eventActor,
      payload: semanticPayload
    });
    const transitionBindingDigest = sha256Value({ commandDigest, selectedTransitionId });
    const expectedRevision = event ? event.ordinal + 1 : rejection.revision;
    const expectedRecordTransition = event ? selectedTransitionId : "REJECTION:RJ01";
    if (
      record.payloadDigest !== payloadDigest ||
      record.commandDigest !== commandDigest ||
      record.selectedTransitionId !== selectedTransitionId ||
      record.transitionBindingDigest !== transitionBindingDigest ||
      record.transitionId !== expectedRecordTransition ||
      record.revision !== expectedRevision ||
      eventName !== selected.transition.event ||
      !authorityMatchesSnapshot(selected.transition.authority, eventActor, session)
    ) {
      throw new SessionIntegrityError("event-chain-invalid", `idempotency binding fails for ${key}`);
    }
    if (
      rejection &&
      (
        rejection.payloadDigest !== payloadDigest ||
        rejection.commandDigest !== commandDigest ||
        rejection.transitionBindingDigest !== transitionBindingDigest
      )
    ) {
      throw new SessionIntegrityError("event-chain-invalid", `rejection binding fails for ${key}`);
    }
  }
  for (const eventId of acceptedIds) {
    if (!Object.hasOwn(session.idempotency, eventId)) {
      throw new SessionIntegrityError("event-chain-invalid", `accepted event ${eventId} lacks idempotency evidence`);
    }
  }
  for (const rejectionId of rejectionById.keys()) {
    if (!Object.hasOwn(session.idempotency, rejectionId)) {
      throw new SessionIntegrityError("event-chain-invalid", `rejection ${rejectionId} lacks idempotency evidence`);
    }
  }
}

export function verifySession(session) {
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    throw new SessionIntegrityError("schema-invalid-session", "session root must be an object");
  }
  assertCurrentExecutorSessionSchema(session);
  if (session.$schema !== CURRENT_EXECUTOR_SESSION_SCHEMA_ID) {
    throw new SessionIntegrityError(
      "schema-invalid-session",
      `session schema is not supported by the current executor: ${String(session.$schema)}`
    );
  }
  const schemaResult = validateGeneratedById(session.$schema, session);
  if (!schemaResult.valid) {
    throw new SessionIntegrityError(
      "schema-invalid-session",
      `session schema validation failed: ${schemaResult.errors.slice(0, 12).join("; ")}`
    );
  }
  if (
    !Array.isArray(session.events) ||
    !Number.isInteger(session.revision)
  ) {
    throw new SessionIntegrityError("schema-invalid-session", "session identity, revision or events are invalid");
  }
  let previousDigest = null;
  for (let index = 0; index < session.events.length; index += 1) {
    const event = session.events[index];
    if (
      event.ordinal !== index ||
      event.previousDigest !== previousDigest ||
      sha256Value(withoutKey(event, "digest")) !== event.digest
    ) {
      throw new SessionIntegrityError("event-chain-invalid", `event chain fails at ordinal ${index}`);
    }
    previousDigest = event.digest;
  }
  if (session.revision !== session.events.length) {
    throw new SessionIntegrityError("snapshot-mismatch", "session revision does not equal accepted-event count");
  }
  if (sha256Value(withoutKey(session, "snapshotDigest")) !== session.snapshotDigest) {
    throw new SessionIntegrityError("snapshot-mismatch", "materialized session digest does not match");
  }
  replayProtocolAndIdentity(session);
  verifySemanticProducts(session);
  const terminal = session.phase === "intent_captured" || session.phase === "aborted";
  if (terminal !== (session.runtimeStatus === "closed")) {
    throw new SessionIntegrityError("schema-invalid-session", "terminal phase and closed runtime are inconsistent");
  }
  return session;
}

export async function atomicWriteJson(target, value, { noReplace = false } = {}) {
  return atomicWriteBytes(target, Buffer.from(prettyJson(value), "utf8"), { noReplace });
}

export async function atomicWriteBytes(target, bytes, { noReplace = false } = {}) {
  const directory = path.dirname(target);
  await ensureDirectoryNoFollow(directory);
  const temporary = path.join(directory, `.${path.basename(target)}.${randomUUID()}.tmp`);
  const handle = await open(
    temporary,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  if (noReplace) {
    try {
      await link(temporary, target);
      await fsyncDirectory(directory);
    } catch (error) {
      await unlink(temporary).catch(() => {});
      if (error.code === "EEXIST") {
        throw Object.assign(new Error(`target already exists: ${target}`), { code: "EEXIST" });
      }
      throw error;
    }
    await unlink(temporary);
    await fsyncDirectory(directory);
    return;
  }
  await rename(temporary, target);
  await fsyncDirectory(directory);
}

function quarantineShape(value) {
  return Boolean(
    value &&
    value.$schema === CURRENT_EXECUTOR_QUARANTINE_SCHEMA_ID &&
    value.schemaVersion === "2.0.0" &&
    value.operation === "OQ01" &&
    value.package?.id === CURRENT_EXECUTOR_PACKAGE_ID &&
    value.package?.version === CURRENT_EXECUTOR_PACKAGE_VERSION &&
    typeof value.observedDigest === "string" &&
    typeof value.failureClass === "string"
  );
}

async function readExistingQuarantine(finalPath) {
  try {
    await ensureDirectoryNoFollow(path.dirname(finalPath));
    const value = JSON.parse((await readNoFollowFile(finalPath)).toString("utf8"));
    if (!quarantineShape(value)) {
      throw new SessionIntegrityError("quarantine-latch-corrupt", "existing quarantine latch is corrupt");
    }
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    if (error instanceof SessionIntegrityError) throw error;
    throw new SessionIntegrityError("quarantine-latch-corrupt", `cannot validate existing quarantine latch: ${error.message}`);
  }
}

async function validOrphanTemps(runDirectory, expectedLatch) {
  const names = (await readdir(runDirectory))
    .filter((name) => /^\.quarantine\.[0-9a-f]{64}\.[A-Za-z0-9-]+\.tmp$/.test(name))
    .sort();
  const complete = [];
  for (const name of names) {
    const absolute = path.join(runDirectory, name);
    try {
      const stat = await lstat(absolute);
      if (!stat.isFile() || stat.isSymbolicLink()) continue;
      const value = JSON.parse((await readNoFollowFile(absolute)).toString("utf8"));
      if (
        quarantineShape(value) &&
        sha256Value(value) === sha256Value(expectedLatch)
      ) {
        complete.push({ name, absolute, value });
      }
    } catch {
      // Preserve partial or invalid forensic debris.
    }
  }
  return complete;
}

export async function publishQuarantine(runDirectory, rawBytes, failureClass, evidence = []) {
  await ensureDirectoryNoFollow(runDirectory);
  const finalPath = path.join(runDirectory, "quarantine.json");
  const existing = await readExistingQuarantine(finalPath);
  if (existing) return existing;

  const digest = sha256Bytes(rawBytes);
  const latch = {
    $schema: CURRENT_EXECUTOR_QUARANTINE_SCHEMA_ID,
    schemaVersion: "2.0.0",
    operation: "OQ01",
    sessionMember: "session.json",
    runIdentity: {
      slug: path.basename(path.dirname(runDirectory)),
      sessionId: path.basename(runDirectory)
    },
    observedDigest: digest,
    failureClass,
    package: {
      id: CURRENT_EXECUTOR_PACKAGE_ID,
      version: CURRENT_EXECUTOR_PACKAGE_VERSION
    },
    detectedBy: "urn:mission-kit:survey-v2:runtime:storage",
    evidence,
    lastGoodRevision: null
  };

  const latchContentDigest = sha256Value(latch).slice("sha256:".length);
  const orphans = await validOrphanTemps(runDirectory, latch);
  let temporary;
  if (orphans.length) {
    temporary = orphans[0].absolute;
  } else {
    temporary = path.join(runDirectory, `.quarantine.${latchContentDigest}.${randomUUID()}.tmp`);
    const handle = await open(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600
    );
    try {
      await handle.writeFile(prettyJson(latch));
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  try {
    await link(temporary, finalPath);
    await fsyncDirectory(runDirectory);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return readExistingQuarantine(finalPath);
  }

  const published = await readExistingQuarantine(finalPath);
  const tempStat = await lstat(temporary);
  const finalStat = await lstat(finalPath);
  if (tempStat.ino === finalStat.ino && tempStat.dev === finalStat.dev) {
    await unlink(temporary);
    await fsyncDirectory(runDirectory);
  }
  return published;
}

export async function readVerifiedSession(runDirectory, { quarantineOnFailure = true } = {}) {
  await ensureDirectoryNoFollow(runDirectory);
  const finalQuarantine = await readExistingQuarantine(path.join(runDirectory, "quarantine.json"));
  if (finalQuarantine) {
    throw new SessionIntegrityError(finalQuarantine.failureClass, "session is quarantined");
  }
  const sessionPath = path.join(runDirectory, "session.json");
  let rawBytes;
  try {
    rawBytes = await readNoFollowFile(sessionPath);
  } catch (error) {
    if (error.code === "ENOENT") throw error;
    throw new SessionIntegrityError("unparseable-session", error.message);
  }
  try {
    const parsed = JSON.parse(rawBytes.toString("utf8"));
    return verifySession(parsed);
  } catch (error) {
    if (error instanceof MatchingFrozenPackageRequiredError) throw error;
    const integrity = error instanceof SessionIntegrityError
      ? error
      : new SessionIntegrityError("unparseable-session", error.message);
    if (quarantineOnFailure) {
      await publishQuarantine(runDirectory, rawBytes, integrity.failureClass, [integrity.message]);
    }
    throw integrity;
  }
}

export async function writeSession(runDirectory, session) {
  sealSession(session);
  verifySession(session);
  await atomicWriteJson(path.join(runDirectory, "session.json"), session);
}

export async function withSessionLock(runDirectory, operation) {
  return withSessionLockOptions(runDirectory, operation);
}

async function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    return true;
  }
}

async function cleanupFailedWriterLock(lockPath, handle, identity) {
  await handle.close().catch(() => {});
  if (!identity) return;
  const observed = await lstat(lockPath, { bigint: true }).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (
    !observed ||
    observed.isSymbolicLink() ||
    !observed.isFile() ||
    observed.dev !== identity.dev ||
    observed.ino !== identity.ino
  ) {
    return;
  }
  const failedPath = path.join(
    path.dirname(lockPath),
    `.session.lock.failed.${randomUUID()}`
  );
  try {
    await rename(lockPath, failedPath);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  const moved = await lstat(failedPath, { bigint: true });
  if (moved.dev !== identity.dev || moved.ino !== identity.ino) {
    throw new SessionLockedError(
      `writer lock changed during failed initialization; preserved unexpected inode at ${path.basename(failedPath)}`
    );
  }
  await unlink(failedPath);
  await fsyncDirectory(path.dirname(lockPath));
}

async function acquireWriterLock(lockPath, staleAfterMs) {
  const lockRecord = {
    schemaVersion: "1.0.0",
    pid: process.pid,
    createdAt: new Date().toISOString(),
    nonce: randomUUID()
  };
  let staleLockEvidence = null;
  let stalePath = null;
  let staleIdentity = null;
  while (true) {
    let handle;
    let createdIdentity;
    try {
      handle = await open(
        lockPath,
        constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
        0o600
      );
      createdIdentity = await handle.stat({ bigint: true });
      await handle.writeFile(prettyJson(lockRecord));
      await handle.sync();
      const identity = await handle.stat({ bigint: true });
      return {
        handle,
        identity: {
          dev: identity.dev,
          ino: identity.ino,
          nonce: lockRecord.nonce,
          digest: sha256Value(lockRecord)
        },
        staleLockEvidence,
        stalePath,
        staleIdentity
      };
    } catch (error) {
      if (handle) {
        await cleanupFailedWriterLock(
          lockPath,
          handle,
          createdIdentity
        );
      }
      if (error.code !== "EEXIST") {
        if (error.code === "ELOOP") throw new SessionLockedError(`writer lock path is a symlink: ${lockPath}`);
        throw error;
      }
    }

    let existingBytes;
    let existing;
    let existingIdentity;
    try {
      const observation = await readNoFollowIdentity(lockPath);
      existingBytes = observation.bytes;
      existingIdentity = observation.stat;
      existing = JSON.parse(existingBytes.toString("utf8"));
    } catch (error) {
      throw new SessionLockedError(`writer lock is unreadable and fails closed: ${error.message}`);
    }
    if (
      !existing ||
      !Number.isInteger(existing.pid) ||
      typeof existing.createdAt !== "string" ||
      !Number.isFinite(Date.parse(existing.createdAt))
    ) {
      throw new SessionLockedError("writer lock record is malformed and fails closed");
    }
    if (await processIsAlive(existing.pid)) {
      throw new SessionLockedError(`writer lock held by live process ${existing.pid}`);
    }
    const age = Date.now() - Date.parse(existing.createdAt);
    if (age < staleAfterMs) {
      throw new SessionLockedError(`dead-owner writer lock is only ${age}ms old; stale threshold is ${staleAfterMs}ms`);
    }
    const staleDigest = sha256Bytes(existingBytes).slice("sha256:".length);
    stalePath = path.join(path.dirname(lockPath), `.session.lock.stale.${staleDigest}.${randomUUID()}`);
    const immediatelyBefore = await lstat(lockPath, { bigint: true }).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (
      !immediatelyBefore ||
      immediatelyBefore.isSymbolicLink() ||
      !immediatelyBefore.isFile() ||
      immediatelyBefore.dev !== existingIdentity.dev ||
      immediatelyBefore.ino !== existingIdentity.ino ||
      immediatelyBefore.size !== existingIdentity.size
    ) {
      throw new SessionLockedError("writer lock changed after stale-owner observation; recovery fails closed");
    }
    const confirmation = await readNoFollowIdentity(lockPath);
    if (
      confirmation.stat.dev !== existingIdentity.dev ||
      confirmation.stat.ino !== existingIdentity.ino ||
      sha256Bytes(confirmation.bytes) !== `sha256:${staleDigest}`
    ) {
      throw new SessionLockedError("writer lock bytes changed before stale recovery; recovery fails closed");
    }
    try {
      await rename(lockPath, stalePath);
      const moved = await lstat(stalePath, { bigint: true });
      if (moved.dev !== existingIdentity.dev || moved.ino !== existingIdentity.ino) {
        throw new SessionLockedError("stale recovery moved a different writer lock; recovery fails closed");
      }
      await fsyncDirectory(path.dirname(lockPath));
      staleLockEvidence = {
        recoveredOwnerPid: existing.pid,
        recoveredLockDigest: `sha256:${staleDigest}`,
        recoveredAt: lockRecord.createdAt
      };
      staleIdentity = {
        dev: moved.dev,
        ino: moved.ino,
        nonce: existing.nonce,
        digest: sha256Value(existing)
      };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function lockPathMatches(lockPath, identity) {
  try {
    const observed = await readNoFollowIdentity(lockPath);
    const record = JSON.parse(observed.bytes.toString("utf8"));
    return (
      observed.stat.dev === identity.dev &&
      observed.stat.ino === identity.ino &&
      record.nonce === identity.nonce &&
      sha256Value(record) === identity.digest
    );
  } catch {
    return false;
  }
}

export async function withSessionLockOptions(
  runDirectory,
  operation,
  { staleAfterMs = 30000 } = {}
) {
  await ensureDirectoryNoFollow(runDirectory);
  const lockPath = path.join(runDirectory, "session.lock");
  const acquired = await acquireWriterLock(lockPath, staleAfterMs);
  let operationError;
  try {
    return await operation({ staleLockEvidence: acquired.staleLockEvidence });
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    await acquired.handle.close().catch(() => {});
    const owned = await lockPathMatches(lockPath, acquired.identity);
    if (owned) {
      const releasePath = path.join(
        runDirectory,
        `.session.lock.release.${acquired.identity.nonce}.${randomUUID()}`
      );
      await rename(lockPath, releasePath);
      if (await lockPathMatches(releasePath, acquired.identity)) {
        await unlink(releasePath);
      } else {
        throw new SessionLockedError(
          `writer lock changed at release; preserved unexpected inode at ${path.basename(releasePath)}`
        );
      }
    } else if (!operationError) {
      throw new SessionLockedError("writer lock path no longer matches the acquired inode and token; refusing unlink");
    }
    if (
      acquired.stalePath &&
      acquired.staleIdentity &&
      await lockPathMatches(acquired.stalePath, acquired.staleIdentity)
    ) {
      const cleanupPath = `${acquired.stalePath}.cleanup.${randomUUID()}`;
      await rename(acquired.stalePath, cleanupPath);
      if (await lockPathMatches(cleanupPath, acquired.staleIdentity)) {
        await unlink(cleanupPath);
      }
    }
    await fsyncDirectory(runDirectory).catch(() => {});
  }
}
