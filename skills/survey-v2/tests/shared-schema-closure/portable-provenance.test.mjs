import assert from "node:assert/strict";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import { createFixture, refreshOptions } from "./support/fixture.mjs";

test("snapshot provenance contains no host path timestamp or Git revision pin", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const serialized = JSON.stringify(manifest);
    assert.equal(serialized.includes(fixture.temporaryRoot), false);
    assert.doesNotMatch(serialized, /(?:generatedAt|timestamp|commit|gitSha|gitTree)/i);
    assert.deepEqual(manifest.source, {
      kind: "repository-selector",
      repository: "apnex/mission-kit",
      selector: "schemas"
    });
  } finally {
    await fixture.cleanup();
  }
});
