import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  run,
  runCompiler,
  withPackageCopy,
} from "../composition/package-fixture.mjs";

function compilerResult(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const lines = result.stdout.trim().split("\n");
  return JSON.parse(lines.at(-1));
}

async function exerciseRelocation({ runTests }) {
  return withPackageCopy(async (root) => {
    await assert.rejects(access(join(root, ".git")));
    const install = run(root, "npm", ["ci", "--ignore-scripts"]);
    assert.equal(install.status, 0, `${install.stdout}\n${install.stderr}`);
    const build = compilerResult(runCompiler(root));
    const check = compilerResult(
      runCompiler(root, ["--check", "--verify-package"]),
    );
    assert.equal(check.evaluatorPackageDigest, build.evaluatorPackageDigest);
    if (runTests) {
      const suite = run(root, "npm", ["test"], {
        env: {
          ...process.env,
          SURVEY_EVALUATOR_RELOCATION_CHILD: "1",
        },
      });
      assert.equal(suite.status, 0, `${suite.stdout}\n${suite.stderr}`);
    }
    return {
      manifest: await readFile(join(root, "package.manifest.json")),
      lock: await readFile(join(root, "generated.lock.json")),
      evaluatorPackageDigest: build.evaluatorPackageDigest,
      payloadRoot: build.payloadRoot,
      generatedTargetRoot: build.generatedTargetRoot,
    };
  });
}

test("clean non-Git relocation installs, builds, checks, tests, and reproduces package identities", async () => {
  if (process.env.SURVEY_EVALUATOR_RELOCATION_CHILD === "1") {
    assert.ok(true);
    return;
  }
  const first = await exerciseRelocation({ runTests: true });
  const second = await exerciseRelocation({ runTests: false });
  assert.deepEqual(second.manifest, first.manifest);
  assert.deepEqual(second.lock, first.lock);
  assert.equal(second.evaluatorPackageDigest, first.evaluatorPackageDigest);
  assert.equal(second.payloadRoot, first.payloadRoot);
  assert.equal(second.generatedTargetRoot, first.generatedTargetRoot);
});
