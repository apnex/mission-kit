import assert from "node:assert/strict";
import test from "node:test";
import {
  loadContractFixture,
  validateContract
} from "./support/contract-validation.mjs";

test("a singular context selection mode rejects plural cardinality", async () => {
  const profile = await loadContractFixture(
    "positive",
    "authoring-profile-manifest"
  );
  profile.spec.tasks[0].contextSelectors[0].cardinality = {
    min: 2,
    max: 2
  };

  const result = await validateContract(
    "authoring-profile-manifest",
    profile
  );

  assert.equal(result.valid, false);
  assert.equal(result.structuralErrors.length > 0, true);
});
