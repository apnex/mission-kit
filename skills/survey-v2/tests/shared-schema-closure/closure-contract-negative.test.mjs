import assert from "node:assert/strict";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import { createFixture, refreshOptions } from "./support/fixture.mjs";
import { localContractValidators } from "./support/contracts.mjs";

test("shared-schema closure contract rejects an unknown manifest field", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const { closure } = await localContractValidators();
    const unknown = structuredClone(manifest);
    unknown.unratified = true;
    assert.equal(closure(unknown), false);
  } finally {
    await fixture.cleanup();
  }
});
