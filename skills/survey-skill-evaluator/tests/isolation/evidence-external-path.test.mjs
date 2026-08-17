import test from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { EvidenceFreezer } from "../../source/executables/evidence/index.mjs";
import { ValidationError, rawSha256 } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("evidence verification rejects an absolute path outside its authority root", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const outside = join(fixture.rootPath, "..", "external-evidence-fixture");
  const bytes = Buffer.from("external");
  await writeFile(outside, bytes);
  t.after(() => import("node:fs/promises").then(({ rm }) => rm(outside, { force: true })));
  const freezer = new EvidenceFreezer({ rootPath: fixture.rootPath });
  await assert.rejects(
    freezer.verifyBlob({
      path: outside,
      rawDigest: rawSha256(bytes),
      byteLength: bytes.length,
    }),
    (error) => error instanceof ValidationError,
  );
});
