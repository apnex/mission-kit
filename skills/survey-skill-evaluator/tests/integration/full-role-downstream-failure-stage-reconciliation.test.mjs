import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("a first downstream-consumer crash retains every prior role root and reconciles Survey separately from downstream", async (t) => {
  let downstreamInvocationCount = 0;
  const fixture = await makeFullRoleCampaignFixture({
    onInvocation(entry) {
      if (entry.roleClass !== "downstream-consumer") return;
      downstreamInvocationCount += 1;
      throw new Error("first downstream consumer failed");
    },
  });
  t.after(fixture.cleanup);

  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC_FAILED_CLOSED");
  assert.equal(downstreamInvocationCount, 1);

  const rolesDirectory = join(
    fixture.workspaceRoot,
    "evidence",
    "roles",
  );
  const roleFiles = (await readdir(rolesDirectory))
    .filter((entry) => entry.endsWith(".json"))
    .sort();
  const roleEvidence = await Promise.all(
    roleFiles.map((entry) =>
      readJson(join(rolesDirectory, entry))
    ),
  );
  assert.equal(roleEvidence.length, 4);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(
        Object.groupBy(
          roleEvidence,
          (record) => record.roleClass,
        ),
      ).map(([roleClass, records]) => [
        roleClass,
        records.length,
      ]),
    ),
    {
      "survey-executor": 2,
      "synthetic-director": 2,
    },
  );

  const envelope = await readJson(
    join(
      fixture.workspaceRoot,
      "results",
      "campaign-failure-envelope.json",
    ),
  );
  fixture.schemaValidator.assert(
    "campaign-failure-envelope",
    envelope,
  );
  for (const record of roleEvidence) {
    assert.equal(
      envelope.readableSourceRoots.includes(
        record.roleEvidenceDigest,
      ),
      true,
      `missing role root for ${record.workOrderId}`,
    );
    assert.equal(
      envelope.readableSourceRoots.includes(
        record.observableCaptureDigest,
      ),
      true,
      `missing observable root for ${record.workOrderId}`,
    );
  }

  assert.deepEqual(
    envelope.stagePopulationViews.map((view) => ({
      stage: view.stage,
      populationClass: view.populationClass,
      assignmentCount: view.assignmentCount,
      observedCount: view.observedCount,
      missingCount: view.missingCount,
      failureCount: view.failureCount,
    })),
    [
      {
        stage: "survey",
        populationClass: "all_assigned",
        assignmentCount: 2,
        observedCount: 2,
        missingCount: 0,
        failureCount: 0,
      },
      {
        stage: "survey",
        populationClass: "instrument_valid",
        assignmentCount: 2,
        observedCount: 2,
        missingCount: 0,
        failureCount: 0,
      },
      {
        stage: "survey",
        populationClass: "release_eligible",
        assignmentCount: 2,
        observedCount: 0,
        missingCount: 2,
        failureCount: 0,
      },
      {
        stage: "downstream",
        populationClass: "all_assigned",
        assignmentCount: 2,
        observedCount: 0,
        missingCount: 2,
        failureCount: 1,
      },
      {
        stage: "downstream",
        populationClass: "instrument_valid",
        assignmentCount: 2,
        observedCount: 0,
        missingCount: 2,
        failureCount: 1,
      },
      {
        stage: "downstream",
        populationClass: "release_eligible",
        assignmentCount: 2,
        observedCount: 0,
        missingCount: 2,
        failureCount: 1,
      },
    ],
  );
});
