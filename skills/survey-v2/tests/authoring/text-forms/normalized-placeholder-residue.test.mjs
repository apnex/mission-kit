import test from "node:test";

import {
  assertErrorCode,
  makeForm,
  paragraphField,
  parseEditedBody,
  stringListField
} from "./support.mjs";

test("paragraph and string-list placeholder residue is rejected after normalization", () => {
  const cases = [
    {
      field: paragraphField(),
      bodyLines: ["Replace this summary \t"]
    },
    {
      field: stringListField(),
      bodyLines: ["- Replace with one item per line \t"]
    }
  ];

  for (const { field, bodyLines } of cases) {
    const formDefinition = makeForm({
      fields: [field]
    });
    assertErrorCode(
      () => parseEditedBody(formDefinition, field.id, bodyLines),
      "FIELD_PLACEHOLDER_UNEDITED"
    );
  }
});
