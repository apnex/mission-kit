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

test("T41 snapshot capture rejects a same-size mutation between full byte passes", async () => {
  const repository = await dependencyRepository();
  try {
    const descriptor = JSON.parse(await readFile(
      `${surveyRoot}/source/dependencies/references/mission-kit-axioms.reference.json`,
      "utf8"
    ));
    const selected = path.join(repository.root, "axioms", "A1-example.md");
    await assert.rejects(
      captureReferenceSnapshot(descriptor, repository.registry, {
        afterSecondEnumeration: async () => {
          const bytes = await readFile(selected);
          bytes[bytes.length - 2] ^= 1;
          await writeFile(selected, bytes);
        }
      }),
      (error) => error.code === "SOURCE_UNSTABLE"
    );
  } finally {
    await repository.cleanup();
  }
});
