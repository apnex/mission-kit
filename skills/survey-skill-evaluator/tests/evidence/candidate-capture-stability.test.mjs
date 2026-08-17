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

test("candidate capture rejects package mutation between independent passes", async () => {
  const authorityRoot = await mkdtemp(join(tmpdir(), "candidate-authority-"));
  const sourceParent = await mkdtemp(join(tmpdir(), "candidate-source-"));
  const sourceRoot = join(sourceParent, "survey");
  await makeCandidateSource(sourceRoot);
  try {
    await assert.rejects(
      captureCandidatePackage({
        authorityRoot,
        sourceRoot,
        destinationRoot: join(authorityRoot, "captures", "candidate"),
        adapter: descriptorOnlyAdapter(),
        onCapturePass: async ({ pass }) => {
          if (pass === 1) {
            await writeFile(
              join(sourceRoot, "SKILL.md"),
              "---\nname: survey\ndescription: Changed.\n---\n",
              "utf8",
            );
          }
        },
      }),
      /changed between independent capture passes/u,
    );
  } finally {
    await forceRemoveFixtureTree(authorityRoot);
    await forceRemoveFixtureTree(sourceParent);
  }
});
