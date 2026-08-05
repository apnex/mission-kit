import assert from "node:assert/strict";
import test from "node:test";
import {
  selectSurveyProtocol,
  validateProtocolSelection
} from "../../../source/authoring/survey/protocol-semantics.mjs";
import {
  CURRENT_EXECUTOR_PACKAGE_ID,
  CURRENT_EXECUTOR_PACKAGE_VERSION,
  CURRENT_EXECUTOR_QUARANTINE_SCHEMA_ID,
  CURRENT_EXECUTOR_SESSION_SCHEMA_ID
} from "../../../source/executables/runtime/lib/storage.mjs";
import {
  assertStructurallyValid,
  loadProtocolContractSet,
  readPackageJson
} from "../protocol/support.mjs";

test("selection defaults to v1 on the active package, isolates frozen historical resume, and exposes v2 only explicitly", async () => {
  const {
    protocol,
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
    protocolSelection.historicalCompatibility.package.projectionDigest,
    goldenBindings.frozenV1ProjectionDigest
  );
  assert.equal(
    protocolSelection.historicalCompatibility.package.version,
    goldenBindings.frozenPackageVersion
  );
  assert.equal(
    protocolSelection.defaultSelection.package.version,
    goldenBindings.candidatePackageVersion
  );
  assert.deepEqual(
    protocolSelection.defaultSelection.package,
    protocolSelection.candidateSelections[0].package
  );
  assert.equal(
    Object.hasOwn(
      protocolSelection.candidateSelections[0].package,
      "projectionDigest"
    ),
    false
  );
  assert.equal(
    protocolSelection.defaultSelection.package.projectionLockPath,
    "generated/projection-lock.json"
  );
  assert.deepEqual(
    {
      packageId: protocolSelection.defaultSelection.package.id,
      packageVersion: protocolSelection.defaultSelection.package.version,
      sessionSchema: protocolSelection.defaultSelection.sessionSchema,
      quarantineSchema:
        protocolSelection.defaultSelection.execution.quarantineSchema
    },
    {
      packageId: CURRENT_EXECUTOR_PACKAGE_ID,
      packageVersion: CURRENT_EXECUTOR_PACKAGE_VERSION,
      sessionSchema: CURRENT_EXECUTOR_SESSION_SCHEMA_ID,
      quarantineSchema: CURRENT_EXECUTOR_QUARANTINE_SCHEMA_ID
    }
  );
  assert.deepEqual(
    protocolSelection.defaultSelection.execution,
    {
      executor: "current-package",
      implementationStatus: "available",
      quarantineSchema: CURRENT_EXECUTOR_QUARANTINE_SCHEMA_ID
    }
  );
  assert.deepEqual(
    protocolSelection.candidateSelections[0].execution,
    {
      executor: "current-package",
      implementationStatus: "contract-only",
      quarantineSchema: CURRENT_EXECUTOR_QUARANTINE_SCHEMA_ID
    }
  );
  assert.deepEqual(
    protocolSelection.historicalCompatibility.execution,
    {
      executor: "matching-frozen-package",
      implementationStatus: "matching-package-required",
      quarantineSchema: "urn:mission-kit:survey-v2:schema:quarantine:v1"
    }
  );
  const historicalProtocol = await readPackageJson(
    "source/protocol/survey.protocol.json"
  );
  assert.equal(
    protocolSelection.candidateSelections[0].execution.quarantineSchema,
    protocol.quarantineOperation.schema
  );
  assert.equal(
    protocolSelection.historicalCompatibility.execution.quarantineSchema,
    historicalProtocol.quarantineOperation.schema
  );
  assert.notEqual(
    protocolSelection.defaultSelection.execution.quarantineSchema,
    historicalProtocol.quarantineOperation.schema,
    "the active package-v2 executor deliberately replaces protocol-v1's frozen package-v1 quarantine contract"
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
