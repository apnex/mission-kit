import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  cp,
  mkdtemp,
  readFile,
  rm
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

function run(command, args, cwd, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => resolve({
      code,
      stdout: Buffer.concat(stdout).toString("utf8"),
      stderr: Buffer.concat(stderr).toString("utf8")
    }));
  });
}

test("a clean non-Git sovereign-root copy installs, checks, and runs its registered suite", async () => {
  if (process.env.SURVEY_V2_RELOCATED === "1") {
    const lock = JSON.parse(await readFile(`${surveyRoot}/generated/projection-lock.json`, "utf8"));
    assert.match(lock.aggregateDigest, /^sha256:[0-9a-f]{64}$/);
    return;
  }
  const temporary = await mkdtemp(path.join(os.tmpdir(), "survey-v2-relocation-"));
  const copy = path.join(temporary, "survey");
  try {
    await cp(surveyRoot, copy, {
      recursive: true,
      filter: (source) => !source.includes(`${path.sep}node_modules`) && !source.includes(`${path.sep}surveys`)
    });
    const original = JSON.parse(await readFile(`${surveyRoot}/generated/projection-lock.json`, "utf8"));
    for (const [command, args, environment] of [
      [process.platform === "win32" ? "npm.cmd" : "npm", ["ci", "--ignore-scripts"], process.env],
      ["./compile.sh", ["--check"], process.env],
      [process.platform === "win32" ? "npm.cmd" : "npm", ["test"], { ...process.env, SURVEY_V2_RELOCATED: "1" }]
    ]) {
      const result = await run(command, args, copy, environment);
      assert.equal(result.code, 0, `${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
    }
    const relocated = JSON.parse(await readFile(`${copy}/generated/projection-lock.json`, "utf8"));
    assert.equal(relocated.aggregateDigest, original.aggregateDigest);
    assert.equal(relocated.packageDigest, original.packageDigest);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
