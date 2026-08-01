import {
  mkdir,
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function dependencyRepository() {
  const root = await mkdtemp(path.join(os.tmpdir(), "survey-v2-dependency-repository-"));
  await mkdir(path.join(root, ".git"));
  await mkdir(path.join(root, "axioms"));
  await writeFile(path.join(root, "axioms", "README.md"), "# Axiom index\n");
  await writeFile(path.join(root, "axioms", "A1-example.md"), "# A1\n\nExample axiom.\n");
  return {
    root,
    registry: {
      registryId: "test-host-registry",
      bindings: {
        "mission-kit.axioms": {
          kind: "host-registry",
          repository: "apnex/mission-kit",
          root
        }
      }
    },
    cleanup: () => rm(root, { recursive: true, force: true })
  };
}
