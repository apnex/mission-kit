import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  attachJournal,
  matrixSession,
  sealWorkspace,
  storedResourceVersion
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import surveyPolicyTemplate from "../../fixtures/survey/contracts/positive/survey-policy-snapshot.json"
  with { type: "json" };
import authoringProfileTemplate from "../../fixtures/authoring/contracts/positive/authoring-profile-manifest.json"
  with { type: "json" };

test("the v2 session closes immutable resource history and active heads without deleting prior versions", () => {
  const profile = storedResourceVersion(authoringProfileTemplate);
  const priorResource = structuredClone(surveyPolicyTemplate);
  priorResource.spec.profileRef = structuredClone(profile.reference);
  priorResource.spec.validation.schemaBindings[0].digest =
    `sha256:${"1".repeat(64)}`;
  const currentResource = structuredClone(surveyPolicyTemplate);
  currentResource.spec.profileRef = structuredClone(profile.reference);
  currentResource.spec.validation.schemaBindings[0].digest =
    `sha256:${"2".repeat(64)}`;
  const prior = storedResourceVersion(priorResource);
  const current = storedResourceVersion(currentResource);
  const session = matrixSession({
    authoringState: "round_1_frame_required",
    phaseState: "round_1_drafting"
  });
  session.authoring.workspace.spec.resourceVersions = [
    profile,
    prior,
    current
  ];
  session.authoring.workspace.spec.activeHeads = [{
    slot: "survey-policy",
    reference: current.reference
  }];
  session.authoring.workspace.spec.history = [prior.reference];
  sealWorkspace(session.authoring.workspace);
  session.journal.at(-1).after.semanticStateDigest = "$workspace";
  attachJournal(session, session.journal);
  assert.deepEqual(validateSessionSemantics(session), []);
  assert.equal(
    session.authoring.workspace.spec.resourceVersions.filter(
      ({ resource }) => resource.kind === "SurveyPolicySnapshot"
    ).length,
    2
  );

  const schemaInvalid = structuredClone(session);
  const malformedPolicy = structuredClone(currentResource);
  delete malformedPolicy.spec.geometry;
  const malformedStored = storedResourceVersion(malformedPolicy);
  schemaInvalid.authoring.workspace.spec.resourceVersions[2] =
    malformedStored;
  schemaInvalid.authoring.workspace.spec.activeHeads[0].reference =
    malformedStored.reference;
  sealWorkspace(schemaInvalid.authoring.workspace);
  schemaInvalid.journal.at(-1).after.semanticStateDigest = "$workspace";
  attachJournal(schemaInvalid, schemaInvalid.journal);
  assert.ok(
    validateSessionSemantics(schemaInvalid).some(
      (item) => item.code === "SESSION_SURVEY_RESOURCE_SCHEMA_INVALID"
    )
  );

  const graphUnresolved = structuredClone(session);
  graphUnresolved.authoring.workspace.spec.resourceVersions.shift();
  sealWorkspace(graphUnresolved.authoring.workspace);
  assert.ok(
    validateSessionSemantics(graphUnresolved).some(
      (item) =>
        item.code === "REFERENCE_UNRESOLVED" &&
        item.field.endsWith("/spec/profileRef")
    )
  );

  const retainedWithoutHistory = structuredClone(session);
  retainedWithoutHistory.authoring.workspace.spec.history = [];
  sealWorkspace(retainedWithoutHistory.authoring.workspace);
  assert.ok(
    validateSessionSemantics(retainedWithoutHistory).some(
      (item) =>
        item.code === "SESSION_SUPERSEDED_RESOURCE_HISTORY_REQUIRED"
    )
  );

  const duplicateHistory = structuredClone(session);
  duplicateHistory.authoring.workspace.spec.history.push(prior.reference);
  sealWorkspace(duplicateHistory.authoring.workspace);
  assert.ok(
    validateSessionSemantics(duplicateHistory).some(
      (item) => item.code === "SESSION_HISTORY_REFERENCE_DUPLICATE"
    )
  );

  const deletedHistory = structuredClone(session);
  deletedHistory.authoring.workspace.spec.resourceVersions.splice(1, 1);
  sealWorkspace(deletedHistory.authoring.workspace);
  assert.ok(
    validateSessionSemantics(deletedHistory).some(
      (item) => item.code === "SESSION_REFERENCE_DIGEST_MISMATCH"
    )
  );
});
