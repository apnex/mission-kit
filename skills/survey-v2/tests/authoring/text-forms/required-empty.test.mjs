import test from "node:test";

import {
  assertErrorCode,
  booleanField,
  enumField,
  makeForm,
  paragraphField,
  parseEditedBody,
  stringListField
} from "./support.mjs";

test("an empty required field is rejected for every field type", () => {
  const fields = [
    paragraphField(),
    stringListField(),
    enumField(),
    booleanField()
  ];

  for (const field of fields) {
    const formDefinition = makeForm({ fields: [field] });
    const error = assertErrorCode(
      () => parseEditedBody(formDefinition, field.id, []),
      "FIELD_REQUIRED"
    );
    if (error.fieldId !== field.id) {
      throw new Error(`required-field error identified ${String(error.fieldId)}`);
    }
  }
});
