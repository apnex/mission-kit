import assert from "node:assert/strict";
import test from "node:test";
import {
  appendFile,
  mkdir,
  mkdtemp,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  captureCandidatePackage,
} from "../../source/executables/orchestrator/index.mjs";
import {
  descriptorOnlyAdapter,
  forceRemoveFixtureTree,
} from "../helpers/candidate-capture-fixture.mjs";

async function makeVersionNeutralSurvey(root) {
  const files = new Map([
    [
      "SKILL.md",
      "---\nname: survey\ndescription: Version-neutral fixture.\n---\n\n# Survey\n",
    ],
    ["agents/openai.yaml", "interface: fixture\n"],
    ["assets/template.json", "{}\n"],
    ["generated/validators.mjs", "export const valid = true;\n"],
    ["references/runtime.md", "# Runtime\n"],
    ["schemas/envelope.schema.json", "{\"type\":\"object\"}\n"],
    ["scripts/survey-init.mjs", "export const init = true;\n"],
    ["survey-v2.package.json", "{\"schemaVersion\":\"1.0.0\"}\n"],
  ]);
  for (const [relativePath, bytes] of files) {
    const path = join(root, relativePath);
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, bytes, "utf8");
  }
}

test("experimental condition seals change when candidate bytes or adapter environment identity changes", async (t) => {
  const sourceParent = await mkdtemp(join(tmpdir(), "condition-source-"));
  const authorityRoot = await mkdtemp(join(tmpdir(), "condition-captures-"));
  t.after(async () => {
    await forceRemoveFixtureTree(authorityRoot);
    await forceRemoveFixtureTree(sourceParent);
  });
  const sourceRoot = join(sourceParent, "survey");
  await makeVersionNeutralSurvey(sourceRoot);

  const v1 = await captureCandidatePackage({
    authorityRoot,
    sourceRoot,
    destinationRoot: join(authorityRoot, "captures", "v1"),
    adapter: descriptorOnlyAdapter("survey-v1"),
  });
  const v2 = await captureCandidatePackage({
    authorityRoot,
    sourceRoot,
    destinationRoot: join(authorityRoot, "captures", "v2"),
    adapter: descriptorOnlyAdapter("survey-v2"),
  });
  assert.equal(
    v1.snapshot.candidatePackageRoot,
    v2.snapshot.candidatePackageRoot,
  );
  assert.notEqual(
    v1.snapshot.adapter.adapterDescriptorDigest,
    v2.snapshot.adapter.adapterDescriptorDigest,
  );
  assert.notEqual(v1.snapshot.candidateSnapshotId, v2.snapshot.candidateSnapshotId);

  await appendFile(join(sourceRoot, "SKILL.md"), "\nChanged candidate bytes.\n");
  const changed = await captureCandidatePackage({
    authorityRoot,
    sourceRoot,
    destinationRoot: join(authorityRoot, "captures", "changed"),
    adapter: descriptorOnlyAdapter("survey-v1"),
  });
  assert.notEqual(
    changed.snapshot.candidatePackageRoot,
    v1.snapshot.candidatePackageRoot,
  );
  assert.notEqual(changed.snapshot.candidateSnapshotId, v1.snapshot.candidateSnapshotId);
});
