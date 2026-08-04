import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPECTED_PAIRED_STATES,
  isLegalPairedState,
  validatePairedStateMatrix
} from "../../../source/authoring/survey/protocol-semantics.mjs";
import {
  assertStructurallyValid,
  loadProtocolContractSet
} from "../protocol/support.mjs";

test("the canonical paired-state matrix contains the full legal mainline, correction, abort, and terminal set", async () => {
  const {
    authoringProtocol,
    protocol,
    pairedStateMatrix,
    candidateProtocolSourceDigest,
    goldenBindings
  } = await loadProtocolContractSet();
  await assertStructurallyValid(
    "urn:mission-kit:survey-v2:schema:paired-state-matrix:v2",
    pairedStateMatrix
  );
  assert.deepEqual(
    validatePairedStateMatrix(pairedStateMatrix, {
      authoringProtocol,
      protocol,
      protocolSourceDigest: candidateProtocolSourceDigest
    }),
    []
  );
  assert.equal(
    pairedStateMatrix.pairs.length,
    goldenBindings.legalPairCount
  );
  assert.deepEqual(pairedStateMatrix.pairs, EXPECTED_PAIRED_STATES);
  assert.deepEqual(
    new Set(
      pairedStateMatrix.pairs.flatMap((pair) => pair.pathClasses)
    ),
    new Set(["mainline", "correction", "abort", "terminal"])
  );
  for (const pair of [
    {
      authoringState: "composite_required",
      phaseState: "composite_drafting"
    },
    {
      authoringState: "round_2_interpretation_required",
      phaseState: "round_2_interpreting"
    },
    { authoringState: "complete", phaseState: "intent_captured" },
    { authoringState: "aborted", phaseState: "aborted" }
  ]) {
    assert.equal(isLegalPairedState(pairedStateMatrix, pair), true);
  }
});
