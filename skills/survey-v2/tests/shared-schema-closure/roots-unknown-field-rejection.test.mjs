import assert from "node:assert/strict";
import test from "node:test";
import { rootRegistry } from "./support/fixture.mjs";
import { localContractValidators } from "./support/contracts.mjs";

test("shared-schema roots contract rejects an unknown configuration field", async () => {
  const { roots } = await localContractValidators();
  const unknown = rootRegistry();
  unknown.unratified = true;
  assert.equal(roots(unknown), false);
});
