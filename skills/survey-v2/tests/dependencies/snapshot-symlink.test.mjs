import assert from "node:assert/strict";
import {
  readFile,
  symlink,
  unlink
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { captureReferenceSnapshot } from "../../source/executables/runtime/lib/dependency-snapshot.mjs";
import { dependencyRepository } from "../fixtures/dependency-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("T41 snapshot capture rejects a symlink inside the selected repository tree", async () => {
  const repository = await dependencyRepository();
  try {
    const descriptor = JSON.parse(await readFile(
      `${surveyRoot}/source/dependencies/references/mission-kit-axioms.reference.json`,
      "utf8"
    ));
    const selected = path.join(repository.root, "axioms", "A1-example.md");
    await unlink(selected);
    await symlink("/etc/hosts", selected);
    await assert.rejects(
      captureReferenceSnapshot(descriptor, repository.registry),
      (error) => error.code === "TRUST_BOUNDARY_VIOLATION" && error.terminal === true
    );
  } finally {
    await repository.cleanup();
  }
});
