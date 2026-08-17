import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("EI02 shared cognitive context across conflicting roles fails the attested host boundary", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const providerThreadId = "reused-knowledge-context";
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    isolationProvider: {
      async invoke({ capsule, workspace }) {
        return {
          output: { status: "completed" },
          attestation: {
            freshContext: true,
            workspaceRoot: workspace,
            workspaceConfined: true,
            networkPolicy: capsule.network,
            toolPolicyDigest: hashCanonical(
              "role-tool-policy/v1",
              capsule.allowedTools,
            ),
            sharedCache: false,
            sharedMemory: false,
            sharedClipboard: false,
            sharedProviderThread: providerThreadId,
            productionCredentials: false,
          },
        };
      },
    },
  });
  const capsules = [
    buildRoleCapsule({
      roleClass: "survey_executor",
      workOrderId: "ei02-executor",
      inputProjection: { assignmentRef: "assignment-1" },
      outputSchemaId: "role-output/survey-executor/v1",
    }),
    buildRoleCapsule({
      roleClass: "semantic_judge",
      workOrderId: "ei02-judge",
      inputProjection: { blindBundleDigest: "a".repeat(64) },
      outputSchemaId: "role-output/semantic-judge/v1",
    }),
  ];

  for (const capsule of capsules) {
    await assert.rejects(runner.run(capsule), AuthorizationError);
  }
  assert.equal(runner.usedInvocationIds.size, 2);
});
