import assert from "node:assert/strict";
import {
  readFile,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { prettyJson } from "../../source/executables/runtime/lib/canonical.mjs";
import {
  readVerifiedSession,
  sealSession
} from "../../source/executables/runtime/lib/storage.mjs";
import { newRun } from "../fixtures/runtime-fixture.mjs";

test("the read boundary quarantines a schema-invalid but top-level-resealed session", async () => {
  const run = await newRun();
  try {
    const mutant = structuredClone(run.session);
    mutant.auditBypass = true;
    sealSession(mutant);
    await writeFile(
      path.join(run.runDirectory, "session.json"),
      prettyJson(mutant)
    );
    await assert.rejects(
      readVerifiedSession(run.runDirectory),
      (error) => error.failureClass === "schema-invalid-session"
    );
    const quarantine = JSON.parse(
      await readFile(path.join(run.runDirectory, "quarantine.json"), "utf8")
    );
    assert.equal(quarantine.failureClass, "schema-invalid-session");
    assert.equal(quarantine.operation, "OQ01");
  } finally {
    await run.cleanup();
  }
});
