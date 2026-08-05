import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  openSurveyctlRun,
} from "../../../source/executables/runtime/lib/surveyctl-engine.mjs";
import {
  journalKeyFileName,
} from "../../../source/executables/runtime/lib/surveyctl-io.mjs";
import {
  authenticationKey,
  createCandidate,
  sessionBytes,
} from "../session-v2/support.mjs";
import {
  createSurveyctlHarness,
  readSession,
  secureKeyFile,
} from "./support.mjs";

test(
  "opening a published zero-journal run completes initialization exactly once after an init crash",
  async (testContext) => {
    const harness = await createSurveyctlHarness(testContext);
    const candidate = await createCandidate({
      slug: "zero-journal-recovery",
      sessionId: "zero-journal-recovery-001",
    });
    harness.runDirectory = path.join(
      harness.sessionsRoot,
      "zero-journal-recovery",
      candidate.session.sessionId,
    );
    harness.sessionFile = path.join(
      harness.runDirectory,
      "session.json",
    );
    await mkdir(harness.runDirectory, { recursive: true });
    await writeFile(
      harness.sessionFile,
      sessionBytes(candidate.session),
      { flag: "wx" },
    );
    const bindingDigest =
      candidate.session.authoring.persistence
        .identityBinding.digest;
    await secureKeyFile(
      harness.keyRoot,
      journalKeyFileName(bindingDigest),
      authenticationKey,
    );

    const first = await openSurveyctlRun({
      command: "status",
      runDirectory: harness.runDirectory,
      keyRoot: harness.keyRoot,
    });
    assert.equal(first.session.commitRevision, 1);
    assert.equal(
      first.state.snapshot.workspace.spec.authoringState,
      "survey_frame_required",
    );
    const second = await openSurveyctlRun({
      command: "status",
      runDirectory: harness.runDirectory,
      keyRoot: harness.keyRoot,
    });
    const persisted = await readSession(harness);

    assert.equal(second.session.commitRevision, 1);
    assert.equal(persisted.journal.length, 1);
    assert.equal(persisted.commitRevision, 1);
  },
);
