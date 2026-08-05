import assert from "node:assert/strict";
import test from "node:test";
import {
  reproduceAssignmentView
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  renderBlankTextForm,
  textContentBytes
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  issueK10TextAssignment,
  loadK10AssignmentScenario
} from "./support.mjs";

test("reproduction from supplied immutable DAG resources returns byte-identical blank views", async () => {
  const issued = await issueK10TextAssignment();
  const reproduced = reproduceAssignmentView(issued);
  const coldScenario = await loadK10AssignmentScenario();
  const coldRendered = renderBlankTextForm({
    formDefinition: coldScenario.formDefinition,
    contextClosure: coldScenario.contextClosure,
    requestHandle: issued.handle
  });
  const coldIssued = await issueK10TextAssignment();

  assert.deepEqual(reproduced, issued.blankViewBytes);
  assert.deepEqual(coldRendered, issued.blankViewBytes);
  assert.deepEqual(coldIssued.blankViewBytes, issued.blankViewBytes);
  assert.deepEqual(
    textContentBytes(coldIssued.projectionArtifact.spec.output.content),
    issued.blankViewBytes
  );
});
