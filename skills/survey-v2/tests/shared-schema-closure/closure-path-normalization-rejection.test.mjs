import assert from "node:assert/strict";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import { createFixture, refreshOptions } from "./support/fixture.mjs";
import { localContractValidators } from "./support/contracts.mjs";

test("shared-schema closure contract rejects a non-normalized snapshot member path", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const { closure } = await localContractValidators();
    const escaped = structuredClone(manifest);
    escaped.schemas[0].snapshotPath =
      "dependencies/shared-schemas/v1/snapshot/../escaped.schema.json";
    assert.equal(closure(escaped), false);
  } finally {
    await fixture.cleanup();
  }
});
