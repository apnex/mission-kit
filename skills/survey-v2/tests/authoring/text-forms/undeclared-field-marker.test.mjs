import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  makeForm,
  parseTextForm,
  renderBlank
} from "./support.mjs";

test("a submitted form cannot introduce an undeclared field-marker region", () => {
  const formDefinition = makeForm();
  const blankViewBytes = renderBlank(formDefinition);
  const submittedBytes = Buffer.from(
    blankViewBytes.toString("utf8").replace(
      "<!-- /field:summary -->\n",
      [
        "<!-- /field:summary -->",
        "<!-- field:rogue type=paragraph -->",
        "Rogue value",
        "<!-- /field:rogue -->",
        ""
      ].join("\n")
    ),
    "utf8"
  );

  assertErrorCode(
    () => parseTextForm({
      formDefinition,
      blankViewBytes,
      submittedBytes,
      expectedHandle: REQUEST_HANDLE
    }),
    "FIELD_UNDECLARED"
  );
});
