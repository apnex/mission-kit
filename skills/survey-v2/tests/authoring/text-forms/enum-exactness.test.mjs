import assert from "node:assert/strict";
import test from "node:test";

import {
  assertErrorCode,
  enumField,
  makeForm,
  parseEditedBody
} from "./support.mjs";

test("enum fields accept exactly one declared case-sensitive member", () => {
  const formDefinition = makeForm({
    fields: [enumField()]
  });

  for (const member of ["low", "medium", "high"]) {
    assert.deepEqual(
      parseEditedBody(formDefinition, "priority", [` \t${member}\t `])
        .normalizedValues,
      { priority: member }
    );
  }
  for (const body of [["High"], ["urgent"], ["low", "high"]]) {
    assertErrorCode(
      () => parseEditedBody(formDefinition, "priority", body),
      "FIELD_ENUM_INVALID"
    );
  }
});
