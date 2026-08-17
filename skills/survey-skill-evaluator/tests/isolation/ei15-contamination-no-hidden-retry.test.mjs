import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
} from "../../source/executables/engine/index.mjs";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("EI15 a failed host isolation attestation is typed contamination and is never retried as a clean invocation", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  let providerCalls = 0;
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    isolationProvider: {
      async invoke() {
        providerCalls += 1;
        return {
          output: { status: "completed" },
          attestation: {
            freshContext: false,
            sharedProviderThread: true,
          },
        };
      },
    },
  });
  const capsule = buildRoleCapsule({
    roleClass: "incident_classifier",
    workOrderId: "ei15-work",
    inputProjection: { incidentBundleDigest: "a".repeat(64) },
    outputSchemaId: "role-output/incident-classifier/v1",
  });

  await assert.rejects(
    runner.run(capsule),
    (error) => {
      assert.ok(error instanceof AuthorizationError);
      assert.equal(
        error.details.contaminationCode,
        "ROLE_COLLAPSE_OR_CONTEXT_REUSE",
      );
      assert.equal(error.details.findingClass, "role_contamination");
      assert.equal(error.details.resumableInPlace, false);
      return true;
    },
  );
  assert.equal(providerCalls, 1);
  assert.equal(runner.usedInvocationIds.size, 1);
});
