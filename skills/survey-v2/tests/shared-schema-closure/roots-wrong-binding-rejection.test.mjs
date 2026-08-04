import assert from "node:assert/strict";
import test from "node:test";
import { rootRegistry } from "./support/fixture.mjs";
import { localContractValidators } from "./support/contracts.mjs";

test("shared-schema roots contract rejects a kind bound to the wrong schema identity", async () => {
  const { roots } = await localContractValidators();
  const wrong = rootRegistry();
  wrong.roots[0].schemaId =
    "urn:mission-kit:schemas:context-frame:wrong:v1alpha1";
  assert.equal(roots(wrong), false);
});
