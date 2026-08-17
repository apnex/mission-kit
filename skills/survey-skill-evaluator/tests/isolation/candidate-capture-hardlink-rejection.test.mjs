import assert from "node:assert/strict";
import test from "node:test";
import { link, mkdtemp } from "node:fs/promises";
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

test("candidate capture rejects hard-link aliases inside the supplied root", async () => {
  const authorityRoot = await mkdtemp(join(tmpdir(), "candidate-authority-"));
  const sourceParent = await mkdtemp(join(tmpdir(), "candidate-source-"));
  const sourceRoot = join(sourceParent, "survey");
  await makeCandidateSource(sourceRoot);
  await link(join(sourceRoot, "SKILL.md"), join(sourceRoot, "alias.md"));
  try {
    await assert.rejects(
      captureCandidatePackage({
        authorityRoot,
        sourceRoot,
        destinationRoot: join(authorityRoot, "captures", "candidate"),
        adapter: descriptorOnlyAdapter(),
      }),
      /hard-link aliases are forbidden/u,
    );
  } finally {
    await forceRemoveFixtureTree(authorityRoot);
    await forceRemoveFixtureTree(sourceParent);
  }
});
