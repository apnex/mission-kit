import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  captureCandidatePackage,
  surveySubjectAdapterDescriptor,
} from "../../source/executables/orchestrator/index.mjs";

export function descriptorOnlyAdapter(profileId = "survey-v1") {
  const descriptor = surveySubjectAdapterDescriptor(profileId);
  return Object.freeze({ describe: () => descriptor });
}

export async function makeCandidateSource(
  root,
  {
    body = "Fixture candidate.",
    hiddenText = null,
    executable = false,
    capabilities = null,
  } = {},
) {
  await mkdir(root, { recursive: true, mode: 0o750 });
  await writeFile(
    join(root, "SKILL.md"),
    `---\nname: survey\ndescription: Candidate fixture.\n---\n\n# Survey\n\n${body}\n`,
    "utf8",
  );
  if (hiddenText !== null) {
    await writeFile(join(root, ".hidden"), hiddenText, "utf8");
  }
  if (executable) {
    const scriptPath = join(root, "run.sh");
    await writeFile(scriptPath, "#!/bin/sh\nexit 0\n", "utf8");
    await chmod(scriptPath, 0o755);
  }
  if (capabilities !== null) {
    await writeFile(
      join(root, "fixture-capabilities.json"),
      `${JSON.stringify({
        capabilities,
        packageId: "fixture-subject",
        sealed: true,
      })}\n`,
      "utf8",
    );
  }
}

export async function makeCandidateCapture({
  sourceOptions = {},
  onCapturePass = null,
} = {}) {
  const authorityRoot = await mkdtemp(join(tmpdir(), "candidate-authority-"));
  const sourceParent = await mkdtemp(join(tmpdir(), "candidate-source-"));
  const sourceRoot = join(sourceParent, "survey");
  await makeCandidateSource(sourceRoot, sourceOptions);
  const destinationRoot = join(authorityRoot, "captures", "candidate");
  const captured = await captureCandidatePackage({
    authorityRoot,
    sourceRoot,
    destinationRoot,
    adapter: descriptorOnlyAdapter(),
    onCapturePass,
  });
  return {
    authorityRoot,
    sourceParent,
    sourceRoot,
    destinationRoot,
    captured,
    cleanup: async () => {
      await forceRemoveFixtureTree(authorityRoot);
      await forceRemoveFixtureTree(sourceParent);
    },
  };
}

async function makeWritable(path) {
  let metadata;
  try {
    metadata = await lstat(path);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
    await chmod(path, 0o600).catch(() => {});
    return;
  }
  await chmod(path, 0o700).catch(() => {});
  for (const entry of await readdir(path)) {
    await makeWritable(join(path, entry));
  }
}

export async function forceRemoveFixtureTree(path) {
  await makeWritable(path);
  await rm(path, { recursive: true, force: true });
}
