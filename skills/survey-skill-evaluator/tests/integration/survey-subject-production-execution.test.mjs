import assert from "node:assert/strict";
import test from "node:test";
import {
  executeSurveySubjectAttempt,
} from "../../source/executables/orchestrator/index.mjs";
import {
  SchemaValidator,
} from "../../source/executables/engine/index.mjs";
import {
  packageRoot,
} from "../helpers/campaign-fixture.mjs";
import {
  makeCandidateCapture,
} from "../helpers/candidate-capture-fixture.mjs";
import {
  makeArtifactProducingV1Adapter,
} from "../helpers/subject-adapter-fixture.mjs";

test("captured Survey bytes are staged and executed through every sovereign subject-adapter operation", async (t) => {
  const fixture = await makeCandidateCapture({
    sourceOptions: {
      capabilities: {
        summary: "The adapter executed the captured Survey subject.",
        risk: "Bypassing the subject adapter would fabricate evaluation evidence.",
        nextStep: "Retain the exact terminal observation and artifact digest.",
      },
    },
  });
  t.after(fixture.cleanup);
  const host = makeArtifactProducingV1Adapter();
  const schemaValidator =
    await SchemaValidator.fromPackageRoot(packageRoot);
  const evidence = await executeSurveySubjectAttempt({
    authorityRoot: fixture.authorityRoot,
    attemptRelativePath: "attempts/assignment-001",
    assignmentRef: "assignment-001",
    candidateSnapshot: fixture.captured.snapshot,
    candidatePayloadRoot: fixture.captured.payloadRoot,
    schemaValidator,
    adapter: host.adapter,
    publicScenario: { scenarioId: "scenario-1" },
    directorSessionPlan: {
      prompt: "Complete the disposable Survey session.",
      artifactContract: ["summary", "risk", "next-step"],
    },
    directorActionProvider: async () => ({
      actionClass: "ratify",
      payload: { decision: "confirm" },
    }),
  });

  assert.equal(evidence.runtimeSemanticsAuthority, "supplied-host-binding");
  assert.equal(evidence.nativeRuntimeSemanticsClaimed, false);
  assert.equal(evidence.stageReceipt.candidatePackageRoot,
    fixture.captured.snapshot.candidatePackageRoot);
  assert.equal(evidence.terminalObservation.terminalClass, "completed");
  assert.equal(evidence.artifact.sections.length, 3);
  assert.deepEqual(
    host.invocations.map((entry) => entry.method),
    ["initialize", "observe", "coldResume", "action", "observe"],
  );
  assert.match(evidence.subjectExecutionDigest, /^[a-f0-9]{64}$/u);
  schemaValidator.assert("survey-subject-execution", evidence);
});
