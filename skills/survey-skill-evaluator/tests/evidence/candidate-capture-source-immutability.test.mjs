import assert from "node:assert/strict";
import test from "node:test";
import { lstat, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  captureCandidatePackage,
} from "../../source/executables/orchestrator/index.mjs";
import {
  descriptorOnlyAdapter,
  forceRemoveFixtureTree,
  makeCandidateSource,
} from "../helpers/candidate-capture-fixture.mjs";

test("candidate capture leaves source bytes and metadata unchanged", async () => {
  const authorityRoot = await mkdtemp(join(tmpdir(), "candidate-authority-"));
  const sourceParent = await mkdtemp(join(tmpdir(), "candidate-source-"));
  const sourceRoot = join(sourceParent, "survey");
  await makeCandidateSource(sourceRoot, { executable: true });
  const path = join(sourceRoot, "SKILL.md");
  const before = {
    bytes: await readFile(path),
    metadata: await lstat(path),
  };
  try {
    await captureCandidatePackage({
      authorityRoot,
      sourceRoot,
      destinationRoot: join(authorityRoot, "captures", "candidate"),
      adapter: descriptorOnlyAdapter(),
    });
    const after = {
      bytes: await readFile(path),
      metadata: await lstat(path),
    };
    assert.equal(Buffer.compare(before.bytes, after.bytes), 0);
    assert.equal(before.metadata.mode, after.metadata.mode);
    assert.equal(before.metadata.mtimeMs, after.metadata.mtimeMs);
  } finally {
    await forceRemoveFixtureTree(authorityRoot);
    await forceRemoveFixtureTree(sourceParent);
  }
});
