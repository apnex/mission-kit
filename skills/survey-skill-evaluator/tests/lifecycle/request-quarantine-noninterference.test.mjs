import test from "node:test";
import assert from "node:assert/strict";
import {
  QuarantineStore,
  QuarantinedError,
} from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("a request-scoped quarantine latch blocks only its exact request", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const quarantine = new QuarantineStore({ rootPath: fixture.rootPath });
  await quarantine.publish({
    scope: "request",
    scopeId: "request-a",
    reason: "unverifiable_chain",
    detectionEvidence: { failedCheck: "event_root" },
    admissionConsequence: "fence_and_drain_exact_request",
  });
  await assert.rejects(
    quarantine.assertAdmissible("request", "request-a"),
    (error) => error instanceof QuarantinedError,
  );
  await quarantine.assertAdmissible("request", "request-b");
});
