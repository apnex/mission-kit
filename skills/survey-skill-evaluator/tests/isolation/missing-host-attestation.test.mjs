import test from "node:test";
import assert from "node:assert/strict";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { AuthorizationError } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("production role execution fails closed without a complete host isolation attestation", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    isolationProvider: {
      invoke: async () => ({
        output: { ballot: "sealed" },
        attestation: { freshContext: true },
      }),
    },
  });
  const capsule = buildRoleCapsule({
    roleClass: "semantic_judge",
    workOrderId: "judge-attestation",
    inputProjection: { bundle: "blind" },
    outputSchemaId: "judge-ballot/v1",
  });
  await assert.rejects(
    runner.run(capsule),
    (error) => error instanceof AuthorizationError && /attestation/.test(error.message),
  );
});
