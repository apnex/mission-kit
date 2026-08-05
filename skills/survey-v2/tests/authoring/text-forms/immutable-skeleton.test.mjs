import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  makeForm,
  parseTextForm,
  renderBlank,
  renderPopulated
} from "./support.mjs";

test("only declared field bodies are mutable", () => {
  const formDefinition = makeForm();
  const blankViewBytes = renderBlank(formDefinition);
  const validSubmission = renderPopulated(formDefinition, {
    summary: "Filled"
  }).toString("utf8");
  const skeletonMutations = [
    validSubmission.replace("## Summary", "## Changed summary"),
    validSubmission.replace(
      "Write a concise summary.",
      "Changed static instruction."
    ),
    `${validSubmission}extra static text\n`
  ];

  for (const mutation of skeletonMutations) {
    assertErrorCode(
      () =>
        parseTextForm({
          formDefinition,
          blankViewBytes,
          submittedBytes: Buffer.from(mutation, "utf8"),
          expectedHandle: REQUEST_HANDLE
        }),
      "IMMUTABLE_SKELETON_CHANGED"
    );
  }
});
