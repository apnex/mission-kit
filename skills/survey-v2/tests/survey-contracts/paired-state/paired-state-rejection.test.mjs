import assert from "node:assert/strict";
import test from "node:test";
import {
  validatePairedStateMatrix
} from "../../../source/authoring/survey/protocol-semantics.mjs";
import {
  contractValidators,
  loadProtocolContractSet,
  readPackageJson
} from "../protocol/support.mjs";

test("paired-state validation rejects unresolved, duplicate, and illegal pairs", async () => {
  const {
    authoringProtocol,
    protocol,
    pairedStateMatrix,
    candidateProtocolSourceDigest
  } = await loadProtocolContractSet();
  const cases = await readPackageJson(
    "tests/fixtures/survey/protocol/paired-state-invalid-cases.json"
  );
  const candidates = [];

  const unresolvedAuthoring = structuredClone(pairedStateMatrix);
  unresolvedAuthoring.pairs[
    cases.unresolvedAuthoring.index
  ].authoringState = cases.unresolvedAuthoring.authoringState;
  candidates.push([
    unresolvedAuthoring,
    cases.unresolvedAuthoring.expectedIssue
  ]);

  const unresolvedPhase = structuredClone(pairedStateMatrix);
  unresolvedPhase.pairs[
    cases.unresolvedPhase.index
  ].phaseState = cases.unresolvedPhase.phaseState;
  candidates.push([unresolvedPhase, cases.unresolvedPhase.expectedIssue]);

  const duplicate = structuredClone(pairedStateMatrix);
  duplicate.pairs[cases.duplicate.index] = structuredClone(
    duplicate.pairs[cases.duplicate.copyFromIndex]
  );
  candidates.push([duplicate, cases.duplicate.expectedIssue]);

  const illegal = structuredClone(pairedStateMatrix);
  illegal.pairs[cases.illegal.index] = {
    authoringState: cases.illegal.authoringState,
    phaseState: cases.illegal.phaseState,
    pathClasses: cases.illegal.pathClasses
  };
  candidates.push([illegal, cases.illegal.expectedIssue]);

  for (const [candidate, expectedIssue] of candidates) {
    const codes = validatePairedStateMatrix(candidate, {
      authoringProtocol,
      protocol,
      protocolSourceDigest: candidateProtocolSourceDigest
    }).map((item) => item.code);
    assert.ok(codes.includes(expectedIssue), JSON.stringify(codes));
  }

  const ajv = await contractValidators();
  const validate = ajv.getSchema(
    "urn:mission-kit:survey-v2:schema:paired-state-matrix:v2"
  );
  assert.equal(validate(duplicate), false);
});
