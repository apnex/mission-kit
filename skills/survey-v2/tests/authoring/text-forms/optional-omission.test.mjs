import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUEST_HANDLE,
  assertErrorCode,
  booleanField,
  enumField,
  makeForm,
  paragraphField,
  parseTextForm,
  renderBlank,
  renderPopulated,
  stringListField
} from "./support.mjs";

test("optional values are represented by omission, not explicit empty values", () => {
  const cases = [
    [paragraphField({ required: false }), ""],
    [stringListField({ required: false }), []],
    [enumField({ required: false }), ""],
    [booleanField({ required: false }), null]
  ];

  for (const [field, explicitEmpty] of cases) {
    const formDefinition = makeForm({ fields: [field] });
    const blankViewBytes = renderBlank(formDefinition);
    const omittedBytes = renderPopulated(formDefinition, {});
    const parsed = parseTextForm({
      formDefinition,
      blankViewBytes,
      submittedBytes: omittedBytes,
      expectedHandle: REQUEST_HANDLE
    });

    assert.deepEqual(parsed.normalizedValues, {});
    assert.ok(
      omittedBytes
        .toString("utf8")
        .includes(
          `<!-- field:${field.id} type=${field.type} -->\n` +
          `<!-- /field:${field.id} -->`
        )
    );
    assertErrorCode(
      () =>
        renderPopulated(formDefinition, {
          [field.id]: explicitEmpty
        }),
      "FIELD_VALUE_NON_CANONICAL"
    );
  }
});
