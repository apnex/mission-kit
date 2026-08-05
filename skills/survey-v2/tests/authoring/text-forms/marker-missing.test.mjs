import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  makeForm,
  paragraphField,
  parseTextForm,
  renderBlank
} from "./support.mjs";

test("a submitted form cannot omit a declared field-marker region", () => {
  const formDefinition = makeForm({
    fields: [
      paragraphField({ id: "first", heading: "First" }),
      paragraphField({ id: "second", heading: "Second" })
    ]
  });
  const blankViewBytes = renderBlank(formDefinition);
  const blankText = blankViewBytes.toString("utf8");
  const open = blankText.indexOf("<!-- field:second type=paragraph -->");
  const closeMarker = "<!-- /field:second -->";
  const close = blankText.indexOf(closeMarker, open) + closeMarker.length;
  const submittedBytes = Buffer.from(
    `${blankText.slice(0, open)}${blankText.slice(close)}`,
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
    "FIELD_MARKER_MISSING"
  );
});
