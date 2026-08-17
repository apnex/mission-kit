import assert from "node:assert/strict";
import test from "node:test";
import { SchemaValidator } from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";
import { synthesize } from "../schemas/schema-contract-fixtures.mjs";

test("claim admission requires the preregistered population, estimand, analysis unit, and supported conclusion", async () => {
  const validator = await SchemaValidator.fromPackageRoot(packageRoot);
  const claim = {
    ...synthesize(validator.schema("claim")),
    claimClass: "upgrade-effect",
    targetPopulationId: "target-population",
    estimandId: "incremental-effect",
    analysisUnit: "blocked-assignment",
    supportedConclusion: "Incremental effect over the frozen prior version.",
  };
  assert.equal(validator.check("claim", claim).valid, true);

  for (const field of [
    "targetPopulationId",
    "estimandId",
    "analysisUnit",
    "supportedConclusion",
  ]) {
    const incomplete = { ...claim };
    delete incomplete[field];
    assert.equal(
      validator.check("claim", incomplete).valid,
      false,
      `missing ${field} must fail`,
    );
  }
  assert.equal(
    validator.check("claim", { ...claim, postOutcomeRewrite: true }).valid,
    false,
  );
});
