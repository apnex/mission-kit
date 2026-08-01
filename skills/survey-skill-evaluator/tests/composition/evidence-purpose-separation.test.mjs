import assert from "node:assert/strict";
import test from "node:test";
import { SchemaValidator } from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";
import { synthesize } from "../schemas/schema-contract-fixtures.mjs";

test("generated contracts admit release assurance, causal efficacy, comparative selection, and diagnostic evolution as distinct evidence purposes", async () => {
  const validator = await SchemaValidator.fromPackageRoot(packageRoot);
  const assurance = synthesize(
    validator.schema("evaluator-assurance-certificate"),
  );
  const causal = {
    ...synthesize(validator.schema("claim")),
    claimClass: "upgrade-effect",
    supportedConclusion: "Incremental candidate effect over a frozen prior.",
  };
  const comparative = {
    ...synthesize(validator.schema("claim")),
    claimId: "comparative-claim",
    claimClass: "variant-selection",
    supportedConclusion: "Relative performance of sealed candidates.",
  };
  const diagnostic = synthesize(validator.schema("learning-handoff"));

  assert.equal(
    validator.check("evaluator-assurance-certificate", assurance).valid,
    true,
  );
  assert.equal(validator.check("claim", causal).valid, true);
  assert.equal(validator.check("claim", comparative).valid, true);
  assert.equal(validator.check("learning-handoff", diagnostic).valid, true);

  assert.equal(validator.check("claim", assurance).valid, false);
  assert.equal(
    validator.check("evaluator-assurance-certificate", causal).valid,
    false,
  );
  assert.equal(validator.check("learning-handoff", comparative).valid, false);
  assert.equal(validator.check("claim", diagnostic).valid, false);
  assert.equal(
    validator.check("claim", { ...causal, claimClass: "release-assurance" })
      .valid,
    false,
  );
});
