import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTHORING_FIELD_ID_PATTERN,
  assertErrorCode,
  makeForm,
  paragraphField,
  renderBlank
} from "./support.mjs";

test("the sealed field-ID grammar admits underscores and rejects invalid separators", () => {
  const validIds = [
    "alpha",
    "alpha1",
    "alpha_beta",
    "alpha-beta",
    "alpha.beta",
    "alpha_beta-2.gamma3"
  ];
  for (const id of validIds) {
    assert.equal(AUTHORING_FIELD_ID_PATTERN.test(id), true, id);
    const rendered = renderBlank(
      makeForm({ fields: [paragraphField({ id })] })
    ).toString("utf8");
    assert.ok(rendered.includes(`<!-- field:${id} type=paragraph -->`));
  }

  const invalidIds = [
    "_alpha",
    "-alpha",
    ".alpha",
    "alpha_",
    "alpha-",
    "alpha.",
    "alpha__beta",
    "alpha--beta",
    "alpha..beta",
    "alpha_-beta",
    "alpha._beta",
    "alpha-.beta",
    "alpha/beta",
    "Alpha"
  ];
  for (const id of invalidIds) {
    assert.equal(AUTHORING_FIELD_ID_PATTERN.test(id), false, id);
    assertErrorCode(
      () => renderBlank(makeForm({ fields: [paragraphField({ id })] })),
      "FORM_FIELD_ID_INVALID"
    );
  }
});
