import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile } from "node:fs/promises";
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

test("candidate capture rejects a filename that is not valid UTF-8", async () => {
  const authorityRoot = await mkdtemp(join(tmpdir(), "candidate-authority-"));
  const sourceParent = await mkdtemp(join(tmpdir(), "candidate-source-"));
  const sourceRoot = join(sourceParent, "survey");
  await makeCandidateSource(sourceRoot);
  const invalidPath = Buffer.concat([
    Buffer.from(`${sourceRoot}/`, "utf8"),
    Buffer.from([0xff]),
  ]);
  await writeFile(invalidPath, "invalid-name", "utf8");
  try {
    await assert.rejects(
      captureCandidatePackage({
        authorityRoot,
        sourceRoot,
        destinationRoot: join(authorityRoot, "captures", "candidate"),
        adapter: descriptorOnlyAdapter(),
      }),
      /non-UTF-8 path segment/u,
    );
  } finally {
    await forceRemoveFixtureTree(authorityRoot);
    await forceRemoveFixtureTree(sourceParent);
  }
});
