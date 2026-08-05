import assert from "node:assert/strict";
import test from "node:test";

import {
  makeAllTypesForm,
  renderBlank,
  renderPopulated
} from "./support.mjs";

test("repeated text-form renders produce identical bytes", () => {
  const formDefinition = makeAllTypesForm();
  const values = {
    summary_text: "A stable summary.",
    "key-points": ["first", "second"],
    "priority.level": "high",
    approved: true
  };

  const firstBlank = renderBlank(formDefinition);
  const secondBlank = renderBlank(structuredClone(formDefinition));
  const firstPopulated = renderPopulated(formDefinition, values);
  const secondPopulated = renderPopulated(
    structuredClone(formDefinition),
    structuredClone(values)
  );

  assert.deepEqual(secondBlank, firstBlank);
  assert.deepEqual(secondPopulated, firstPopulated);
});
