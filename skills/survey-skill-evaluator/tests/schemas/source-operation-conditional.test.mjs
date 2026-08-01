import assert from "node:assert/strict";
import test from "node:test";
import {
  HASH_PROFILE_ID,
  SchemaValidator,
  ValidationError,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

test("generated conditional contracts reject the wrong source operation", async () => {
  const validator = await SchemaValidator.fromPackageRoot(packageRoot);
  const digest = "a".repeat(64);
  const requestState = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    learningCapitalRequestId: "lcr-1",
    revision: 1,
    state: "open_eligible",
    predecessor: {
      kind: "absent",
      machineId: "learning-capital-request",
      objectId: "lcr-1",
      schemaVersion: "1.0.0",
      absentSentinel: digest,
    },
    sourceRequest: {
      sourceRequestId: "source-1",
      sourceType: "completion_reflection",
      targetOperation: "LC02",
      sourceObjectId: "lr-1",
      sourceEventDigest: digest,
      sourceSemanticRoot: digest,
      upstreamOutboxId: "outbox-1",
      upstreamOutboxDigest: digest,
      correlationId: "correlation-1",
      producerAuthorityId: "work-unit-producer",
      immutable: true,
      conceptPatternKey: "pattern-1",
      completionReflectionRoot: digest,
    },
    admissionClass: "eligible",
    operationGrantOrDeniedProjectionRef: digest,
    fence: 0,
    resultLedger: {},
    eventRefs: [],
    outboxRefs: [],
  };
  const result = validator.check(
    "learning-capital-request-state",
    requestState,
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === "oneOf"));
  assert.throws(
    () => validator.assert("learning-capital-request-state", requestState),
    ValidationError,
  );
});
