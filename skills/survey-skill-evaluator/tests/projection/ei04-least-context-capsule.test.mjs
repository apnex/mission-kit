import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
  ValidationError,
} from "../../source/executables/engine/index.mjs";
import {
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";

test("EI04 each capsule freezes only its permitted assignment projection and rejects forbidden or over-budget context", () => {
  const permitted = {
    assignmentRef: "assignment-001",
    blindSurveyArtifact: { digest: "a".repeat(64) },
    commonPublicTask: { taskId: "task-1" },
  };
  const capsule = buildRoleCapsule({
    roleClass: "downstream_consumer",
    workOrderId: "ei04-permitted",
    inputProjection: permitted,
    allowedTools: ["fixture.read"],
    outputSchemaId: "role-output/downstream-consumer/v1",
    byteLimit: 1_000,
  });
  permitted.assignmentRef = "mutated-after-capture";
  assert.equal(capsule.inputProjection.assignmentRef, "assignment-001");
  assert.equal(Object.isFrozen(capsule.inputProjection), true);
  assert.deepEqual(
    Object.keys(capsule.inputProjection).sort(),
    ["assignmentRef", "blindSurveyArtifact", "commonPublicTask"],
  );

  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "downstream_consumer",
        workOrderId: "ei04-forbidden",
        inputProjection: {
          assignmentRef: "assignment-001",
          armMap: { treatment: "candidate" },
        },
        outputSchemaId: "role-output/downstream-consumer/v1",
      }),
    AuthorizationError,
  );
  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "downstream_consumer",
        workOrderId: "ei04-over-budget",
        inputProjection: { payload: "x".repeat(256) },
        outputSchemaId: "role-output/downstream-consumer/v1",
        byteLimit: 32,
      }),
    ValidationError,
  );
});
