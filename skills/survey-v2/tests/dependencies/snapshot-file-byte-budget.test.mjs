import assert from "node:assert/strict";
import {
  readFile,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { captureReferenceSnapshot } from "../../source/executables/runtime/lib/dependency-snapshot.mjs";
import { dependencyRepository } from "../fixtures/dependency-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("T41 rejects a selected regular file whose opened size exceeds maxFileBytes", async () => {
  const repository = await dependencyRepository();
  try {
    const descriptor = JSON.parse(await readFile(
      `${surveyRoot}/source/dependencies/references/mission-kit-axioms.reference.json`,
      "utf8"
    ));
    descriptor.snapshotPolicy.maxFileBytes = 32;
    await writeFile(
      path.join(repository.root, "axioms", "A1-example.md"),
      Buffer.alloc(descriptor.snapshotPolicy.maxFileBytes + 1, 0x61)
    );

    await assert.rejects(
      captureReferenceSnapshot(descriptor, repository.registry),
      (error) => {
        assert.equal(error.code, "SOURCE_BUDGET");
        assert.equal(error.terminal, false);
        assert.equal(error.message, "A1-example.md exceeds 32 bytes");
        return true;
      }
    );
  } finally {
    await repository.cleanup();
  }
});
