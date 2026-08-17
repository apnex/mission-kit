import {
  FullSealedRoleCampaignDriver,
  createDeterministicFixtureRoleAdapters,
} from "../../source/executables/orchestrator/index.mjs";
import { deepCloneCanonical } from "../../source/executables/engine/index.mjs";
import { makeCampaignFixture } from "./campaign-fixture.mjs";
import {
  makeArtifactProducingV1Adapter,
} from "./subject-adapter-fixture.mjs";
import {
  createScenarioMaterialAuthorityFixture,
} from "./scenario-material-authority-fixture.mjs";
import {
  createDynamicReviewerAllocationAuthorityFixture,
} from "./reviewer-allocation-authority-fixture.mjs";

export async function makeFullRoleCampaignFixture({
  crashAfterTransitionId = null,
  onInvocation = null,
  scenarioFixtures = null,
  analysisPlanFixture = null,
  stoppingRuleFixture = null,
} = {}) {
  const invocations = [];
  const adapters = createDeterministicFixtureRoleAdapters({
    onInvocation: async (entry) => {
      invocations.push(deepCloneCanonical(entry));
      await onInvocation?.(entry);
    },
  });
  const subjectHost = makeArtifactProducingV1Adapter();
  const scenarioAuthority =
    createScenarioMaterialAuthorityFixture();
  const reviewerAuthority =
    createDynamicReviewerAllocationAuthorityFixture();
  const driver = new FullSealedRoleCampaignDriver({
    fixtureAdapterFactories: adapters,
    subjectAdapterResolver: async ({ adapterDescriptor }) => {
      if (
        adapterDescriptor.adapterDescriptorDigest !==
        subjectHost.adapter.describe().adapterDescriptorDigest
      ) {
        throw new Error("fixture subject adapter binding changed");
      }
      return subjectHost.adapter;
    },
    directorActionProvider: async () => ({
      actionClass: "ratify",
      payload: { decision: "confirm" },
    }),
    scenarioMaterialProvider: scenarioAuthority.provider,
    reviewerAllocationProvider: reviewerAuthority.provider,
    reviewerAllocationTrustRoot: reviewerAuthority.trustRoot,
    crashAfterTransitionId,
    clock: () => 1_700_000_000_000,
  });
  const fixture = await makeCampaignFixture({
    executionDriver: driver,
    assignmentsPerCell: 1,
    scenarioFixtures,
    analysisPlanFixture,
    stoppingRuleFixture,
  });
  return {
    ...fixture,
    driver,
    adapters,
    invocations,
    subjectHost,
    scenarioAuthority,
    reviewerAuthority,
  };
}
