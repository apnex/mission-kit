import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import os from "node:os";
import test from "node:test";
import { goldenDigestFixture as fixture } from "./golden-fixture.mjs";

test("exact-byte digest results are independent of process working directory", () => {
  const moduleUrl = new URL(
    "../../../source/authoring/kernel/digests.mjs",
    import.meta.url
  ).href;
  const script = [
    `const { blankViewDigest } = await import(${JSON.stringify(moduleUrl)});`,
    "process.stdout.write(blankViewDigest(Buffer.from([0,10,13,127,128,255,65])));"
  ].join("\n");
  const observed = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    {
      cwd: os.tmpdir(),
      encoding: "utf8"
    }
  );
  assert.equal(observed, fixture.exactBytes.blankViewDigest);
});
