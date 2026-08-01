import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp } from "node:fs/promises";
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

test("candidate capture rejects a destination overlapping the source tree", async () => {
  const authorityRoot = await mkdtemp(join(tmpdir(), "candidate-authority-"));
  const sourceRoot = join(authorityRoot, "survey");
  await makeCandidateSource(sourceRoot);
  try {
    await assert.rejects(
      captureCandidatePackage({
        authorityRoot,
        sourceRoot,
        destinationRoot: join(sourceRoot, "captured"),
        adapter: descriptorOnlyAdapter(),
      }),
      /must not overlap/u,
    );
  } finally {
    await forceRemoveFixtureTree(authorityRoot);
  }
});
