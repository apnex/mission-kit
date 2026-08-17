import assert from "node:assert/strict";
import test from "node:test";
import {
  HASH_PROFILE_ID,
  hashCanonical,
  SchemaValidator,
} from "../../source/executables/engine/index.mjs";
import {
  ScenarioMaterialAuthorityClient,
  scenarioMaterialScenarioDigest,
} from "../../source/executables/orchestrator/index.mjs";
import {
  campaignScenarioFixture,
  packageRoot,
} from "../helpers/campaign-fixture.mjs";
import {
  createScenarioMaterialAuthorityFixture,
} from "../helpers/scenario-material-authority-fixture.mjs";

function requestInput(scenarios) {
  return {
    campaignId: "scenario-material-campaign",
    campaignSealDigest: hashCanonical(
      "scenario-material-test-seal/v1",
      { campaignId: "scenario-material-campaign" },
    ),
    lifecycleState: "EC0_DRAFT",
    lifecycleRevision: 0,
    authoritativeStateRoot: hashCanonical(
      "scenario-material-test-state/v1",
      { revision: 0 },
    ),
    executionStarted: false,
    claimRequiresDownstream: false,
    sealedScenarios: scenarios,
  };
}

test("external scenario-material authority covers every sealed scenario with schema-valid cross-bound materials", async () => {
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const first = campaignScenarioFixture({
    scenarioId: "scenario-alpha",
    workItem: "Preserve alpha intent.",
  });
  const second = campaignScenarioFixture({
    scenarioId: "scenario-beta",
    workItem: "Preserve beta intent.",
  });
  const sealedScenarios = [
    {
      scenarioRef: "scenarios/beta.json",
      scenario: second,
      scenarioDigest: scenarioMaterialScenarioDigest(second),
    },
    {
      scenarioRef: "scenarios/alpha.json",
      scenario: first,
      scenarioDigest: scenarioMaterialScenarioDigest(first),
    },
  ];
  const authority = createScenarioMaterialAuthorityFixture();
  const client = new ScenarioMaterialAuthorityClient({
    schemaValidator,
    provider: authority.provider,
  });
  const admitted = await client.request(requestInput(sealedScenarios));

  assert.equal(admitted.schemaVersion, "1.0.0");
  assert.equal(admitted.hashProfileId, HASH_PROFILE_ID);
  assert.equal(admitted.materials.length, 2);
  assert.deepEqual(
    admitted.materials.map((material) => material.scenarioId),
    ["scenario-alpha", "scenario-beta"],
  );
  assert.equal(authority.invocations.length, 1);
  assert.equal(authority.invocations[0].scenarioBindings.length, 2);
  for (const material of admitted.materials) {
    assert.equal(
      schemaValidator.check("semantic-key", material.semanticKey).valid,
      true,
    );
    assert.equal(
      schemaValidator.check("persona-brief", material.personaBrief).valid,
      true,
    );
    assert.equal(schemaValidator.check("rubric", material.rubric).valid, true);
    assert.equal(
      schemaValidator.check("scenario-review", material.scenarioReview).valid,
      true,
    );
    assert.equal(material.scenarioReview.verdict, "pass");
    assert.match(material.materialBundleDigest, /^[a-f0-9]{64}$/u);
  }
  assert.equal(Object.isFrozen(admitted), true);
  assert.equal(Object.isFrozen(admitted.materials[0]), true);
});
