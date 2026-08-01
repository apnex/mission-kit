import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  access,
  cp,
  mkdtemp,
  readFile,
  rm
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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

test("a sovereign package copy initializes a survey without installed compiler dependencies", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "survey-v2-runtime-no-install-"));
  const copy = path.join(temporary, "survey");
  const sessionsRoot = path.join(temporary, "sessions");
  try {
    await cp(surveyRoot, copy, {
      recursive: true,
      filter: (source) => {
        const relative = path.relative(surveyRoot, source);
        return !relative.split(path.sep).some((segment) => (
          segment === "node_modules" ||
          segment === "surveys" ||
          segment === ".git"
        ));
      }
    });
    await assert.rejects(access(path.join(copy, "node_modules")));
    const result = await run(process.execPath, [
      "scripts/survey-init.mjs",
      "--slug=runtime-no-install",
      "--session-id=session-1",
      "--work-item=Verify dependency-free runtime execution",
      "--outcome-axes=portability,correctness",
      "--director-ref=test-director",
      "--proposer-ref=test-proposer",
      `--sessions-root=${sessionsRoot}`
    ], copy);
    assert.equal(
      result.code,
      0,
      `survey-init failed without node_modules\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
    assert.equal(result.signal, null);
    const output = JSON.parse(result.stdout);
    assert.equal(output.phase, "initialized");
    assert.equal(output.runtimeStatus, "active");
    const state = JSON.parse(
      await readFile(path.join(sessionsRoot, "runtime-no-install", "session-1", "session.json"), "utf8")
    );
    assert.equal(state.sessionId, "session-1");
    assert.equal(state.phase, "initialized");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
