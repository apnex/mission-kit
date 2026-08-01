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

function inputFor(scenarios) {
  return {
    campaignId: "scenario-mismatch-campaign",
    campaignSealDigest: hashCanonical(
      "scenario-material-mismatch-seal/v1",
      { campaign: "scenario-mismatch-campaign" },
    ),
    lifecycleState: "EC0_DRAFT",
    lifecycleRevision: 0,
    authoritativeStateRoot: hashCanonical(
      "scenario-material-mismatch-state/v1",
      { revision: 0 },
    ),
    executionStarted: false,
    claimRequiresDownstream: false,
    sealedScenarios: scenarios,
  };
}

test("scenario-material admission fails closed on omitted scenarios, schema drift, and cross-digest mismatch", async (t) => {
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const scenarios = ["one", "two"].map((suffix) => {
    const scenario = campaignScenarioFixture({
      scenarioId: `scenario-${suffix}`,
      workItem: `Exercise scenario ${suffix}.`,
    });
    return {
      scenarioRef: `scenarios/${suffix}.json`,
      scenario,
      scenarioDigest: scenarioMaterialScenarioDigest(scenario),
    };
  });
  const cases = [
    {
      label: "omitted sealed scenario",
      mutate(core) {
        core.materials.pop();
      },
      expected: /cover every sealed scenario/u,
    },
    {
      label: "mismatched scenario digest",
      mutate(core) {
        core.materials[0].scenarioDigest = "a".repeat(64);
      },
      expected: /does not match its sealed scenario/u,
    },
    {
      label: "undeclared semantic-key field",
      mutate(core) {
        core.materials[0].semanticKey.answerScript = "hidden";
      },
      expected: /generated schema/u,
    },
    {
      label: "semantic-key to rubric digest mismatch",
      mutate(core) {
        core.materials[0].semanticKey.key.rubricDigest =
          hashCanonical("scenario-material-wrong-rubric/v1", {
            scenarioId: core.materials[0].scenarioId,
          });
      },
      expected: /cross-digest/u,
    },
    {
      label: "review to persona digest mismatch",
      mutate(core) {
        core.materials[0].scenarioReview.personaBriefDigest =
          "b".repeat(64);
      },
      expected: /cross-digest/u,
    },
  ];

  for (const fault of cases) {
    await t.test(fault.label, async () => {
      const authority = createScenarioMaterialAuthorityFixture({
        mutateResponseCore: fault.mutate,
      });
      const client = new ScenarioMaterialAuthorityClient({
        schemaValidator,
        provider: authority.provider,
      });
      await assert.rejects(client.request(inputFor(scenarios)), fault.expected);
    });
  }
});
