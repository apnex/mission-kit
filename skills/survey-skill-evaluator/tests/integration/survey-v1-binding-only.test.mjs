import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyV1SubjectAdapter,
  surveySubjectAdapterDescriptor,
} from "../../source/executables/orchestrator/index.mjs";

test("Survey v1 descriptor claims only an adapter contract over supplied host bindings", () => {
  const descriptor = surveySubjectAdapterDescriptor("survey-v1");
  assert.equal(
    descriptor.runtimeSemanticsAuthority,
    "supplied-host-binding",
  );
  assert.equal(descriptor.nativeRuntimeSemanticsClaimed, false);
  assert.throws(
    () => createSurveyV1SubjectAdapter({}),
    /unauthorized field set/u,
  );
});
