import test from "node:test";

import {
  assertErrorCode,
  enumField,
  makeForm,
  renderBlank
} from "./support.mjs";

test("enum members with leading or trailing whitespace are rejected as non-canonical", () => {
  for (const member of [" low", "\tlow", "low ", "low\t"]) {
    const formDefinition = makeForm({
      fields: [
        enumField({
          constraints: {
            members: [member, "high"]
          }
        })
      ]
    });

    assertErrorCode(
      () => renderBlank(formDefinition),
      "FORM_PRESENTATION_LINE_INVALID"
    );
  }
});
