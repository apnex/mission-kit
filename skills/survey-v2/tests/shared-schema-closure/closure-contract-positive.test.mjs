import assert from "node:assert/strict";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import { createFixture, refreshOptions } from "./support/fixture.mjs";
import { localContractValidators } from "./support/contracts.mjs";

test("shared-schema closure contract accepts a freshly derived complete manifest", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const { closure } = await localContractValidators();
    assert.equal(closure(manifest), true, JSON.stringify(closure.errors));
  } finally {
    await fixture.cleanup();
  }
});
