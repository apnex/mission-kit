import assert from "node:assert/strict";
import test from "node:test";

import {
  makeForm,
  parseEditedBody,
  renderPopulated
} from "./support.mjs";

test("Unicode scalars remain exact without compatibility normalization", () => {
  const formDefinition = makeForm();
  const value = `alpha\uFEFFe\u0301\u2028omega`;
  const parsed = parseEditedBody(
    formDefinition,
    "summary",
    [value]
  );
  assert.equal(parsed.normalizedValues.summary, value);

  const rendered = renderPopulated(formDefinition, { summary: value });
  assert.ok(rendered.includes(Buffer.from(value, "utf8")));
});
