import test from "node:test";

import {
  assertErrorCode,
  makeForm,
  renderBlank
} from "./support.mjs";

test("the executable form contract rejects undeclared root, spec, and field keys", () => {
  const mutations = [
    (form) => {
      form.ambient = true;
    },
    (form) => {
      form.spec.ambient = true;
    },
    (form) => {
      form.spec.fields[0].ambient = true;
    }
  ];

  for (const mutate of mutations) {
    const form = makeForm();
    mutate(form);
    assertErrorCode(
      () => renderBlank(form),
      "FORM_DEFINITION_INVALID"
    );
  }
});
