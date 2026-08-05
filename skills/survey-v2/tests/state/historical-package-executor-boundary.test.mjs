import assert from "node:assert/strict";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applySurveyCommand,
  MatchingFrozenPackageRequiredError
} from "../../source/executables/runtime/lib/engine.mjs";
import {
  CURRENT_EXECUTOR_SESSION_SCHEMA_ID,
  readVerifiedSession
} from "../../source/executables/runtime/lib/storage.mjs";
import {
  newRun,
  proposer
} from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("current applySurveyCommand requires a matching frozen package before writes while active package v1 remains executable", async () => {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-historical-boundary-")
  );
  const historicalRun = path.join(temporary, "historical", "run-1");
  let activeRun;
  try {
    await mkdir(historicalRun, { recursive: true });
    const historicalFixture = path.join(
      surveyRoot,
      "tests/fixtures/survey/session-v2/historical-v1-session.json"
    );
    const sessionPath = path.join(historicalRun, "session.json");
    await copyFile(historicalFixture, sessionPath);
    const session = JSON.parse(await readFile(sessionPath, "utf8"));
    const sessionBytesBefore = await readFile(sessionPath);
    const directoryBefore = await stat(historicalRun, { bigint: true });
    const sessionBefore = await stat(sessionPath, { bigint: true });
    const membersBefore = await readdir(historicalRun);

    await assert.rejects(
      applySurveyCommand(
        surveyRoot,
        historicalRun,
        {
          event: "BEGIN_R1_DESIGN",
          eventId: "historical-boundary:begin-r1",
          expectedRevision: session.revision,
          payload: {}
        },
        proposer()
      ),
      (error) =>
        error instanceof MatchingFrozenPackageRequiredError &&
        error.name === "MatchingFrozenPackageRequiredError" &&
        error.code === "MATCHING_FROZEN_PACKAGE_REQUIRED"
    );
    await assert.rejects(
      readVerifiedSession(historicalRun),
      (error) =>
        error instanceof MatchingFrozenPackageRequiredError &&
        error.code === "MATCHING_FROZEN_PACKAGE_REQUIRED"
    );

    const directoryAfter = await stat(historicalRun, { bigint: true });
    const sessionAfter = await stat(sessionPath, { bigint: true });
    assert.deepEqual(await readdir(historicalRun), membersBefore);
    assert.deepEqual(await readFile(sessionPath), sessionBytesBefore);
    assert.equal(directoryAfter.mtimeNs, directoryBefore.mtimeNs);
    assert.equal(directoryAfter.ctimeNs, directoryBefore.ctimeNs);
    assert.equal(sessionAfter.mtimeNs, sessionBefore.mtimeNs);
    assert.equal(sessionAfter.ctimeNs, sessionBefore.ctimeNs);

    activeRun = await newRun();
    assert.equal(
      activeRun.session.$schema,
      CURRENT_EXECUTOR_SESSION_SCHEMA_ID
    );
    assert.equal(activeRun.session.package.version, "2.0.0");
    const activeRevision = activeRun.session.revision;
    const result = await applySurveyCommand(
      surveyRoot,
      activeRun.runDirectory,
      {
        event: "BEGIN_R1_DESIGN",
        eventId: "active-package-v1:begin-r1",
        expectedRevision: activeRevision,
        payload: {}
      },
      proposer()
    );
    assert.equal(result.rejected, false);
    assert.equal(result.replayed, false);
    assert.equal(result.session.revision, activeRevision + 1);
    assert.equal(result.session.$schema, CURRENT_EXECUTOR_SESSION_SCHEMA_ID);
    assert.equal(result.session.package.version, "2.0.0");
  } finally {
    await Promise.all([
      rm(temporary, { recursive: true, force: true }),
      activeRun?.cleanup()
    ]);
  }
});
