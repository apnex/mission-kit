import assert from "node:assert/strict";
import test from "node:test";
import {
  selectSurveyProtocol,
  validateProtocolSelection
} from "../../../source/authoring/survey/protocol-semantics.mjs";
import {
  assertStructurallyValid,
  loadProtocolContractSet,
  readPackageJson
} from "../protocol/support.mjs";

test("protocol selection defaults implicitly to frozen v1 and exposes v2 only through explicit candidate selection", async () => {
  const {
    protocolSelection,
    goldenBindings,
    v1ProtocolSourceDigest,
    candidateProtocolSourceDigest
  } = await loadProtocolContractSet();
  await assertStructurallyValid(
    "urn:mission-kit:survey-v2:schema:protocol-selection:v2",
    protocolSelection
  );
  assert.deepEqual(
    validateProtocolSelection(protocolSelection, {
      v1ProtocolSourceDigest,
      candidateProtocolSourceDigest
    }),
    []
  );
  assert.equal(
    v1ProtocolSourceDigest,
    goldenBindings.frozenV1ProtocolSourceBytesDigest
  );
  assert.equal(
    candidateProtocolSourceDigest,
    goldenBindings.candidateV2ProtocolSourceBytesDigest
  );
  assert.equal(
    protocolSelection.defaultSelection.package.projectionDigest,
    goldenBindings.frozenV1ProjectionDigest
  );
  assert.equal(
    protocolSelection.defaultSelection.package.version,
    goldenBindings.frozenPackageVersion
  );
  assert.equal(
    Object.hasOwn(
      protocolSelection.candidateSelections[0].package,
      "projectionDigest"
    ),
    false
  );
  const cases = await readPackageJson(
    "tests/fixtures/survey/protocol/selection-cases.json"
  );
  for (const candidate of Object.values(cases)) {
    const resolved = selectSurveyProtocol(
      protocolSelection,
      candidate.selectionId
    );
    assert.equal(resolved?.id ?? null, candidate.expectedId);
  }
});
