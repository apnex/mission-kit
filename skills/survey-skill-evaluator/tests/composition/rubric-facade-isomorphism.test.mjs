import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealRubric } from "../../source/executables/statistics/index.mjs";
import { rubricFixture } from "./analytical-fixtures.mjs";

test("rubric facade preserves exact sealed bytes and rejects unknown fields", () => {
  const fixture = rubricFixture();
  const sealed = sealRubric(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () => sealRubric({ ...fixture, dynamicDenominator: true }),
    /violates its sealed contract/,
  );
});
