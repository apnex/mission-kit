import test from "node:test";
import {
  issueTextAssignment,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  assertDagError,
  loadK10AssignmentScenario,
} from "./support.mjs";

test(
  "assignment issuance fails closed when its pinned projector renderer is omitted",
  async () => {
    const scenario = await loadK10AssignmentScenario();

    assertDagError(
      () => issueTextAssignment({
        ...scenario,
        projectionName: "missing-projector-projection",
        assignmentName: "missing-projector-assignment",
      }),
      "DAG_PROJECTOR_REQUIRED",
    );
  },
);
