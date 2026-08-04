import assert from "node:assert/strict";
import test from "node:test";
import { rootRegistry } from "./support/fixture.mjs";
import { localContractValidators } from "./support/contracts.mjs";

test("shared-schema roots contract rejects a duplicate registered root", async () => {
  const { roots } = await localContractValidators();
  const duplicate = rootRegistry();
  duplicate.roots[1] = structuredClone(duplicate.roots[0]);
  assert.equal(roots(duplicate), false);
});
