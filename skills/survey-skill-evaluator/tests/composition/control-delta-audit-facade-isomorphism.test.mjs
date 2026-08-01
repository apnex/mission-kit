import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealControlDeltaAudit } from "../../source/executables/statistics/index.mjs";
import { controlDeltaAuditFixture } from "./analytical-fixtures.mjs";

test("control-delta-audit facade preserves exact sealed bytes and rejects contradictory pass state", () => {
  const fixture = controlDeltaAuditFixture();
  const sealed = sealControlDeltaAudit(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () =>
      sealControlDeltaAudit({
        ...fixture,
        forbiddenDifferencePaths: ["$.prompt"],
      }),
    /pass state contradicts its evidence/,
  );
});
