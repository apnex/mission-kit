import { canonicalize, sha256Bytes } from "../kernel/canonical.mjs";
import {
  resourceReferenceFrom,
  resourceSemanticDigest
} from "../kernel/digests.mjs";
import {
  validateContractSemantics
} from "../kernel/contract-semantics.mjs";

export const SURVEY_PROTOCOL_V1_SCHEMA_ID =
  "urn:mission-kit:survey-v2:schema:protocol:v1";
export const SURVEY_PROTOCOL_V2_SCHEMA_ID =
  "urn:mission-kit:survey-v2:schema:protocol:v2";
export const PAIRED_STATE_MATRIX_SCHEMA_ID =
  "urn:mission-kit:survey-v2:schema:paired-state-matrix:v2";
export const PROTOCOL_SELECTION_SCHEMA_ID =
  "urn:mission-kit:survey-v2:schema:protocol-selection:v2";
export const SURVEY_PROTOCOL_ID =
  "urn:mission-kit:survey-v2:protocol:survey";
export const SURVEY_PACKAGE_ID =
  "urn:mission-kit:survey-v2:package:survey-v2";
export const SURVEY_AUTHORING_PROTOCOL_NAME = "survey-v2-authoring";

const AUTHORING_API_VERSION = "authoring.mission-kit/v1alpha1";
const AUTHORING_KIND = "AuthoringProtocol";
const V1_VERSION = "1.0.0";
const V2_VERSION = "2.0.0";
const PACKAGE_VERSION = "1.0.0";
const FROZEN_V1_PROJECTION_DIGEST =
  "sha256:6603b777b82783176fca6129bfecde7a6e253f5be86f9becf94703d818b9757c";
const RETIRED_PHASE_TRANSITION_IDS = Object.freeze([
  "T42",
  "T43",
  "T44",
  "T45",
  "T46"
]);

const EXPECTED_AUTHORING_STATES = Object.freeze([
  { id: "new", label: "New", class: "wait" },
  {
    id: "survey_frame_required",
    label: "Author Survey frame",
    class: "task",
    taskId: "author-survey-frame"
  },
  {
    id: "round_1_frame_required",
    label: "Author Round 1 frame",
    class: "task",
    taskId: "author-round-1-frame"
  },
  {
    id: "round_1_question_frames_required",
    label: "Author Round 1 question frame set",
    class: "task",
    taskId: "author-round-1-frame-set"
  },
  {
    id: "round_1_questions_required",
    label: "Author Round 1 questions",
    class: "task",
    taskId: "author-round-1-questions"
  },
  {
    id: "waiting_for_round_1_responses",
    label: "Wait for Round 1 responses",
    class: "wait"
  },
  {
    id: "round_1_interpretation_required",
    label: "Author Round 1 interpretation",
    class: "task",
    taskId: "author-round-1-interpretation"
  },
  {
    id: "waiting_for_round_2_design",
    label: "Wait for Round 2 design",
    class: "wait"
  },
  {
    id: "round_2_frame_required",
    label: "Author Round 2 frame",
    class: "task",
    taskId: "author-round-2-frame"
  },
  {
    id: "round_2_question_frames_required",
    label: "Author Round 2 question frame set",
    class: "task",
    taskId: "author-round-2-frame-set"
  },
  {
    id: "round_2_questions_required",
    label: "Author Round 2 questions",
    class: "task",
    taskId: "author-round-2-questions"
  },
  {
    id: "waiting_for_round_2_responses",
    label: "Wait for Round 2 responses",
    class: "wait"
  },
  {
    id: "round_2_interpretation_required",
    label: "Author Round 2 interpretation",
    class: "task",
    taskId: "author-round-2-interpretation"
  },
  {
    id: "waiting_for_composite_phase",
    label: "Wait for composite phase",
    class: "wait"
  },
  {
    id: "composite_required",
    label: "Author composite",
    class: "task",
    taskId: "author-composite"
  },
  { id: "candidate_ready", label: "Candidate ready", class: "wait" },
  { id: "complete", label: "Complete", class: "terminal" },
  { id: "aborted", label: "Aborted", class: "terminal" }
]);

const EXPECTED_AUTHORING_TRANSITIONS = Object.freeze([
  ["AT01", "new", "BEGIN_AUTHORING", "survey_frame_required", "initialized-survey-inputs"],
  ["AT02", "survey_frame_required", "SUBMIT_SURVEY_FRAME", "round_1_frame_required", "current-survey-frame-assignment"],
  ["AT03", "round_1_frame_required", "SUBMIT_ROUND_1_FRAME", "round_1_question_frames_required", "frozen-survey-frame"],
  ["AT04", "round_1_question_frames_required", "SUBMIT_ROUND_1_FRAME_SET", "round_1_questions_required", "frozen-round-1-parent-closure"],
  ["AT05", "round_1_questions_required", "SUBMIT_ROUND_1_QUESTIONS", "waiting_for_round_1_responses", "frozen-round-1-frame-set"],
  ["AT06", "waiting_for_round_1_responses", "BEGIN_R1_INTERPRETATION_AUTHORING", "round_1_interpretation_required", "exact-round-1-responses"],
  ["AT07", "round_1_interpretation_required", "SUBMIT_ROUND_1_INTERPRETATION", "waiting_for_round_2_design", "exact-round-1-interpretation-ancestry"],
  ["AT08", "waiting_for_round_2_design", "BEGIN_R2_AUTHORING", "round_2_frame_required", "sealed-round-1-interpretation"],
  ["AT09", "round_2_frame_required", "SUBMIT_ROUND_2_FRAME", "round_2_question_frames_required", "round-2-frame-ancestry"],
  ["AT10", "round_2_question_frames_required", "SUBMIT_ROUND_2_FRAME_SET", "round_2_questions_required", "frozen-round-2-parent-closure"],
  ["AT11", "round_2_questions_required", "SUBMIT_ROUND_2_QUESTIONS", "waiting_for_round_2_responses", "frozen-round-2-frame-set"],
  ["AT12", "waiting_for_round_2_responses", "BEGIN_R2_INTERPRETATION_AUTHORING", "round_2_interpretation_required", "exact-round-2-responses"],
  ["AT13", "round_2_interpretation_required", "SUBMIT_ROUND_2_INTERPRETATION", "waiting_for_composite_phase", "exact-round-2-interpretation-ancestry"],
  ["AT14", "waiting_for_composite_phase", "BEGIN_COMPOSITE_AUTHORING", "composite_required", "sealed-interpretation-pair"],
  ["AT15", "composite_required", "SUBMIT_COMPOSITE", "candidate_ready", "complete-composite-ancestry"],
  ["AT16", "candidate_ready", "CLOSE_AUTHORING", "complete", "exact-terminal-handoff"],
  ["AC01", "candidate_ready", "REOPEN_COMPOSITE_AFTER_VALIDATION", "composite_required", "candidate-validation-evidence"],
  ["AC02", "candidate_ready", "REOPEN_COMPOSITE_AFTER_RETURN", "composite_required", "composite-revision-directive"],
  ["AC03", "candidate_ready", "REOPEN_R2_INTERPRETATION", "round_2_interpretation_required", "round-2-revision-directive"],
  ["AC04", "candidate_ready", "REOPEN_COMPOSITE_AFTER_FINALIZATION", "composite_required", "composite-finalization-diagnostic"],
  ["AC05", "candidate_ready", "REOPEN_R2_AFTER_FINALIZATION", "round_2_interpretation_required", "round-2-finalization-diagnostic"]
]);

const EXPECTED_ABORT_SOURCES = Object.freeze(
  EXPECTED_AUTHORING_STATES
    .filter((state) => state.class !== "terminal")
    .map((state) => state.id)
    .sort()
);

const EXPECTED_AUTHORING_COUPLINGS = Object.freeze([
  ["T02", "AT01"],
  ["T03", "AT05"],
  ["T11", "AT06"],
  ["T12", "AT07"],
  ["T13", "AT08"],
  ["T14", "AT11"],
  ["T22", "AT12"],
  ["T23", "AT13"],
  ["T24", "AT14"],
  ["T25", "AT15"],
  ["T27", "AC01"],
  ["T33", "AC02"],
  ["T35", "AT16"],
  ["T37", "AC03"],
  ["T38", "AC04"],
  ["T40", "AC05"],
  ["TF01", "AF01"]
]);

const EXPECTED_PHASE_TRANSITION_IDS = Object.freeze([
  ...Array.from({ length: 41 }, (_, index) => `T${String(index + 1).padStart(2, "0")}`),
  "T47"
]);
const EXPECTED_RUNTIME_TRANSITION_IDS = Object.freeze(
  Array.from({ length: 13 }, (_, index) => `RT${String(index + 1).padStart(2, "0")}`)
);
const EXPECTED_PHASE_FAMILY_IDS = Object.freeze(["TF01", "TF02"]);
const EXPECTED_RUNTIME_FAMILY_IDS = Object.freeze(["RF01"]);

function makePairs() {
  const pairs = [];
  const add = (authoringState, phaseStates, pathClasses = ["mainline"]) => {
    for (const phaseState of phaseStates) {
      pairs.push(Object.freeze({
        authoringState,
        phaseState,
        pathClasses: Object.freeze([...pathClasses])
      }));
    }
  };
  add("new", ["new", "initializing", "initialized"]);
  for (const authoringState of [
    "survey_frame_required",
    "round_1_frame_required",
    "round_1_question_frames_required",
    "round_1_questions_required"
  ]) {
    add(authoringState, ["round_1_drafting"]);
  }
  add("waiting_for_round_1_responses", [
    "round_1_q1_ready",
    "round_1_q1_awaiting",
    "round_1_q2_ready",
    "round_1_q2_awaiting",
    "round_1_q3_ready",
    "round_1_q3_awaiting",
    "round_1_responses_complete"
  ]);
  add("round_1_interpretation_required", ["round_1_interpreting"]);
  add("waiting_for_round_2_design", ["round_1_interpreted"]);
  for (const authoringState of [
    "round_2_frame_required",
    "round_2_question_frames_required",
    "round_2_questions_required"
  ]) {
    add(authoringState, ["round_2_drafting"]);
  }
  add("waiting_for_round_2_responses", [
    "round_2_q4_ready",
    "round_2_q4_awaiting",
    "round_2_q5_ready",
    "round_2_q5_awaiting",
    "round_2_q6_ready",
    "round_2_q6_awaiting",
    "round_2_responses_complete"
  ]);
  add(
    "round_2_interpretation_required",
    ["round_2_interpreting"],
    ["mainline", "correction"]
  );
  add("waiting_for_composite_phase", ["round_2_interpreted"]);
  add(
    "composite_required",
    ["composite_drafting"],
    ["mainline", "correction"]
  );
  add(
    "candidate_ready",
    ["composite_candidate"],
    ["mainline", "correction"]
  );
  add("candidate_ready", [
    "walkthrough_ready",
    "walkthrough_in_progress",
    "awaiting_ratification"
  ]);
  add(
    "candidate_ready",
    ["revision_requested"],
    ["mainline", "correction"]
  );
  add("candidate_ready", ["ratified"]);
  add(
    "candidate_ready",
    ["finalizing"],
    ["mainline", "correction"]
  );
  add("complete", ["intent_captured"], ["mainline", "terminal"]);
  add("aborted", ["aborted"], ["abort", "terminal"]);
  return Object.freeze(pairs);
}

export const EXPECTED_PAIRED_STATES = makePairs();

function issue(code, field, reason) {
  return Object.freeze({ code, field, reason });
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function pairKey(pair) {
  return `${pair.authoringState}\u0000${pair.phaseState}`;
}

function duplicateIssues(items, field, identity, code) {
  const issues = [];
  const first = new Map();
  items.forEach((item, index) => {
    const key = identity(item);
    if (first.has(key)) {
      issues.push(issue(
        code,
        `${field}/${index}`,
        `Duplicate identity also appears at ${field}/${first.get(key)}.`
      ));
    } else {
      first.set(key, index);
    }
  });
  return issues;
}

function exactIdsIssue(items, expected, field, code) {
  const actual = items.map((item) => item.id);
  if (!same(actual, expected)) {
    return [issue(
      code,
      field,
      "The ordered identifier inventory differs from the canonical contract."
    )];
  }
  return [];
}

function expectedAuthoringReference(authoringProtocol) {
  if (!authoringProtocol) return undefined;
  return resourceReferenceFrom(authoringProtocol);
}

export function surveyAuthoringProtocolDigest(authoringProtocol) {
  return resourceSemanticDigest(authoringProtocol);
}

export function protocolSourceBytesDigest(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("protocol source bytes must be a Uint8Array");
  }
  return sha256Bytes(bytes);
}

export function validateSurveyAuthoringProtocol(authoringProtocol) {
  const issues = [...validateContractSemantics(authoringProtocol)];
  if (
    authoringProtocol.apiVersion !== AUTHORING_API_VERSION ||
    authoringProtocol.kind !== AUTHORING_KIND ||
    authoringProtocol.metadata?.name !== SURVEY_AUTHORING_PROTOCOL_NAME
  ) {
    issues.push(issue(
      "SURVEY_AUTHORING_IDENTITY_MISMATCH",
      "",
      "The canonical Survey AuthoringProtocol resource identity differs."
    ));
  }
  if (authoringProtocol.spec?.initialState !== "new") {
    issues.push(issue(
      "SURVEY_AUTHORING_INITIAL_STATE_MISMATCH",
      "/spec/initialState",
      "Survey authoring must start in new."
    ));
  }
  const states = authoringProtocol.spec?.states ?? [];
  if (!same(states, EXPECTED_AUTHORING_STATES)) {
    issues.push(issue(
      "SURVEY_AUTHORING_STATE_SET_MISMATCH",
      "/spec/states",
      "Survey authoring must declare the exact eighteen-state class and task inventory."
    ));
  }
  const transitions = authoringProtocol.spec?.transitions ?? [];
  const expectedIds = [
    ...EXPECTED_AUTHORING_TRANSITIONS.map(([id]) => id),
    "AF01"
  ];
  if (!same(transitions.map((transition) => transition.id), expectedIds)) {
    issues.push(issue(
      "SURVEY_AUTHORING_TRANSITION_SET_MISMATCH",
      "/spec/transitions",
      "Survey authoring must declare exactly AT01 through AT16, AC01 through AC05, and AF01."
    ));
  }
  for (const [id, sourceState, eventId, toState, guardId] of EXPECTED_AUTHORING_TRANSITIONS) {
    const index = transitions.findIndex((transition) => transition.id === id);
    const transition = transitions[index];
    const expected = {
      id,
      source: { mode: "single", stateId: sourceState },
      eventId,
      toState,
      guardIds: [guardId]
    };
    if (!transition || !same(transition, expected)) {
      issues.push(issue(
        "SURVEY_AUTHORING_TRANSITION_MISMATCH",
        index < 0 ? "/spec/transitions" : `/spec/transitions/${index}`,
        `${id} differs from the canonical Survey authoring edge.`
      ));
    }
  }
  const abortIndex = transitions.findIndex((transition) => transition.id === "AF01");
  const abort = transitions[abortIndex];
  const expectedAbort = {
    id: "AF01",
    source: {
      mode: "set",
      stateIds: EXPECTED_ABORT_SOURCES
    },
    eventId: "ABORT_AUTHORING",
    toState: "aborted",
    guardIds: ["exact-abort-evidence"]
  };
  if (!abort || !same(abort, expectedAbort)) {
    issues.push(issue(
      "SURVEY_AUTHORING_ABORT_FAMILY_MISMATCH",
      abortIndex < 0 ? "/spec/transitions" : `/spec/transitions/${abortIndex}`,
      "AF01 must be one generic source.mode=set family over every nonterminal authoring state."
    ));
  }
  const expectedEvents = expectedIds.map((id) => {
    if (id === "AF01") return "ABORT_AUTHORING";
    return EXPECTED_AUTHORING_TRANSITIONS.find(([candidate]) => candidate === id)[2];
  });
  if (!same(
    (authoringProtocol.spec?.events ?? []).map((event) => event.id),
    expectedEvents
  )) {
    issues.push(issue(
      "SURVEY_AUTHORING_EVENT_SET_MISMATCH",
      "/spec/events",
      "Survey authoring events differ from the complete transition surface."
    ));
  }
  const expectedGuards = [
    ...EXPECTED_AUTHORING_TRANSITIONS.map(([, , , , guardId]) => guardId),
    "exact-abort-evidence"
  ];
  if (!same(
    (authoringProtocol.spec?.guards ?? []).map((guard) => guard.id),
    expectedGuards
  )) {
    issues.push(issue(
      "SURVEY_AUTHORING_GUARD_SET_MISMATCH",
      "/spec/guards",
      "Survey authoring guards differ from the complete transition surface."
    ));
  }
  return Object.freeze(issues);
}

function machineClosureIssues(machine, machineIndex) {
  const issues = [];
  const base = `/machines/${machineIndex}`;
  const collections = [
    ["states", machine.states],
    ["events", machine.events],
    ["guards", machine.guards],
    ["actions", machine.actions],
    ["mutations", machine.mutations],
    ["authorities", machine.authorities],
    ["selectors", machine.selectors],
    ["transitions", machine.transitions],
    ["families", machine.families]
  ];
  for (const [name, items] of collections) {
    issues.push(...duplicateIssues(
      items,
      `${base}/${name}`,
      (item) => item.id,
      `PROTOCOL_${name.toUpperCase()}_DUPLICATE`
    ));
  }
  const stateIds = new Set(machine.states.map((state) => state.id));
  const eventIds = new Set(machine.events.map((item) => item.id));
  const guardIds = new Set(machine.guards.map((item) => item.id));
  const actionIds = new Set(machine.actions.map((item) => item.id));
  const mutationIds = new Set(machine.mutations.map((item) => item.id));
  const authorityIds = new Set(machine.authorities.map((item) => item.id));
  const selectors = new Map(machine.selectors.map((selector) => [selector.id, selector]));
  if (!stateIds.has(machine.initial)) {
    issues.push(issue(
      "PROTOCOL_INITIAL_STATE_UNRESOLVED",
      `${base}/initial`,
      "Machine initial state does not resolve."
    ));
  }
  for (const [selectorIndex, selector] of machine.selectors.entries()) {
    selector.members.forEach((member, memberIndex) => {
      if (!stateIds.has(member)) {
        issues.push(issue(
          "PROTOCOL_SELECTOR_STATE_UNRESOLVED",
          `${base}/selectors/${selectorIndex}/members/${memberIndex}`,
          "Selector member does not resolve in its machine."
        ));
      }
    });
  }
  const adjacency = new Map(machine.states.map((state) => [state.id, new Set()]));
  const directEdges = new Set();
  machine.transitions.forEach((transition, index) => {
    const field = `${base}/transitions/${index}`;
    if (transition.from !== "start" && !stateIds.has(transition.from)) {
      issues.push(issue("PROTOCOL_TRANSITION_SOURCE_UNRESOLVED", `${field}/from`, "Transition source does not resolve."));
    }
    if (!stateIds.has(transition.to)) {
      issues.push(issue("PROTOCOL_TRANSITION_TARGET_UNRESOLVED", `${field}/to`, "Transition target does not resolve."));
    }
    for (const [value, inventory, suffix] of [
      [transition.event, eventIds, "EVENT"],
      [transition.guard, guardIds, "GUARD"],
      [transition.action, actionIds, "ACTION"],
      [transition.mutation, mutationIds, "MUTATION"],
      [transition.authority, authorityIds, "AUTHORITY"]
    ]) {
      if (!inventory.has(value)) {
        issues.push(issue(
          `PROTOCOL_TRANSITION_${suffix}_UNRESOLVED`,
          field,
          `Transition ${suffix.toLowerCase()} does not resolve.`
        ));
      }
    }
    const edge = `${transition.from}\u0000${transition.event}`;
    if (directEdges.has(edge)) {
      issues.push(issue(
        "PROTOCOL_CONCRETE_EDGE_DUPLICATE",
        field,
        "Two transitions claim one source/event edge."
      ));
    }
    directEdges.add(edge);
    if (transition.from !== "start" && adjacency.has(transition.from)) {
      adjacency.get(transition.from).add(transition.to);
    }
  });
  machine.families.forEach((family, index) => {
    const field = `${base}/families/${index}`;
    const selector = selectors.get(family.fromSelector);
    if (!selector) {
      issues.push(issue(
        "PROTOCOL_FAMILY_SELECTOR_UNRESOLVED",
        `${field}/fromSelector`,
        "Transition-family selector does not resolve."
      ));
      return;
    }
    if (family.to !== "same" && !stateIds.has(family.to)) {
      issues.push(issue(
        "PROTOCOL_FAMILY_TARGET_UNRESOLVED",
        `${field}/to`,
        "Transition-family target does not resolve."
      ));
    }
    for (const [value, inventory, suffix] of [
      [family.event, eventIds, "EVENT"],
      [family.guard, guardIds, "GUARD"],
      [family.action, actionIds, "ACTION"],
      [family.mutation, mutationIds, "MUTATION"],
      [family.authority, authorityIds, "AUTHORITY"]
    ]) {
      if (!inventory.has(value)) {
        issues.push(issue(
          `PROTOCOL_FAMILY_${suffix}_UNRESOLVED`,
          field,
          `Transition-family ${suffix.toLowerCase()} does not resolve.`
        ));
      }
    }
    for (const member of selector.members) {
      if (adjacency.has(member)) {
        adjacency.get(member).add(family.to === "same" ? member : family.to);
      }
    }
  });
  if (stateIds.has(machine.initial)) {
    const reached = new Set([machine.initial]);
    const pending = [machine.initial];
    while (pending.length > 0) {
      for (const target of adjacency.get(pending.shift()) ?? []) {
        if (stateIds.has(target) && !reached.has(target)) {
          reached.add(target);
          pending.push(target);
        }
      }
    }
    machine.states.forEach((state, index) => {
      if (!reached.has(state.id)) {
        issues.push(issue(
          "PROTOCOL_STATE_UNREACHABLE",
          `${base}/states/${index}`,
          "Machine state is unreachable from its initial state."
        ));
      }
      const exits = adjacency.get(state.id)?.size ?? 0;
      if (!state.terminal && exits === 0) {
        issues.push(issue(
          "PROTOCOL_NONTERMINAL_WITHOUT_EXIT",
          `${base}/states/${index}`,
          "Every nonterminal machine state requires an authorized exit."
        ));
      }
      if (state.terminal && exits !== 0) {
        issues.push(issue(
          "PROTOCOL_TERMINAL_HAS_EXIT",
          `${base}/states/${index}`,
          "A terminal machine state cannot have an exit."
        ));
      }
    });
  }
  return issues;
}

export function validateSurveyProtocolV2(
  protocol,
  { authoringProtocol } = {}
) {
  const issues = [];
  if (
    protocol.$schema !== SURVEY_PROTOCOL_V2_SCHEMA_ID ||
    protocol.schemaVersion !== V2_VERSION ||
    protocol.id !== SURVEY_PROTOCOL_ID
  ) {
    issues.push(issue(
      "CANDIDATE_PROTOCOL_IDENTITY_MISMATCH",
      "",
      "Candidate protocol identity or version differs from the v2 contract."
    ));
  }
  const machines = protocol.machines ?? [];
  if (!same(machines.map((machine) => machine.id), ["phase", "runtime"])) {
    issues.push(issue(
      "CANDIDATE_MACHINE_SET_MISMATCH",
      "/machines",
      "Candidate protocol must represent exactly phase then runtime and must not duplicate authoring states."
    ));
  }
  machines.forEach((machine, index) => {
    issues.push(...machineClosureIssues(machine, index));
  });
  const phase = machines.find((machine) => machine.id === "phase");
  const runtime = machines.find((machine) => machine.id === "runtime");
  if (phase) {
    issues.push(
      ...exactIdsIssue(
        phase.transitions,
        EXPECTED_PHASE_TRANSITION_IDS,
        "/machines/0/transitions",
        "CANDIDATE_PHASE_TRANSITION_SET_MISMATCH"
      ),
      ...exactIdsIssue(
        phase.families,
        EXPECTED_PHASE_FAMILY_IDS,
        "/machines/0/families",
        "CANDIDATE_PHASE_FAMILY_SET_MISMATCH"
      )
    );
    const phaseDefinitionIds = [
      ...phase.events,
      ...phase.guards,
      ...phase.actions,
      ...phase.mutations
    ].map((item) => item.id);
    for (const retiredId of RETIRED_PHASE_TRANSITION_IDS) {
      const suffix = retiredId.slice(1);
      if (
        phase.transitions.some((transition) => transition.id === retiredId) ||
        phaseDefinitionIds.some((id) => (
          id === `G${suffix}` ||
          id === `A${suffix}` ||
          id === `M${suffix}` ||
          id === `SAVE_R1_INSTRUMENT_DRAFT` && retiredId === "T42" ||
          id === `SAVE_R1_INTERPRETATION_DRAFT` && retiredId === "T43" ||
          id === `SAVE_R2_INSTRUMENT_DRAFT` && retiredId === "T44" ||
          id === `SAVE_R2_INTERPRETATION_DRAFT` && retiredId === "T45" ||
          id === `SAVE_COMPOSITE_DRAFT` && retiredId === "T46"
        ))
      ) {
        issues.push(issue(
          "RETIRED_PHASE_TRANSITION_PRESENT",
          "/machines/0",
          `${retiredId} or one of its private definitions remains in candidate protocol 2.x.`
        ));
      }
    }
  }
  if (runtime) {
    issues.push(
      ...exactIdsIssue(
        runtime.transitions,
        EXPECTED_RUNTIME_TRANSITION_IDS,
        "/machines/1/transitions",
        "CANDIDATE_RUNTIME_TRANSITION_SET_MISMATCH"
      ),
      ...exactIdsIssue(
        runtime.families,
        EXPECTED_RUNTIME_FAMILY_IDS,
        "/machines/1/families",
        "CANDIDATE_RUNTIME_FAMILY_SET_MISMATCH"
      )
    );
  }
  if (
    phase?.transitions.find((transition) => transition.id === "T35")
      ?.coupledTransition !== "RT12" ||
    runtime?.transitions.find((transition) => transition.id === "RT12")
      ?.coupledTransition !== "T35" ||
    phase?.families.find((family) => family.id === "TF01")
      ?.coupledFamily !== "RF01" ||
    runtime?.families.find((family) => family.id === "RF01")
      ?.coupledFamily !== "TF01"
  ) {
    issues.push(issue(
      "CANDIDATE_RUNTIME_COUPLING_MISMATCH",
      "/machines",
      "Terminal success or abort runtime coupling differs from the atomic v2 contract."
    ));
  }
  const actualCouplings = (protocol.authoringCouplings ?? []).map((coupling) => [
    coupling.phaseTransitionId,
    coupling.authoringTransitionId
  ]);
  if (
    !same(actualCouplings, EXPECTED_AUTHORING_COUPLINGS) ||
    (protocol.authoringCouplings ?? []).some((coupling) => coupling.atomic !== true)
  ) {
    issues.push(issue(
      "AUTHORING_COUPLING_SET_MISMATCH",
      "/authoringCouplings",
      "Candidate protocol must declare the exact seventeen atomic authoring/phase couplings."
    ));
  }
  if (authoringProtocol) {
    const expected = expectedAuthoringReference(authoringProtocol);
    if (!same(protocol.authoringProtocol, expected)) {
      issues.push(issue(
        "AUTHORING_PROTOCOL_DIGEST_MISMATCH",
        "/authoringProtocol",
        "Candidate protocol does not bind the exact canonical AuthoringProtocol semantic digest."
      ));
    }
    const authoringTransitionIds = new Set(
      (authoringProtocol.spec?.transitions ?? []).map((transition) => transition.id)
    );
    (protocol.authoringCouplings ?? []).forEach((coupling, index) => {
      if (!authoringTransitionIds.has(coupling.authoringTransitionId)) {
        issues.push(issue(
          "AUTHORING_COUPLING_UNRESOLVED",
          `/authoringCouplings/${index}/authoringTransitionId`,
          "Coupled authoring transition does not resolve in the bound protocol."
        ));
      }
    });
  } else if (
    protocol.authoringProtocol?.apiVersion !== AUTHORING_API_VERSION ||
    protocol.authoringProtocol?.kind !== AUTHORING_KIND ||
    protocol.authoringProtocol?.name !== SURVEY_AUTHORING_PROTOCOL_NAME
  ) {
    issues.push(issue(
      "AUTHORING_PROTOCOL_REFERENCE_MISMATCH",
      "/authoringProtocol",
      "Candidate protocol authoring reference identity differs."
    ));
  }
  const phaseTransitionIds = new Set([
    ...(phase?.transitions ?? []).map((transition) => transition.id),
    ...(phase?.families ?? []).map((family) => family.id)
  ]);
  (protocol.authoringCouplings ?? []).forEach((coupling, index) => {
    if (!phaseTransitionIds.has(coupling.phaseTransitionId)) {
      issues.push(issue(
        "PHASE_COUPLING_UNRESOLVED",
        `/authoringCouplings/${index}/phaseTransitionId`,
        "Coupled phase transition does not resolve in candidate protocol."
      ));
    }
  });
  return Object.freeze(issues);
}

export function isLegalPairedState(
  matrix,
  { authoringState, phaseState }
) {
  return (matrix.pairs ?? []).some((pair) => (
    pair.authoringState === authoringState &&
    pair.phaseState === phaseState
  ));
}

export function validatePairedState(
  matrix,
  { authoringState, phaseState }
) {
  if (isLegalPairedState(matrix, { authoringState, phaseState })) {
    return Object.freeze([]);
  }
  return Object.freeze([issue(
    "PAIRED_STATE_ILLEGAL",
    "",
    "Authoring and phase state combination is absent from the canonical legal matrix."
  )]);
}

export function validatePairedStateMatrix(
  matrix,
  {
    authoringProtocol,
    protocol,
    protocolSourceDigest
  } = {}
) {
  const issues = [];
  if (
    matrix.$schema !== PAIRED_STATE_MATRIX_SCHEMA_ID ||
    matrix.schemaVersion !== V2_VERSION ||
    matrix.id !== "urn:mission-kit:survey-v2:paired-state-matrix:survey-v2"
  ) {
    issues.push(issue(
      "PAIRED_STATE_MATRIX_IDENTITY_MISMATCH",
      "",
      "Paired-state matrix identity or version differs from the canonical v2 contract."
    ));
  }
  if (
    matrix.protocol?.id !== SURVEY_PROTOCOL_ID ||
    matrix.protocol?.schemaVersion !== V2_VERSION
  ) {
    issues.push(issue(
      "PAIRED_STATE_PROTOCOL_BINDING_MISMATCH",
      "/protocol",
      "Paired-state matrix protocol identity or version differs."
    ));
  }
  if (
    protocolSourceDigest &&
    matrix.protocol?.sourceBytesDigest !== protocolSourceDigest
  ) {
    issues.push(issue(
      "PAIRED_STATE_PROTOCOL_DIGEST_MISMATCH",
      "/protocol/sourceBytesDigest",
      "Paired-state matrix does not bind the exact candidate protocol source bytes."
    ));
  }
  if (
    protocol &&
    (
      matrix.protocol?.id !== protocol.id ||
      matrix.protocol?.schemaVersion !== protocol.schemaVersion
    )
  ) {
    issues.push(issue(
      "PAIRED_STATE_PROTOCOL_MISMATCH",
      "/protocol",
      "Paired-state matrix protocol pin differs from the candidate protocol."
    ));
  }
  if (
    authoringProtocol &&
    !same(matrix.authoringProtocol, expectedAuthoringReference(authoringProtocol))
  ) {
    issues.push(issue(
      "PAIRED_STATE_AUTHORING_DIGEST_MISMATCH",
      "/authoringProtocol",
      "Paired-state matrix does not bind the exact canonical AuthoringProtocol."
    ));
  }
  const pairs = matrix.pairs ?? [];
  issues.push(...duplicateIssues(
    pairs,
    "/pairs",
    pairKey,
    "PAIRED_STATE_DUPLICATE"
  ));
  const authoringStateIds = new Set(
    (authoringProtocol?.spec?.states ?? EXPECTED_AUTHORING_STATES)
      .map((state) => state.id)
  );
  const phase = protocol?.machines?.find((machine) => machine.id === "phase");
  const phaseStateIds = new Set(
    (phase?.states ?? [
      ...new Map(
        EXPECTED_PAIRED_STATES.map((pair) => [
          pair.phaseState,
          { id: pair.phaseState }
        ])
      ).values()
    ]).map((state) => state.id)
  );
  const expectedByKey = new Map(
    EXPECTED_PAIRED_STATES.map((pair) => [pairKey(pair), pair])
  );
  const seen = new Set();
  pairs.forEach((pair, index) => {
    const field = `/pairs/${index}`;
    const authoringResolved = authoringStateIds.has(pair.authoringState);
    const phaseResolved = phaseStateIds.has(pair.phaseState);
    if (!authoringResolved) {
      issues.push(issue(
        "PAIRED_STATE_AUTHORING_UNRESOLVED",
        `${field}/authoringState`,
        "Paired authoring state does not resolve in the canonical AuthoringProtocol."
      ));
    }
    if (!phaseResolved) {
      issues.push(issue(
        "PAIRED_STATE_PHASE_UNRESOLVED",
        `${field}/phaseState`,
        "Paired phase state does not resolve in candidate protocol 2.x."
      ));
    }
    const key = pairKey(pair);
    const expected = expectedByKey.get(key);
    if (authoringResolved && phaseResolved && !expected) {
      issues.push(issue(
        "PAIRED_STATE_ILLEGAL",
        field,
        "Resolved states form a combination outside the canonical legal matrix."
      ));
    } else if (expected && !same(pair.pathClasses, expected.pathClasses)) {
      issues.push(issue(
        "PAIRED_STATE_CLASS_MISMATCH",
        `${field}/pathClasses`,
        "Pair path classes differ from the canonical mainline/correction/abort/terminal classification."
      ));
    }
    seen.add(key);
  });
  const missing = EXPECTED_PAIRED_STATES.filter(
    (pair) => !seen.has(pairKey(pair))
  );
  if (missing.length > 0) {
    issues.push(issue(
      "PAIRED_STATE_SET_INCOMPLETE",
      "/pairs",
      `Canonical matrix is missing ${missing.length} legal pair(s).`
    ));
  }
  if (
    pairs.length === EXPECTED_PAIRED_STATES.length &&
    pairs.every((pair) => expectedByKey.has(pairKey(pair))) &&
    !same(pairs, EXPECTED_PAIRED_STATES)
  ) {
    issues.push(issue(
      "PAIRED_STATE_ORDER_INVALID",
      "/pairs",
      "Canonical legal pairs or path classes are not in deterministic order."
    ));
  }
  return Object.freeze(issues);
}

const EXPECTED_DEFAULT_SELECTION = Object.freeze({
  id: "frozen-v1",
  activation: "implicit",
  status: "frozen",
  package: {
    id: SURVEY_PACKAGE_ID,
    version: PACKAGE_VERSION,
    projectionDigest: FROZEN_V1_PROJECTION_DIGEST
  },
  protocol: {
    id: SURVEY_PROTOCOL_ID,
    version: V1_VERSION,
    schema: SURVEY_PROTOCOL_V1_SCHEMA_ID,
    sourcePath: "source/protocol/survey.protocol.json"
  },
  sessionSchema: "urn:mission-kit:survey-v2:schema:session-state:v1"
});

const EXPECTED_CANDIDATE_SELECTION = Object.freeze({
  id: "v2-authoring-candidate",
  activation: "explicit",
  status: "candidate",
  package: {
    id: SURVEY_PACKAGE_ID,
    version: PACKAGE_VERSION
  },
  protocol: {
    id: SURVEY_PROTOCOL_ID,
    version: V2_VERSION,
    schema: SURVEY_PROTOCOL_V2_SCHEMA_ID,
    sourcePath: "source/protocol/survey-v2.protocol.json"
  },
  sessionSchema: "urn:mission-kit:survey-v2:schema:session-state:v2"
});

function withoutSourceDigest(selection) {
  const copy = structuredClone(selection);
  delete copy.protocol.sourceBytesDigest;
  return copy;
}

export function selectSurveyProtocol(selection, selectionId) {
  if (selectionId === undefined || selectionId === null) {
    return selection.defaultSelection;
  }
  return selection.candidateSelections.find(
    (candidate) => (
      candidate.id === selectionId &&
      candidate.activation === "explicit"
    )
  ) ?? null;
}

export function validateProtocolSelection(
  selection,
  {
    v1ProtocolSourceDigest,
    candidateProtocolSourceDigest
  } = {}
) {
  const issues = [];
  if (
    selection.$schema !== PROTOCOL_SELECTION_SCHEMA_ID ||
    selection.schemaVersion !== V2_VERSION ||
    selection.id !== "urn:mission-kit:survey-v2:protocol-selection:survey"
  ) {
    issues.push(issue(
      "PROTOCOL_SELECTION_IDENTITY_MISMATCH",
      "",
      "Protocol-selection identity or contract version differs."
    ));
  }
  if (!same(
    withoutSourceDigest(selection.defaultSelection),
    EXPECTED_DEFAULT_SELECTION
  )) {
    issues.push(issue(
      "PROTOCOL_DEFAULT_SELECTION_MISMATCH",
      "/defaultSelection",
      "Implicit selection must resolve only to the frozen v1 protocol and session contract."
    ));
  }
  const candidates = selection.candidateSelections ?? [];
  if (
    candidates.length !== 1 ||
    !same(
      withoutSourceDigest(candidates[0]),
      EXPECTED_CANDIDATE_SELECTION
    )
  ) {
    issues.push(issue(
      "PROTOCOL_CANDIDATE_SELECTION_MISMATCH",
      "/candidateSelections",
      "The only candidate must expose protocol 2.x through an explicit selection."
    ));
  }
  if (
    v1ProtocolSourceDigest &&
    selection.defaultSelection?.protocol?.sourceBytesDigest !==
      v1ProtocolSourceDigest
  ) {
    issues.push(issue(
      "FROZEN_V1_PROTOCOL_DIGEST_MISMATCH",
      "/defaultSelection/protocol/sourceBytesDigest",
      "Default selection does not pin the exact frozen v1 protocol bytes."
    ));
  }
  if (
    candidateProtocolSourceDigest &&
    candidates[0]?.protocol?.sourceBytesDigest !==
      candidateProtocolSourceDigest
  ) {
    issues.push(issue(
      "CANDIDATE_PROTOCOL_DIGEST_MISMATCH",
      "/candidateSelections/0/protocol/sourceBytesDigest",
      "Explicit candidate selection does not pin the exact protocol 2.x bytes."
    ));
  }
  if (
    selectSurveyProtocol(selection) !== selection.defaultSelection ||
    selectSurveyProtocol(selection, "v2-authoring-candidate") !== candidates[0] ||
    selectSurveyProtocol(selection, "frozen-v1") !== null
  ) {
    issues.push(issue(
      "PROTOCOL_SELECTION_RESOLUTION_MISMATCH",
      "",
      "Implicit and explicit selector resolution differ from the frozen-v1/candidate boundary."
    ));
  }
  return Object.freeze(issues);
}

export function validateSurveyProtocolContractSet({
  authoringProtocol,
  protocol,
  pairedStateMatrix,
  protocolSelection,
  v1ProtocolSourceDigest,
  candidateProtocolSourceDigest
}) {
  return Object.freeze([
    ...validateSurveyAuthoringProtocol(authoringProtocol),
    ...validateSurveyProtocolV2(protocol, { authoringProtocol }),
    ...validatePairedStateMatrix(pairedStateMatrix, {
      authoringProtocol,
      protocol,
      protocolSourceDigest: candidateProtocolSourceDigest
    }),
    ...validateProtocolSelection(protocolSelection, {
      v1ProtocolSourceDigest,
      candidateProtocolSourceDigest
    })
  ]);
}
