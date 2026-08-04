import assert from "node:assert/strict";
import test from "node:test";
import { rootRegistry } from "./support/fixture.mjs";
import { localContractValidators } from "./support/contracts.mjs";

test("shared-schema roots contract accepts the canonical portable root registry", async () => {
  const { roots } = await localContractValidators();
  assert.equal(roots(rootRegistry()), true, JSON.stringify(roots.errors));
});
