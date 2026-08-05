import test from "node:test";

import {
  OTHER_REQUEST_HANDLE,
  REQUEST_HANDLE,
  assertErrorCode,
  makeForm,
  parseTextForm,
  renderBlank,
  renderPopulated
} from "./support.mjs";

test("a submitted request marker must match the assigned request handle", () => {
  const formDefinition = makeForm();
  const blankViewBytes = renderBlank(formDefinition);
  const validSubmission = renderPopulated(formDefinition, {
    summary: "Filled"
  });
  const submittedBytes = Buffer.from(
    validSubmission
      .toString("utf8")
      .replace(REQUEST_HANDLE, OTHER_REQUEST_HANDLE),
    "utf8"
  );

  assertErrorCode(
    () =>
      parseTextForm({
        formDefinition,
        blankViewBytes,
        submittedBytes,
        expectedHandle: REQUEST_HANDLE
      }),
    "REQUEST_MARKER_MISMATCH"
  );
});
