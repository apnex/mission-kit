import assert from "node:assert/strict";
import test from "node:test";
import {
  CANDIDATE_V2_SELECTOR,
  SessionContractSelectionError,
  selectSessionContract
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  candidateProjectionLock,
  candidateProtocol,
  makeSession,
  sealWorkspace
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  sha256Value
} from "../../../source/authoring/kernel/canonical.mjs";

function assertCandidateIdentityRejection(session) {
  assert.throws(
    () => selectSessionContract(session, CANDIDATE_V2_SELECTOR),
    (error) =>
      error instanceof SessionContractSelectionError &&
      error.code === "CANDIDATE_V2_IDENTITY_REQUIRED"
  );
}

test("candidate session selection pins the current package and canonical protocol identities", () => {
  const session = makeSession();
  const before = structuredClone(session);
  const selected = selectSessionContract(session, CANDIDATE_V2_SELECTOR);
  assert.equal(
    selected.package.projectionDigest,
    candidateProjectionLock.aggregateDigest
  );
  assert.equal(selected.protocol.digest, sha256Value(candidateProtocol));
  assert.deepEqual(selected.protocol.snapshot, candidateProtocol);
  assert.deepEqual(session, before);

  const changedPackage = structuredClone(session);
  changedPackage.package.projectionDigest = `sha256:${"0".repeat(64)}`;
  assertCandidateIdentityRejection(changedPackage);

  const changedProtocolDigest = structuredClone(session);
  changedProtocolDigest.protocol.digest = `sha256:${"0".repeat(64)}`;
  assertCandidateIdentityRejection(changedProtocolDigest);

  const changedProtocolSnapshot = structuredClone(session);
  changedProtocolSnapshot.protocol.snapshot.id =
    "urn:mission-kit:survey-v2:protocol:altered";
  changedProtocolSnapshot.protocol.digest =
    sha256Value(changedProtocolSnapshot.protocol.snapshot);
  assertCandidateIdentityRejection(changedProtocolSnapshot);

  const changedAuthoringBinding = structuredClone(session);
  changedAuthoringBinding.authoring.workspace.spec.protocol
    .reference.semanticDigest = `sha256:${"0".repeat(64)}`;
  changedAuthoringBinding.authoring.workspace.spec.protocol.protocolDigest =
    `sha256:${"0".repeat(64)}`;
  sealWorkspace(changedAuthoringBinding.authoring.workspace);
  assertCandidateIdentityRejection(changedAuthoringBinding);
});
