import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  makeForm,
  paragraphField,
  parseTextForm,
  renderBlank
} from "./support.mjs";

test("a submitted form cannot duplicate a field-marker region", () => {
  const formDefinition = makeForm({
    fields: [
      paragraphField({ id: "first", heading: "First" }),
      paragraphField({ id: "second", heading: "Second" })
    ]
  });
  const blankViewBytes = renderBlank(formDefinition);
  const blankText = blankViewBytes.toString("utf8");
  const open = blankText.indexOf("<!-- field:first type=paragraph -->");
  const closeMarker = "<!-- /field:first -->";
  const close = blankText.indexOf(closeMarker, open) + closeMarker.length;
  const firstRegion = blankText.slice(open, close);
  const submittedBytes = Buffer.from(
    `${blankText.slice(0, close)}\n${firstRegion}${blankText.slice(close)}`,
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
    "FIELD_MARKER_DUPLICATE"
  );
});
