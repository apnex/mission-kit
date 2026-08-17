import test from "node:test";
import assert from "node:assert/strict";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { AuthorizationError, hashCanonical } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("a host attesting a different workspace is rejected as an isolation escape", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    isolationProvider: {
      invoke: async ({ capsule }) => ({
        output: { contribution: "bounded" },
        attestation: {
          freshContext: true,
          workspaceRoot: "/tmp/not-the-authorized-workspace",
          workspaceConfined: true,
          networkPolicy: capsule.network,
          toolPolicyDigest: hashCanonical("role-tool-policy/v1", capsule.allowedTools),
          sharedCache: false,
          sharedMemory: false,
          sharedClipboard: false,
          sharedProviderThread: false,
          productionCredentials: false,
        },
      }),
    },
  });
  const capsule = buildRoleCapsule({
    roleClass: "learning_diagnostic_actor",
    workOrderId: "diagnostic-escape",
    inputProjection: { source: "bounded" },
    outputSchemaId: "diagnostic-contribution/v1",
  });
  await assert.rejects(
    runner.run(capsule),
    (error) => error instanceof AuthorizationError,
  );
});
