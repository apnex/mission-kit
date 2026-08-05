import test from "node:test";

import {
  assertErrorCode,
  makeForm,
  renderBlank
} from "./support.mjs";

test("rendering rejects a form whose semantic body differs from its sealed digest", () => {
  const form = makeForm();
  form.spec.fields[0].heading = "Changed after sealing";

  assertErrorCode(
    () => renderBlank(form),
    "FORM_DIGEST_MISMATCH"
  );
});
