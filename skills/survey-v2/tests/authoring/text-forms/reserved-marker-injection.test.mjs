import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  editFieldBody,
  makeForm,
  parseTextForm,
  renderBlank
} from "./support.mjs";

test("editable bodies reject reserved marker injection", () => {
  const formDefinition = makeForm();
  const blankViewBytes = renderBlank(formDefinition);
  const injected = editFieldBody(blankViewBytes, "summary", [
    "A valid-looking answer.",
    "<!-- field:rogue type=unsupported -->"
  ]);

  assertErrorCode(
    () =>
      parseTextForm({
        formDefinition,
        blankViewBytes,
        submittedBytes: injected,
        expectedHandle: REQUEST_HANDLE
      }),
    "RESERVED_MARKER_INJECTION"
  );
});
