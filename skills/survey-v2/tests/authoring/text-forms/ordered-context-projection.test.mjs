import assert from "node:assert/strict";
import test from "node:test";

import {
  assertErrorCode,
  makeForm,
  renderBlank
} from "./support.mjs";

test("context projection preserves layer order and exposes only ordered role values", () => {
  const contextClosure = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    spec: {
      layers: [
        {
          ordinal: 1,
          role: "foundation",
          selectedValue: {
            zeta: 2,
            alpha: "<first>"
          },
          sourceDigest: "must-not-project"
        },
        {
          ordinal: 2,
          role: "focus",
          selectedValue: ["second", { beta: true, alpha: false }],
          sourceDigest: "must-not-project"
        }
      ]
    }
  };

  const rendered = renderBlank(makeForm(), contextClosure).toString("utf8");
  const expectedJson =
    '[{"ordinal":1,"role":"foundation","value":{"alpha":"\\u003cfirst>","zeta":2}},' +
    '{"ordinal":2,"role":"focus","value":["second",{"alpha":false,"beta":true}]}]';

  assert.ok(rendered.includes(`## Context\n\`\`\`json\n${expectedJson}\n\`\`\``));
  assert.ok(!rendered.includes("sourceDigest"));
  assert.ok(rendered.indexOf('"ordinal":1') < rendered.indexOf('"ordinal":2'));

  const outOfOrder = structuredClone(contextClosure);
  outOfOrder.spec.layers[0].ordinal = 2;
  assertErrorCode(
    () => renderBlank(makeForm(), outOfOrder),
    "FORM_CONTEXT_INVALID"
  );
});
