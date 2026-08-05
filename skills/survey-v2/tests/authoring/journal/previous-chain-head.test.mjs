import assert from "node:assert/strict";
import test from "node:test";
import { appendTransitionScenario } from "./support.mjs";

test("a later record binds the exact previous record digest", () => {
  const { journal } = appendTransitionScenario();
  assert.equal(
    journal[1].previousSealDigest,
    journal[0].recordDigest,
  );
});
