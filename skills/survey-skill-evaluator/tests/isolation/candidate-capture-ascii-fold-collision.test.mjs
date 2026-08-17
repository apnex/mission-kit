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

test("candidate capture rejects paths that collide under ASCII case folding", async () => {
  const authorityRoot = await mkdtemp(join(tmpdir(), "candidate-authority-"));
  const sourceParent = await mkdtemp(join(tmpdir(), "candidate-source-"));
  const sourceRoot = join(sourceParent, "survey");
  await makeCandidateSource(sourceRoot);
  await writeFile(join(sourceRoot, "A.txt"), "upper", "utf8");
  await writeFile(join(sourceRoot, "a.txt"), "lower", "utf8");
  try {
    await assert.rejects(
      captureCandidatePackage({
        authorityRoot,
        sourceRoot,
        destinationRoot: join(authorityRoot, "captures", "candidate"),
        adapter: descriptorOnlyAdapter(),
      }),
      /collide under ASCII case folding/u,
    );
  } finally {
    await forceRemoveFixtureTree(authorityRoot);
    await forceRemoveFixtureTree(sourceParent);
  }
});
