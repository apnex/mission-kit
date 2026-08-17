import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCommand } from "../../source/executables/cli/index.mjs";
import {
  HASH_PROFILE_ID,
  LifecycleRegistry,
  SchemaValidator,
  hashCanonical,
  requiredCommandAuthorityIds,
} from "../../source/executables/engine/index.mjs";
import {
  CampaignOrchestrator,
} from "../../source/executables/orchestrator/index.mjs";
import {
  campaignAnalysisPlanFixture,
  campaignDependencePlanFixture,
  campaignScenarioFixture,
  fixtureSubjectAdapter,
  packageRoot,
  writeSurveyCandidateSource,
} from "../helpers/campaign-fixture.mjs";
import { forceRemoveFixtureTree } from "../helpers/candidate-capture-fixture.mjs";
import { createExternalAuthorityFixture } from "../helpers/external-authority-fixture.mjs";

function sink() {
  let value = "";
  return {
    write(chunk) {
      value += chunk;
    },
    value() {
      return value;
    },
  };
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

test("all eight stable operator commands execute with machine-readable results", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "survey-cli-"));
  const subjectRoot = await mkdtemp(join(tmpdir(), "survey-cli-subjects-"));
  const registry = await LifecycleRegistry.fromFile(
    join(packageRoot, "source/manifests/lifecycles.json"),
  );
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const authority = createExternalAuthorityFixture({
    authorityIds: [
      ...new Set(
        [...registry.participantPolicies.values()].flatMap((policy) =>
          requiredCommandAuthorityIds(policy),
        ),
      ),
    ],
    schemaValidator,
  });
  const orchestratorFactory = (options) =>
    CampaignOrchestrator.open({
      ...options,
      authorityTrustRoot: authority.trustRoot,
      authorityReceiptProvider: authority.provider,
    });
  const invoke = async (forcedCommand, extra = {}, argv = []) => {
    const stdout = sink();
    const stderr = sink();
    const code = await runCommand(
      [
        ...(forcedCommand.startsWith("campaign")
          ? ["--workspace", workspaceRoot]
          : []),
        ...argv,
      ],
      {
        forcedCommand,
        packageRoot,
        orchestratorFactory,
        stdout,
        stderr,
        ...extra,
      },
    );
    return { code, stdout: stdout.value(), stderr: stderr.value() };
  };
  try {
    const initialized = await invoke(
      "campaign init",
      {},
      ["--campaign-id", "cli-campaign"],
    );
    assert.equal(initialized.code, 0, initialized.stderr);

    const candidateSource = join(subjectRoot, "candidate");
    const controlSource = join(subjectRoot, "control");
    await writeSurveyCandidateSource(candidateSource, "CLI candidate fixture.");
    await writeSurveyCandidateSource(controlSource, "CLI control fixture.");
    const orchestrator = await CampaignOrchestrator.open({
      packageRoot,
      workspaceRoot,
    });
    const adapter = fixtureSubjectAdapter();
    const candidateArm = await orchestrator.captureCandidate({
      armId: "candidate",
      sourceRoot: candidateSource,
      adapter,
    });
    const controlArm = await orchestrator.captureCandidate({
      armId: "control",
      sourceRoot: controlSource,
      adapter,
    });
    await writeJson(
      join(workspaceRoot, "analysis-plan.json"),
      campaignAnalysisPlanFixture(),
    );
    await writeJson(
      join(workspaceRoot, "dependence-plan.json"),
      campaignDependencePlanFixture(),
    );
    await writeJson(join(workspaceRoot, "stopping-rule.json"), {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      ruleId: "no-provider",
      ruleClass: "fixed_sample",
      sampleUnit: "scenario_stratum_arm_cell",
      minimumAssignmentsPerCell: 0,
      maximumAssignmentsPerCell: 0,
      completionRule: "all_assigned_terminal",
      outcomeResponsiveStoppingPermitted: false,
    });
    await writeJson(
      join(workspaceRoot, "scenario.json"),
      campaignScenarioFixture({
        scenarioId: "cli-scenario",
        workItem: "Exercise the sealed CLI campaign protocol.",
      }),
    );
    await writeJson(join(workspaceRoot, "campaign-input.json"), {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      campaignId: "cli-campaign",
      useClass: "diagnostic",
      promotionAuthorized: false,
      arms: [
        {
          armId: "candidate",
          conditionClass: "candidate",
          environmentDigest: hashCanonical(
            "campaign-environment-fixture/v1",
            { environment: "shared" },
          ),
          snapshotRef: candidateArm.snapshotRef,
        },
        {
          armId: "control",
          conditionClass: "frozen-prior",
          environmentDigest: hashCanonical(
            "campaign-environment-fixture/v1",
            { environment: "shared" },
          ),
          snapshotRef: controlArm.snapshotRef,
        },
      ],
      claims: [
        {
          claimId: "claim-1",
          text: "Synthetic protocol integrity",
          claimClass: "upgrade-effect",
          treatmentArmId: "candidate",
          controlArmId: "control",
        },
      ],
      population: { target: "known_answer_fixture", strata: [] },
      controlAuditPolicy: {
        treatmentArmId: "candidate",
        controlArmId: "control",
        manipulatedMechanismId: "survey-methodology",
        allowedDifferencePaths: ["$"],
        forbiddenDifferencePaths: [],
        forbiddenDoctrineTerms: [],
        expectedDirectionVisibleToAuditor: false,
      },
      scenarioRefs: ["scenario.json"],
      analysisPlanRef: "analysis-plan.json",
      dependencePlanRef: "dependence-plan.json",
      stoppingRuleRef: "stopping-rule.json",
    });

    for (const command of ["campaign seal", "campaign validate", "campaign run"]) {
      const outcome = await invoke(command);
      assert.equal(outcome.code, 0, `${command}: ${outcome.stderr}`);
      assert.equal(JSON.parse(outcome.stdout).ok, true);
    }
    const resumed = await invoke("campaign resume");
    assert.equal(resumed.code, 0, resumed.stderr);
    const status = await invoke("campaign status");
    assert.equal(status.code, 0, status.stderr);
    assert.equal(JSON.parse(status.stdout).result.phase, "EC18_CLOSED");
    const report = await invoke("campaign report");
    assert.equal(report.code, 0, report.stderr);
    assert.equal(
      JSON.parse(report.stdout).result.recommendation.promotionAuthorized,
      false,
    );
    const checked = await invoke("package check", {
      packageChecker: async (root) => ({
        valid: true,
        packageRoot: root,
        independentCompilerCheck: true,
      }),
    });
    assert.equal(checked.code, 0, checked.stderr);
    assert.equal(JSON.parse(checked.stdout).result.valid, true);
  } finally {
    await forceRemoveFixtureTree(workspaceRoot);
    await forceRemoveFixtureTree(subjectRoot);
  }
});
