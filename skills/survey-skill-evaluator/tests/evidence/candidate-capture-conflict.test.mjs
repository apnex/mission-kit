import assert from "node:assert/strict";
import test from "node:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  captureCandidatePackage,
} from "../../source/executables/orchestrator/index.mjs";
import {
  descriptorOnlyAdapter,
  makeCandidateCapture,
} from "../helpers/candidate-capture-fixture.mjs";

test("candidate capture conflicts when a destination is replayed with changed source bytes", async () => {
  const fixture = await makeCandidateCapture();
  try {
    await writeFile(
      join(fixture.sourceRoot, "SKILL.md"),
      "---\nname: survey\ndescription: Changed source.\n---\n",
      "utf8",
    );
    await assert.rejects(
      captureCandidatePackage({
        authorityRoot: fixture.authorityRoot,
        sourceRoot: fixture.sourceRoot,
        destinationRoot: fixture.destinationRoot,
        adapter: descriptorOnlyAdapter(),
      }),
      /bound to different source bytes/u,
    );
  } finally {
    await fixture.cleanup();
  }
});
