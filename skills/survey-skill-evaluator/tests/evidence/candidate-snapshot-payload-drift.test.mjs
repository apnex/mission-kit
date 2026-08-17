import assert from "node:assert/strict";
import test from "node:test";
import { chmod, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  validateCandidateSnapshot,
} from "../../source/executables/orchestrator/index.mjs";
import {
  makeCandidateCapture,
} from "../helpers/candidate-capture-fixture.mjs";

test("candidate snapshot validation rejects payload drift after capture", async () => {
  const fixture = await makeCandidateCapture();
  try {
    const skillPath = join(fixture.captured.payloadRoot, "SKILL.md");
    await chmod(skillPath, 0o644);
    await writeFile(
      skillPath,
      "---\nname: survey\ndescription: Drifted payload.\n---\n",
      "utf8",
    );
    await assert.rejects(
      validateCandidateSnapshot({
        snapshot: fixture.captured.snapshot,
        payloadRoot: fixture.captured.payloadRoot,
      }),
      /inventory does not match its exact payload/u,
    );
  } finally {
    await fixture.cleanup();
  }
});
