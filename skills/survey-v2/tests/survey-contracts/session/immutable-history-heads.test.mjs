import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  makeSession,
  sealWorkspace,
  storedResourceVersion
} from "../../fixtures/survey/session-v2/session-factory.mjs";

test("the v2 session closes immutable resource history and active heads without deleting prior versions", () => {
  const prior = storedResourceVersion({
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyPolicySnapshot",
    metadata: { name: "survey-policy" },
    spec: { revision: 1 }
  });
  const current = storedResourceVersion({
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyPolicySnapshot",
    metadata: { name: "survey-policy" },
    spec: { revision: 2 }
  });
  const session = makeSession({
    resourceVersions: [prior, current],
    activeHeads: [{
      slot: "survey-policy",
      reference: current.reference
    }],
    history: [prior.reference]
  });
  assert.deepEqual(validateSessionSemantics(session), []);
  assert.equal(session.authoring.workspace.spec.resourceVersions.length, 2);

  const deletedHistory = structuredClone(session);
  deletedHistory.authoring.workspace.spec.resourceVersions.shift();
  sealWorkspace(deletedHistory.authoring.workspace);
  assert.ok(
    validateSessionSemantics(deletedHistory).some(
      (item) => item.code === "SESSION_REFERENCE_DIGEST_MISMATCH"
    )
  );
});
