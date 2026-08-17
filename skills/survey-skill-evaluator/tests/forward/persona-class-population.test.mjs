import assert from "node:assert/strict";
import test from "node:test";
import { SchemaValidator } from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

test("scenario admission covers every canonical and adversarial legitimate persona class and rejects unknown classes", async () => {
  const validator = await SchemaValidator.fromPackageRoot(packageRoot);
  const classes = [
    "canonical",
    "ambiguous",
    "contradictory",
    "invalid_input",
    "withholding_correction",
    "interrupted_takeover",
    "adversarial_untrusted",
  ];
  for (const [index, scenarioClass] of classes.entries()) {
    const scenario = {
      schemaVersion: "1.0.0",
      hashProfileId: "survey-evaluator-sha256-jcs-v1",
      scenarioId: `scenario-${index + 1}`,
      workItem: `Exercise ${scenarioClass} Director behavior naturally.`,
      provenanceRoot: String(index + 1).repeat(64).slice(0, 64),
      outcomeAxes: [
        {
          axisId: "intent-recovery",
          publicLabel: "Intent recovery",
        },
      ],
      scenarioClass,
      requiredCapabilities: [],
      calibrationRefs: [],
      protectedMaterialIncluded: false,
    };
    assert.equal(
      validator.check("scenario", scenario).valid,
      true,
      scenarioClass,
    );
    assert.equal(
      validator.check("scenario", {
        ...scenario,
        scenarioClass: `${scenarioClass}_scripted`,
      }).valid,
      false,
    );
  }
  assert.equal(new Set(classes).size, 7);
});
