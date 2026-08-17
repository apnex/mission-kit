import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/engine/canonical-json.mjs";

test("a projection output cannot close a derivation cycle through itself", () => {
  const output = { path: "SKILL.md" };
  output.derivation = { output };
  assert.throws(() => canonicalize(output), /cyclic/);
});
