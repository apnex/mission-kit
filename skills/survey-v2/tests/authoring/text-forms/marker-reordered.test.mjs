import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  makeForm,
  paragraphField,
  parseTextForm,
  renderBlank
} from "./support.mjs";

test("field-marker regions must retain declared order", () => {
  const formDefinition = makeForm({
    fields: [
      paragraphField({ id: "first", heading: "First" }),
      paragraphField({ id: "second", heading: "Second" })
    ]
  });
  const blankViewBytes = renderBlank(formDefinition);
  const submittedBytes = Buffer.from(
    blankViewBytes
      .toString("utf8")
      .replace(
        "<!-- field:first type=paragraph -->",
        "<!-- field:second type=paragraph -->"
      ),
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
    "FIELD_MARKER_REORDERED"
  );
});
