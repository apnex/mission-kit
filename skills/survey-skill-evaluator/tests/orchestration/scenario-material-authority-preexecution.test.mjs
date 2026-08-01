import assert from "node:assert/strict";
import test from "node:test";
import {
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

function baseInput() {
  const scenario = campaignScenarioFixture({
    scenarioId: "scenario-timing",
    workItem: "Prove pre-execution material construction.",
  });
  return {
    campaignId: "scenario-timing-campaign",
    campaignSealDigest: hashCanonical(
      "scenario-material-timing-seal/v1",
      { campaign: "scenario-timing-campaign" },
    ),
    lifecycleState: "EC0_DRAFT",
    lifecycleRevision: 0,
    authoritativeStateRoot: hashCanonical(
      "scenario-material-timing-state/v1",
      { revision: 0 },
    ),
    executionStarted: false,
    claimRequiresDownstream: false,
    sealedScenarios: [
      {
        scenarioRef: "scenario-timing.json",
        scenario,
        scenarioDigest: scenarioMaterialScenarioDigest(scenario),
      },
    ],
  };
}

test("scenario-material authority has no fallback and cannot construct or attest materials after execution starts", async () => {
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const authority = createScenarioMaterialAuthorityFixture();
  const client = new ScenarioMaterialAuthorityClient({
    schemaValidator,
    provider: authority.provider,
  });

  await assert.rejects(
    client.request({
      ...baseInput(),
      lifecycleState: "EC4_SURVEY_EXECUTING",
      executionStarted: true,
    }),
    /pre-execution campaign state/u,
  );
  assert.equal(authority.invocations.length, 0);

  const lateAttestation = createScenarioMaterialAuthorityFixture({
    mutateResponseCore(core) {
      core.constructedBeforeExecution = false;
    },
  });
  const lateClient = new ScenarioMaterialAuthorityClient({
    schemaValidator,
    provider: lateAttestation.provider,
  });
  await assert.rejects(
    lateClient.request(baseInput()),
    /not bound to the pre-execution request/u,
  );

  const noProviderClient = new ScenarioMaterialAuthorityClient({
    schemaValidator,
    provider: null,
  });
  await assert.rejects(
    noProviderClient.request(baseInput()),
    /did not supply an external scenario-material authority provider/u,
  );
});
