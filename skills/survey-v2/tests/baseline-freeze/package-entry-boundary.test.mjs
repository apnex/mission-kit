import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  newRun,
  reachAwaitingQ1
} from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({
        code,
        stderr: Buffer.concat(stderr).toString("utf8"),
        stdout: Buffer.concat(stdout).toString("utf8")
      })
    );
  });
}

test("verified package bytes enter real rehydration while stale-lock mutation is refused before runtime", async () => {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-baseline-entry-")
  );
  const exactRun = await newRun();
  const mismatchRun = await newRun();
  try {
    await reachAwaitingQ1(exactRun);
    await reachAwaitingQ1(mismatchRun);
    const manifest = JSON.parse(
      await readFile(path.join(surveyRoot, "survey-v2.package.json"), "utf8")
    );
    const projectionLock = JSON.parse(
      await readFile(
        path.join(surveyRoot, "generated", "projection-lock.json"),
        "utf8"
      )
    );
    const requiredPackage = {
      id: manifest.id,
      version: manifest.version,
      projectionDigest: projectionLock.aggregateDigest,
      protocolDigest: exactRun.session.protocol.digest
    };
    const requiredPath = path.join(temporary, "required-package.json");
    await writeFile(requiredPath, `${JSON.stringify(requiredPackage)}\n`);
    const preflight = new URL("./resume-preflight.mjs", import.meta.url).pathname;

    const exactBefore = {
      phase: exactRun.session.phase,
      revision: exactRun.session.revision,
      viewDigest: exactRun.session.outbox.digest
    };
    let result = await run([
      preflight,
      `--subject-root=${surveyRoot}`,
      `--run-directory=${exactRun.runDirectory}`,
      `--required-package=${requiredPath}`
    ]);
    assert.equal(result.code, 0, result.stderr);
    const exactResult = JSON.parse(result.stdout);
    assert.equal(exactResult.ok, true);
    assert.equal(exactResult.verifiedMemberCount, manifest.members.length);
    assert.equal(exactResult.resumed.phase, exactBefore.phase);
    assert.equal(exactResult.resumed.viewDigest, exactBefore.viewDigest);
    assert.ok(exactResult.resumed.revision > exactBefore.revision);

    const changedRoot = path.join(temporary, "changed-package");
    await cp(surveyRoot, changedRoot, {
      recursive: true,
      dereference: false,
      filter(source) {
        const relative = path.relative(surveyRoot, source);
        if (relative === "") return true;
        const first = relative.split(path.sep)[0];
        return ![".git", "node_modules", "surveys"].includes(first);
      }
    });
    const sentinel = path.join(temporary, "runtime-entered.txt");
    const changedEngine = path.join(
      changedRoot,
      "source",
      "executables",
      "runtime",
      "lib",
      "engine.mjs"
    );
    const engineBytes = await readFile(changedEngine, "utf8");
    await writeFile(
      changedEngine,
      "import { writeFileSync as baselineWriteFileSync } from \"node:fs\";\n" +
        `baselineWriteFileSync(${JSON.stringify(sentinel)}, "entered\\n");\n` +
        engineBytes
    );
    const sessionPath = path.join(mismatchRun.runDirectory, "session.json");
    const beforeSession = await readFile(sessionPath);
    result = await run([
      preflight,
      `--subject-root=${changedRoot}`,
      `--run-directory=${mismatchRun.runDirectory}`,
      `--required-package=${requiredPath}`
    ]);
    assert.equal(result.code, 65, result.stderr);
    assert.equal(JSON.parse(result.stderr).code, "FROZEN_PACKAGE_REQUIRED");
    await assert.rejects(
      readFile(sentinel),
      (error) => error.code === "ENOENT"
    );
    assert.deepEqual(await readFile(sessionPath), beforeSession);
  } finally {
    await Promise.all([
      exactRun.cleanup(),
      mismatchRun.cleanup(),
      rm(temporary, { recursive: true, force: true })
    ]);
  }
});
