import assert from "node:assert/strict";
import test from "node:test";
import {
  issueTextAssignment
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  assertDagError,
  issueK10TextAssignment,
  loadK10AssignmentScenario
} from "./support.mjs";

test("the request projection ID and definition digest are authoritative", async () => {
  const issued = await issueK10TextAssignment();
  assert.equal(
    issued.projectionArtifact.spec.projectionId,
    issued.request.spec.bindings.projection.id
  );
  assert.equal(
    issued.projectionArtifact.spec.projectionDefinitionDigest,
    issued.request.spec.bindings.projection.digest
  );

  const scenario = await loadK10AssignmentScenario();
  const rogueBinding = {
    ...scenario.projectionBinding,
    id: "rogue-projection"
  };
  assertDagError(
    () => issueTextAssignment({
      ...scenario,
      projectionBinding: rogueBinding,
      projectionName: "rogue-projection",
      assignmentName: "rogue-assignment"
    }),
    "DAG_PROJECTION_AUTHORITY_MISMATCH"
  );

  const incompleteEngine = structuredClone(scenario.projectionBinding);
  delete incompleteEngine.engine.id;
  assertDagError(
    () => issueTextAssignment({
      ...scenario,
      projectionBinding: incompleteEngine,
      projectionName: "incomplete-engine-projection",
      assignmentName: "incomplete-engine-assignment"
    }),
    "DAG_PROJECTION_AUTHORITY_MISMATCH"
  );
});
