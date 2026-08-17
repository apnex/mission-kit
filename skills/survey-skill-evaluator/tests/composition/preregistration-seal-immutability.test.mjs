import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeCampaignFixture } from "../helpers/campaign-fixture.mjs";

test("preregistration seal binds claim, contrast, population, stopping rule, and supported conclusion before outcomes", async (t) => {
  const fixture = await makeCampaignFixture();
  t.after(fixture.cleanup);
  const paths = {
    campaign: join(fixture.workspaceRoot, "campaign-input.json"),
    analysis: join(fixture.workspaceRoot, "analysis-plan.json"),
    dependence: join(fixture.workspaceRoot, "dependence-plan.json"),
    stopping: join(fixture.workspaceRoot, "stopping-rule.json"),
  };
  const originals = {
    campaign: await readFile(paths.campaign),
    analysis: await readFile(paths.analysis),
    dependence: await readFile(paths.dependence),
    stopping: await readFile(paths.stopping),
  };
  assert.equal((await fixture.orchestrator.validate()).valid, true);
  assert.equal((await fixture.orchestrator.status()).phase, "EC0_DRAFT");

  const mutations = [
    {
      target: "campaign",
      change(value) {
        value.claims[0].text = "post-outcome claim rewrite";
      },
    },
    {
      target: "campaign",
      change(value) {
        value.population.target = "post_outcome_population";
      },
    },
    {
      target: "campaign",
      change(value) {
        value.controlAuditPolicy.allowedDifferencePaths = ["$.postOutcome"];
      },
    },
    {
      target: "campaign",
      change(value) {
        value.arms.reverse();
      },
    },
    {
      target: "stopping",
      change(value) {
        value.maximumAssignments = 1;
      },
    },
    {
      target: "analysis",
      change(value) {
        value.estimand.supportedConclusion = "post-outcome conclusion";
      },
    },
    {
      target: "dependence",
      change(value) {
        value.estimatorId = "post_outcome_estimator";
      },
    },
  ];

  for (const mutation of mutations) {
    const value = JSON.parse(originals[mutation.target].toString("utf8"));
    mutation.change(value);
    await writeFile(paths[mutation.target], `${JSON.stringify(value)}\n`);
    await assert.rejects(
      fixture.orchestrator.validate(),
      /changed after sealing|dependency changed/u,
    );
    await writeFile(paths[mutation.target], originals[mutation.target]);
    assert.equal((await fixture.orchestrator.validate()).valid, true);
  }
});
