import assert from "node:assert/strict";
import test from "node:test";
import { lstat, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  makeCandidateCapture,
} from "../helpers/candidate-capture-fixture.mjs";
import { forceRemoveFixtureTree } from "../helpers/candidate-capture-fixture.mjs";
import { makeV1Adapter } from "../helpers/subject-adapter-fixture.mjs";

test("Survey adapter stages an exact read-only package under its normal skill identity", async () => {
  const fixture = await makeCandidateCapture();
  const attemptRoot = await mkdtemp(join(tmpdir(), "candidate-attempt-"));
  try {
    const { adapter } = makeV1Adapter();
    const staged = await adapter.stage({
      candidateBundle: {
        snapshot: fixture.captured.snapshot,
        payloadRoot: fixture.captured.payloadRoot,
        schemaValidator: null,
      },
      attemptRoot,
    });
    assert.equal(staged.stagedSkillRoot, join(attemptRoot, "skills", "survey"));
    const metadata = await lstat(join(staged.stagedSkillRoot, "SKILL.md"));
    assert.equal(metadata.mode & 0o222, 0);
    assert.equal(staged.candidatePackageRoot,
      fixture.captured.snapshot.candidatePackageRoot);
  } finally {
    await fixture.cleanup();
    await forceRemoveFixtureTree(attemptRoot);
  }
});
