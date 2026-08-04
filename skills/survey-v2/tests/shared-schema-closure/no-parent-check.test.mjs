import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  cp,
  mkdtemp,
  rm
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { surveyRoot } from "./support/fixture.mjs";

function runCheck(cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["shared-schemas.sh", "check"], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({
      code,
      signal,
      stdout: Buffer.concat(stdout).toString("utf8"),
      stderr: Buffer.concat(stderr).toString("utf8")
    }));
  });
}

test("shared-schema check succeeds from a clean package copy with no Mission Kit parent", async () => {
  if (process.env.SURVEY_V2_RELOCATED === "1") {
    const result = await runCheck(surveyRoot);
    assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(result.signal, null);
    return;
  }
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-shared-schema-relocation-")
  );
  const copy = path.join(temporaryRoot, "survey");
  try {
    await cp(surveyRoot, copy, {
      recursive: true,
      filter(source) {
        const relative = path.relative(surveyRoot, source);
        return !relative.split(path.sep).some((segment) => (
          segment === ".git" ||
          segment === "surveys"
        ));
      }
    });
    const result = await runCheck(copy);
    assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(result.signal, null);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
