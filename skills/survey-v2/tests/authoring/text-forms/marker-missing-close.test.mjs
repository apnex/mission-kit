import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  makeForm,
  paragraphField,
  parseTextForm,
  renderBlank
} from "./support.mjs";

test("an opened field-marker region must have its matching close marker", () => {
  const formDefinition = makeForm({
    fields: [paragraphField({ id: "only" })]
  });
  const blankViewBytes = renderBlank(formDefinition);
  const submittedBytes = Buffer.from(
    blankViewBytes
      .toString("utf8")
      .replace("<!-- /field:only -->", ""),
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
    "FIELD_MARKER_MISSING_CLOSE"
  );
});
