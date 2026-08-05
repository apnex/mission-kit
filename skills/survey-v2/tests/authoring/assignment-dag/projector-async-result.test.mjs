import test from "node:test";
import {
  issueTextAssignment,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  assertDagError,
  loadK10AssignmentScenario,
} from "./support.mjs";

test(
  "assignment issuance consumes and rejects an asynchronous projector result",
  async () => {
    const scenario = await loadK10AssignmentScenario();

    assertDagError(
      () => issueTextAssignment({
        ...scenario,
        projectionName: "async-projector-projection",
        assignmentName: "async-projector-assignment",
        renderProjection() {
          return Promise.reject(
            new Error("must be synchronously consumed"),
          );
        },
      }),
      "DAG_PROJECTOR_ASYNC_FORBIDDEN",
    );
  },
);
