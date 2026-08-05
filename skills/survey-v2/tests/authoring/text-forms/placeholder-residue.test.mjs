import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  booleanField,
  enumField,
  makeForm,
  paragraphField,
  parseEditedBody,
  parseTextForm,
  renderBlank,
  stringListField
} from "./support.mjs";

test("an exact generated placeholder sentinel cannot remain in a submitted field", () => {
  const fields = [
    paragraphField(),
    stringListField(),
    enumField(),
    booleanField()
  ];

  for (const field of fields) {
    const formDefinition = makeForm({ fields: [field] });
    const blankViewBytes = renderBlank(formDefinition);
    assertErrorCode(
      () =>
        parseTextForm({
          formDefinition,
          blankViewBytes,
          submittedBytes: blankViewBytes,
          expectedHandle: REQUEST_HANDLE
        }),
      "FIELD_PLACEHOLDER_UNEDITED"
    );
  }

  const paragraphForm = makeForm({
    fields: [paragraphField()]
  });
  assert.deepEqual(
    parseEditedBody(paragraphForm, "summary", [
      "Replace this summary with actual content"
    ]).normalizedValues,
    { summary: "Replace this summary with actual content" }
  );

  const listForm = makeForm({
    fields: [stringListField()]
  });
  assert.deepEqual(
    parseEditedBody(listForm, "items", [
      "- Replace with one item per line!"
    ]).normalizedValues,
    { items: ["Replace with one item per line!"] }
  );
});
