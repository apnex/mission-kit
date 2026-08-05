import assert from "node:assert/strict";
import test from "node:test";

import {
  makeAllTypesForm,
  renderBlank,
  renderPopulated
} from "./support.mjs";

test("rendered text forms end in exactly one terminal LF", () => {
  const formDefinition = makeAllTypesForm();
  const outputs = [
    renderBlank(formDefinition),
    renderPopulated(formDefinition, {
      summary_text: "Canonical summary",
      "key-points": ["one"],
      "priority.level": "medium",
      approved: false
    })
  ];

  for (const bytes of outputs) {
    const text = bytes.toString("utf8");
    assert.ok(text.endsWith("\n"));
    assert.ok(!text.endsWith("\n\n"));
    assert.ok(!text.includes("\r"));
  }
});
