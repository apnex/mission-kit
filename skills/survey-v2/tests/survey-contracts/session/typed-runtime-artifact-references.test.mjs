import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  makeSession,
  runtimeArtifactResource,
  storedResourceVersion
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure
} from "./support/session-validation.mjs";

test("the v2 session admits only typed immutable SurveyRuntimeArtifact references", async () => {
  const runtimeArtifact = storedResourceVersion(runtimeArtifactResource());
  const session = makeSession({
    resourceVersions: [runtimeArtifact],
    runtimeArtifactReferences: [runtimeArtifact.reference]
  });
  assert.equal((await validateSessionStructure(session)).valid, true);
  assert.deepEqual(validateSessionSemantics(session), []);

  const wrongType = structuredClone(session);
  wrongType.authoring.runtimeArtifactReferences[0].kind = "RoundResponseSet";
  assert.equal((await validateSessionStructure(wrongType)).valid, false);
  assert.ok(
    validateSessionSemantics(wrongType).some(
      (item) =>
        item.code === "SESSION_RUNTIME_ARTIFACT_REFERENCE_TYPE_MISMATCH"
    )
  );

  const unresolved = makeSession({
    runtimeArtifactReferences: [runtimeArtifact.reference]
  });
  assert.ok(
    validateSessionSemantics(unresolved).some(
      (item) => item.code === "SESSION_RUNTIME_ARTIFACT_UNRESOLVED"
    )
  );

  const inlineVariant = storedResourceVersion({
    ...runtimeArtifact.resource,
    kind: "RoundResponseSet"
  });
  assert.ok(
    validateSessionSemantics(makeSession({
      resourceVersions: [inlineVariant]
    })).some(
      (item) => item.code === "SESSION_INLINE_RUNTIME_VARIANT_FORBIDDEN"
    )
  );
});
