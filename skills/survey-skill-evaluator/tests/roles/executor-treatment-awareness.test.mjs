import assert from "node:assert/strict";
import test from "node:test";
import {
  AwarenessLedger,
  measureTreatmentAwareness,
} from "../../source/executables/orchestrator/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("executor awareness is measured after content without disclosing an arm or expected direction", async (t) => {
  const measurement = measureTreatmentAwareness({
    roleClass: "survey_executor",
    contentCommitDigest: "a".repeat(64),
    request: {
      questionId: "awareness-1",
      prompt: "Did the assigned package seem familiar?",
    },
    response: {
      recognition: "uncertain",
      confidence: 0.4,
      evidenceRef: "role-result:attempt-1",
    },
  });
  assert.equal(measurement.recognition, "uncertain");
  assert.equal(measurement.explicitArmDisclosure, false);
  assert.equal(Object.isFrozen(measurement), true);
  assert.match(measurement.awarenessMeasurementDigest, /^[a-f0-9]{64}$/u);
  assert.throws(
    () =>
      measureTreatmentAwareness({
        roleClass: "survey_executor",
        contentCommitDigest: "a".repeat(64),
        request: {
          prompt: "Were you the treatment?",
          disclosure: { armMap: { treatment: "candidate" } },
        },
        response: {
          recognition: "recognized",
          confidence: 1,
          evidenceRef: "role-result:attempt-1",
        },
      }),
    /not neutral/u,
  );

  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const ledger = new AwarenessLedger({ rootPath: fixture.rootPath });
  await ledger.register({
    obligationId: "aw-executor",
    roleClass: "survey_executor",
    purpose: "post_content_treatment_awareness",
    parentBinding: { attemptId: "attempt-1" },
    expectedInvocation: false,
    maskPolicyDigest: "b".repeat(64),
  });
  await assert.rejects(
    ledger.issueNeutralRequest("aw-executor", {
      prompt: "nested disclosure",
      nested: { expectedDirection: "candidate_better" },
    }),
    /not neutral/u,
  );
});
