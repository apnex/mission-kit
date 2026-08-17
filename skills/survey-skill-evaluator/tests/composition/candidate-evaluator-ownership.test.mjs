import assert from "node:assert/strict";
import test from "node:test";
import { readFile, realpath } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import {
  captureCandidatePackage,
} from "../../source/executables/orchestrator/index.mjs";
import {
  descriptorOnlyAdapter,
  makeCandidateCapture,
} from "../helpers/candidate-capture-fixture.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

function outside(root, target) {
  const value = relative(root, target);
  return value === ".." || value.startsWith(`..${sep}`);
}

test("candidate capture and evaluator identity remain under distinct authority roots and sealed digests", async (t) => {
  const fixture = await makeCandidateCapture();
  t.after(fixture.cleanup);
  const evaluatorRoot = await realpath(packageRoot);
  const candidateAuthority = await realpath(fixture.authorityRoot);
  const snapshotRoot = await realpath(fixture.destinationRoot);
  const manifest = JSON.parse(
    await readFile(join(packageRoot, "package.manifest.json"), "utf8"),
  );

  assert.equal(outside(evaluatorRoot, candidateAuthority), true);
  assert.equal(outside(evaluatorRoot, snapshotRoot), true);
  assert.equal(outside(candidateAuthority, evaluatorRoot), true);
  assert.match(fixture.captured.snapshot.candidatePackageRoot, /^[a-f0-9]{64}$/u);
  assert.match(manifest.payloadRoot, /^[a-f0-9]{64}$/u);
  assert.notEqual(
    fixture.captured.snapshot.candidatePackageRoot,
    manifest.payloadRoot,
  );

  await assert.rejects(
    captureCandidatePackage({
      authorityRoot: fixture.sourceParent,
      sourceRoot: fixture.sourceRoot,
      destinationRoot: join(fixture.sourceRoot, "owned-by-source"),
      adapter: descriptorOnlyAdapter(),
    }),
    /must not overlap/u,
  );
});
