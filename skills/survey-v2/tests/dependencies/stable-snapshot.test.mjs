import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { captureReferenceSnapshot } from "../../source/executables/runtime/lib/dependency-snapshot.mjs";

test("dependency capture freezes stable bounded bytes without persisting a host locator", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "survey-v2-snapshot-"));
  try {
    await mkdir(path.join(root, ".git"));
    await mkdir(path.join(root, "axioms"));
    await writeFile(path.join(root, "axioms", "README.md"), "# Index\n");
    await writeFile(path.join(root, "axioms", "A1-example.md"), "# Axiom\n");
    const descriptor = {
      id: "urn:mission-kit:survey-v2:reference:mission-kit-axioms",
      source: { kind: "git-repository", repository: "apnex/mission-kit" },
      selector: { kind: "subdirectory", path: "axioms" },
      resolution: { bindingKey: "mission-kit.axioms" },
      snapshotPolicy: {
        maxFiles: 128,
        maxFileBytes: 65536,
        maxTotalBytes: 262144
      },
      compatibility: {
        requiredIndex: "README.md",
        entryPattern: { expression: "^A[0-9]+-[^/]+\\.md$" },
        mediaType: "text/markdown"
      }
    };
    const snapshot = await captureReferenceSnapshot(descriptor, {
      bindings: {
        "mission-kit.axioms": {
          kind: "host-registry",
          repository: "apnex/mission-kit",
          root
        }
      }
    });
    assert.equal(snapshot.fileCount, 2);
    assert.deepEqual(snapshot.inventory.map((item) => item.path), ["A1-example.md", "README.md"]);
    assert.doesNotMatch(JSON.stringify(snapshot), new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
