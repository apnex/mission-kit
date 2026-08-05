import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSurveyProtocolV2
} from "../../../source/authoring/survey/protocol-semantics.mjs";
import {
  sessionMachineStateDigest,
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  attachJournal,
  candidateProtocol,
  makeJournalRecord,
  matrixSession
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure
} from "./support/session-validation.mjs";

const phaseMachine = candidateProtocol.machines.find(
  (machine) => machine.id === "phase"
);
const phaseTransitions = new Map(
  phaseMachine.transitions.map((transition) => [
    transition.id,
    transition
  ])
);

function lastMachineEdge(session, machineId) {
  return session.journal
    .flatMap((record) => record.machineEdges)
    .filter((edge) => edge.machineId === machineId)
    .at(-1);
}

function appendPhaseSequence(session, transitionIds, commitId) {
  const ordinal = session.journal.length + 1;
  let beforeStateDigest = lastMachineEdge(session, "phase").afterStateDigest;
  let state = session.phase;
  const machineEdges = transitionIds.map((transitionId) => {
    const transition = phaseTransitions.get(transitionId);
    assert.ok(transition, transitionId);
    assert.equal(transition.from, state, transitionId);
    const toState = transition.to === "same" ? state : transition.to;
    const afterStateDigest = sessionMachineStateDigest(session, {
      machineId: "phase",
      state: toState,
      journalOrdinal: ordinal
    });
    const edge = {
      machineId: "phase",
      transitionId,
      fromState: state,
      eventId: transition.event,
      toState,
      beforeStateDigest,
      afterStateDigest
    };
    beforeStateDigest = afterStateDigest;
    state = toState;
    return edge;
  });
  session.phase = state;
  const record = makeJournalRecord({
    commitId,
    ordinal,
    commitKind: "transition",
    before: structuredClone(session.journal.at(-1).after),
    after: {
      semanticRevision: ordinal,
      evidenceRevision: ordinal,
      semanticStateDigest: "$workspace"
    },
    machineEdges,
    idempotencyMachine: "phase",
    idempotencyKey: commitId
  });
  return attachJournal(session, [...session.journal, record]);
}

test("a repeated-machine commit must equal one complete ordered atomic edge sequence declared by the canonical protocol manifest", async () => {
  const authoringProtocol = candidateProtocol.machines.find(
    (machine) => machine.id === "authoring"
  ).protocol;
  assert.deepEqual(
    validateSurveyProtocolV2(candidateProtocol, { authoringProtocol }),
    []
  );
  assert.deepEqual(
    candidateProtocol.atomicSequences.map((sequence) => (
      sequence.edges.map((edge) => `${edge.machineId}/${edge.transitionId}`)
    )),
    [
      ["phase/T04", "phase/T03"],
      ["phase/T15", "phase/T14"]
    ]
  );

  const legalRefreeze = appendPhaseSequence(
    matrixSession({
      authoringState: "waiting_for_round_1_responses",
      phaseState: "round_1_q1_ready"
    }),
    ["T04", "T03"],
    "round-1-refreeze"
  );
  assert.equal((await validateSessionStructure(legalRefreeze)).valid, true);
  assert.deepEqual(validateSessionSemantics(legalRefreeze), []);

  const arbitraryDuplicate = appendPhaseSequence(
    matrixSession({
      authoringState: "candidate_ready",
      phaseState: "walkthrough_in_progress"
    }),
    ["T29", "T29"],
    "duplicate-phase-self-loop"
  );
  assert.equal((await validateSessionStructure(arbitraryDuplicate)).valid, true);
  assert.ok(
    validateSessionSemantics(arbitraryDuplicate).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_SEQUENCE_UNDECLARED"
    )
  );

  const partialRefreeze = appendPhaseSequence(
    matrixSession({
      authoringState: "waiting_for_round_1_responses",
      phaseState: "round_1_q1_ready"
    }),
    ["T04", "T03", "T04"],
    "partial-extra-refreeze"
  );
  assert.equal((await validateSessionStructure(partialRefreeze)).valid, true);
  assert.ok(
    validateSessionSemantics(partialRefreeze).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_SEQUENCE_UNDECLARED"
    )
  );
});
