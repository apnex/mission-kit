import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  SchemaValidator,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

const EXPECTED_THREATS = [
  "allocation_grinding",
  "authority_spoofing",
  "caller_self_asserted_lifecycle_authority",
  "composite_result_mutation",
  "db_peer_reveal",
  "db_precommit_dispatch",
  "db_result_forgery",
  "double_family_consumption",
  "early_or_unscoped_unmask",
  "forged_or_late_grant_fence_result",
  "hidden_retry",
  "incomplete_awareness_universe",
  "missing_or_rewritten_source_request",
  "missingness_driven_exclusion",
  "stale_or_duplicate_grant",
  "wrong_target_source_request",
].sort();

test("E0 evidence freezes exact governance, v1 control, dependencies, threats, and the E5 ceiling", async () => {
  const evidence = JSON.parse(
    await readFile(
      join(packageRoot, "source/evidence/e0-baseline-evidence.json"),
      "utf8",
    ),
  );
  const schemas = await SchemaValidator.fromPackageRoot(packageRoot);
  schemas.assert("e0-baseline-evidence", evidence);
  const core = structuredClone(evidence);
  delete core.evidenceRoot;
  assert.equal(
    evidence.evidenceRoot,
    hashCanonical("e0-baseline-evidence/v1", core),
  );
  assert.deepEqual(
    evidence.threatModel.map((entry) => entry.threatId).sort(),
    EXPECTED_THREATS,
  );
  for (const threat of evidence.threatModel) {
    for (const evidenceRef of threat.evidenceRefs) {
      await access(join(packageRoot, evidenceRef));
    }
  }
  assert.equal(evidence.canonicalV1Control.characterizationAssertionCount, 53);
  assert.equal(evidence.canonicalV1Control.mutationPermitted, false);
  const mechanicalEvidence = structuredClone(
    evidence.candidateV2Prerequisite.mechanicalEvidence,
  );
  const mechanicalEvidenceRoot =
    mechanicalEvidence.mechanicalEvidenceRoot;
  delete mechanicalEvidence.mechanicalEvidenceRoot;
  assert.equal(
    mechanicalEvidenceRoot,
    hashCanonical(
      "survey-v2-prerequisite-mechanical-evidence/v1",
      mechanicalEvidence,
    ),
  );
  assert.equal(
    evidence.candidateV2Prerequisite.mechanicalEvidence
      .packageDigest,
    "sha256:6603b777b82783176fca6129bfecde7a6e253f5be86f9becf94703d818b9757c",
  );
  assert.equal(
    evidence.governanceIdentities.surveyV2ProjectionRefinementSha256,
    "d91bb7617f0428e8520bba1f33d1cb25b8eca1560196c665310aed8ba745ffb3",
  );
  assert.equal(
    evidence.governanceIdentities.surveyV2CandidateCommit,
    "a9e569415d9bb07da097ea6b5e84821ed888279f",
  );
  assert.equal(
    evidence.candidateV2Prerequisite.mechanicalEvidence
      .registeredTestCount,
    63,
  );
  assert.equal(
    evidence.candidateV2Prerequisite.mechanicalEvidence
      .passedTestCount,
    63,
  );
  assert.equal(
    evidence.candidateV2Prerequisite.mechanicalEvidence
      .failedTestCount,
    0,
  );
  const testOutputEvidence =
    evidence.candidateV2Prerequisite.mechanicalEvidence
      .testOutputEvidence;
  const testOutputBytes = await readFile(
    join(packageRoot, testOutputEvidence.path),
  );
  assert.equal(testOutputBytes.byteLength, testOutputEvidence.byteLength);
  assert.equal(
    createHash("sha256").update(testOutputBytes).digest("hex"),
    testOutputEvidence.rawSha256,
  );
  const testOutputSummary = JSON.parse(testOutputBytes.toString("utf8"));
  assert.deepEqual(testOutputSummary, {
    schemaVersion: "1.0.0",
    candidateCommit: "a9e569415d9bb07da097ea6b5e84821ed888279f",
    command: "npm test",
    exitCode: 0,
    registeredTestCount: 63,
    passedTestCount: 63,
    failedTestCount: 0,
    rawOutputPassMarkers: 63,
    rawOutputFailureMarkers: 0,
    nodeVersion: "v24.12.0",
  });
  assert.deepEqual(evidence.assuranceBoundary, {
    deterministicCeiling: "E5",
    e6Claimed: false,
    e7Claimed: false,
    promotionAuthorized: false,
  });
});
