import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";
import {
  makeV1Adapter,
} from "../helpers/subject-adapter-fixture.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("a terminal Survey-subject failure remains sealed in the all-assigned failure cut without invented attribution or outcome", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  const failedSubject = makeV1Adapter({
    terminalClass: "failed",
  });
  fixture.driver.subjectAdapterResolver = async () =>
    failedSubject.adapter;

  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC_FAILED_CLOSED");
  assert.equal(result.evidenceClass, "inclusive_failure_evidence");

  const subjectDirectory = join(
    fixture.workspaceRoot,
    "evidence",
    "subjects",
  );
  const subjectFiles = (await readdir(subjectDirectory))
    .filter((entry) => entry.endsWith(".json"));
  assert.equal(subjectFiles.length, 1);
  const subject = await readJson(
    join(subjectDirectory, subjectFiles[0]),
  );
  fixture.schemaValidator.assert(
    "survey-subject-execution",
    subject,
  );
  assert.equal(subject.outcomeClass, "failed");
  assert.equal(subject.outcomeAttribution, "unresolved");
  assert.equal(subject.artifact, null);
  assert.equal(subject.artifactRawSha256, null);
  assert.equal(subject.artifactSemanticDigest, null);

  const envelope = await readJson(
    join(
      fixture.workspaceRoot,
      "results",
      "campaign-failure-envelope.json",
    ),
  );
  assert.equal(
    envelope.readableSourceRoots.includes(
      subject.subjectExecutionDigest,
    ),
    true,
  );
  const attempts = envelope.positionDispositions.filter(
    (position) => position.positionClass === "attempt",
  );
  assert.equal(attempts.length, 2);
  assert.equal(
    attempts.filter(
      (position) => position.disposition === "terminal",
    ).length,
    1,
  );
  assert.deepEqual(
    envelope.populationViews.map((view) => ({
      populationClass: view.populationClass,
      assignmentCount: view.assignmentCount,
      observedCount: view.observedCount,
      missingCount: view.missingCount,
      failureCount: view.failureCount,
    })),
    [
      {
        populationClass: "all_assigned",
        assignmentCount: 2,
        observedCount: 1,
        missingCount: 1,
        failureCount: 1,
      },
      {
        populationClass: "instrument_valid",
        assignmentCount: 2,
        observedCount: 0,
        missingCount: 2,
        failureCount: 1,
      },
      {
        populationClass: "release_eligible",
        assignmentCount: 2,
        observedCount: 0,
        missingCount: 2,
        failureCount: 1,
      },
    ],
  );
  assert.equal(
    attempts.filter(
      (position) =>
        position.disposition === "terminalized_unconsumed",
    ).length,
    1,
  );
  await assert.rejects(
    access(
      join(fixture.workspaceRoot, "results", "analysis-result.json"),
    ),
  );
});
