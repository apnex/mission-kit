import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRecordDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  matrixSession,
  pairedStateMatrix
} from "../../fixtures/survey/session-v2/session-factory.mjs";

function pair(authoringState, phaseState) {
  return pairedStateMatrix.pairs.find((candidate) => (
    candidate.authoringState === authoringState &&
    candidate.phaseState === phaseState
  ));
}

function recordIndexWithTransition(session, transitionId) {
  return session.journal.findIndex((record) => (
    record.machineEdges.some((edge) => edge.transitionId === transitionId)
  ));
}

function coupledSession() {
  return matrixSession(pair(
    "survey_frame_required",
    "round_1_drafting"
  ));
}

function terminalCoupledSession() {
  return matrixSession(pair("complete", "intent_captured"));
}

function resealRecord(session, journalIndex) {
  session.journal[journalIndex].recordDigest =
    journalRecordDigest(session.journal[journalIndex]);
  return session;
}

test("the v2 session admits only canonical continuous declared coupled-machine edges", () => {
  const session = coupledSession();
  assert.deepEqual(validateSessionSemantics(session), []);
  const couplingIndex = recordIndexWithTransition(session, "AT01");
  assert.notEqual(couplingIndex, -1);

  const reversed = structuredClone(session);
  reversed.journal[couplingIndex].machineEdges.reverse();
  resealRecord(reversed, couplingIndex);
  assert.ok(
    validateSessionSemantics(reversed).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_ORDER_INVALID"
    )
  );

  const discontinuous = structuredClone(session);
  const discontinuousPhaseEdge = discontinuous.journal[couplingIndex]
    .machineEdges.find((edge) => edge.machineId === "phase");
  discontinuousPhaseEdge.fromState = "new";
  resealRecord(discontinuous, couplingIndex);
  assert.ok(
    validateSessionSemantics(discontinuous).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_DISCONTINUITY"
    )
  );

  const wrongGenesisDigest = structuredClone(session);
  const firstPhaseRecordIndex = wrongGenesisDigest.journal.findIndex(
    (record) => record.machineEdges.some(
      (edge) => edge.machineId === "phase"
    )
  );
  wrongGenesisDigest.journal[firstPhaseRecordIndex].machineEdges
    .find((edge) => edge.machineId === "phase").beforeStateDigest =
      `sha256:${"f".repeat(64)}`;
  resealRecord(wrongGenesisDigest, firstPhaseRecordIndex);
  assert.ok(
    validateSessionSemantics(wrongGenesisDigest).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_GENESIS_MISMATCH"
    )
  );

  const wrongStateOccurrenceDigest = structuredClone(session);
  wrongStateOccurrenceDigest.journal[couplingIndex].machineEdges[0]
    .afterStateDigest = `sha256:${"e".repeat(64)}`;
  resealRecord(wrongStateOccurrenceDigest, couplingIndex);
  assert.ok(
    validateSessionSemantics(wrongStateOccurrenceDigest).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_DIGEST_MISMATCH"
    )
  );

  for (const [machineId, transitionId] of [
    ["authoring", "AT99"],
    ["phase", "T99"]
  ]) {
    const invented = structuredClone(session);
    invented.journal[couplingIndex].machineEdges
      .find((edge) => edge.machineId === machineId)
      .transitionId = transitionId;
    resealRecord(invented, couplingIndex);
    assert.ok(
      validateSessionSemantics(invented).some(
        (item) => item.code === "SESSION_MACHINE_EDGE_TRANSITION_UNKNOWN"
      ),
      transitionId
    );
  }

  const wrongEvent = structuredClone(session);
  wrongEvent.journal[couplingIndex].machineEdges
    .find((edge) => edge.machineId === "authoring").eventId =
    "BEGIN_SURVEY_AUTHORING";
  resealRecord(wrongEvent, couplingIndex);
  assert.ok(
    validateSessionSemantics(wrongEvent).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_TUPLE_MISMATCH"
    )
  );

  const incompleteCoupling = structuredClone(session);
  incompleteCoupling.journal[couplingIndex].machineEdges =
    incompleteCoupling.journal[couplingIndex].machineEdges
      .filter((edge) => edge.machineId !== "phase");
  resealRecord(incompleteCoupling, couplingIndex);
  assert.ok(
    validateSessionSemantics(incompleteCoupling).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_COUPLING_REQUIRED"
    )
  );

  const terminal = terminalCoupledSession();
  assert.deepEqual(validateSessionSemantics(terminal), []);
  const terminalIndex = recordIndexWithTransition(terminal, "T35");
  assert.notEqual(terminalIndex, -1);

  const missingRuntimeCounterpart = structuredClone(terminal);
  missingRuntimeCounterpart.journal[terminalIndex].machineEdges =
    missingRuntimeCounterpart.journal[terminalIndex].machineEdges
      .filter((edge) => edge.machineId !== "runtime");
  resealRecord(missingRuntimeCounterpart, terminalIndex);
  assert.ok(
    validateSessionSemantics(missingRuntimeCounterpart).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_COUPLING_REQUIRED"
    )
  );

  const inventedRuntime = structuredClone(terminal);
  inventedRuntime.journal[terminalIndex].machineEdges
    .find((edge) => edge.machineId === "runtime").transitionId = "RT99";
  resealRecord(inventedRuntime, terminalIndex);
  assert.ok(
    validateSessionSemantics(inventedRuntime).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_TRANSITION_UNKNOWN"
    )
  );
});
