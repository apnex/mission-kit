import test from "node:test";
import {
  reproduceAssignmentView,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  renderBlankTextForm,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  assertDagError,
  issueK10TextAssignment,
} from "./support.mjs";

function renderer(owner) {
  return (input) => Buffer.concat([
    renderBlankTextForm({
      formDefinition: input.formDefinition,
      contextClosure: input.contextClosure,
      requestHandle: input.requestHandle,
    }),
    Buffer.from(`\nprojection-owner: ${owner}\n`, "utf8"),
  ]);
}

test(
  "cold reproduction rejects a projector that diverges from retained exact view bytes",
  async () => {
    const issued = await issueK10TextAssignment({
      renderProjection: renderer("original"),
    });

    assertDagError(
      () => reproduceAssignmentView({
        ...issued,
        renderProjection: renderer("divergent"),
      }),
      "DAG_VIEW_REPRODUCTION_MISMATCH",
    );
  },
);
