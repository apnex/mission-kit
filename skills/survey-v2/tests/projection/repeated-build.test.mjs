import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("./compile.sh", args, {
      cwd: surveyRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const output = [];
    child.stdout.on("data", (chunk) => output.push(chunk));
    child.stderr.on("data", (chunk) => output.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output: Buffer.concat(output).toString("utf8") }));
  });
}

test("repeated build and check produce byte-identical registered targets", async () => {
  const before = await readFile(`${surveyRoot}/generated/projection-lock.json`);
  for (const args of [[], ["--check"]]) {
    const result = await run(args);
    assert.equal(result.code, 0, result.output);
  }
  const after = await readFile(`${surveyRoot}/generated/projection-lock.json`);
  assert.deepEqual(after, before);
});
