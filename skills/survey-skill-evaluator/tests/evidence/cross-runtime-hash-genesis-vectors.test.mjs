import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HASH_PROFILE_ID,
  absentAuthoritativeStateRoot,
  assertHashProfile,
  canonicalize,
  foldPackageInventory,
  hashCanonical,
  parentStagedGenesis,
  rawSha256,
} from "../../source/executables/engine/index.mjs";
import { readJsonFile } from "../../source/executables/engine/atomic-fs.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("runtime independently satisfies every authored hash and genesis vector", async () => {
  const hashVectors = await readJsonFile(
    join(packageRoot, "source/fragments/evidence/hash-vectors.json"),
  );
  const genesisVectors = await readJsonFile(
    join(packageRoot, "source/fragments/evidence/genesis-vectors.json"),
  );

  for (const vector of hashVectors.semantic) {
    assert.equal(canonicalize(vector.value), vector.canonicalJson, vector.vectorId);
    assert.equal(
      hashCanonical(vector.tag, vector.value),
      vector.expectedDigest,
      vector.vectorId,
    );
  }
  for (const vector of hashVectors.raw) {
    assert.equal(
      rawSha256(Buffer.from(vector.utf8, "utf8")),
      vector.expectedDigest,
      vector.vectorId,
    );
  }
  for (const vector of hashVectors.inventory) {
    const result = foldPackageInventory(
      vector.rootKind,
      vector.entries.map((entry) => ({
        path: entry.path,
        mode: entry.mode,
        bytes: Buffer.from(entry.utf8, "utf8"),
      })),
      vector.exclusions,
    );
    assert.equal(
      canonicalize(result.inventory),
      canonicalize(vector.expectedInventory),
      vector.vectorId,
    );
    assert.equal(result.root, vector.expectedRoot, vector.vectorId);
  }

  assert.equal(
    absentAuthoritativeStateRoot(
      genesisVectors.absent.input.machineId,
      genesisVectors.absent.input.objectId,
      genesisVectors.absent.input.schemaVersion,
    ),
    genesisVectors.absent.expectedSentinel,
  );
  const genesis = parentStagedGenesis(genesisVectors.parentStaged.input);
  for (const [field, expected] of Object.entries(
    genesisVectors.parentStaged.expected,
  )) {
    assert.equal(genesis[field], expected, field);
  }

  for (const vector of hashVectors.negative) {
    if (vector.vectorId === "reject-domain-substitution") {
      assert.notEqual(
        hashCanonical("wrong-domain", hashVectors.semantic[0].value),
        hashVectors.semantic[0].expectedDigest,
      );
    } else if (vector.vectorId === "reject-profile-substitution") {
      assert.throws(
        () => assertHashProfile({ hashProfileId: `${HASH_PROFILE_ID}-wrong` }),
        /Unknown or missing semantic hash profile/u,
      );
    } else if (vector.vectorId === "reject-candidate-exclusion") {
      assert.throws(
        () => foldPackageInventory("candidate-package", [], ["ignored"]),
        /exclusions are not canonical/u,
      );
    } else if (vector.vectorId === "reject-evaluator-extra-exclusion") {
      assert.throws(
        () =>
          foldPackageInventory(
            "evaluator-payload",
            [],
            ["package.manifest.json", "ignored"],
          ),
        /exclusions are not canonical/u,
      );
    } else if (vector.vectorId === "reject-path-case-collision") {
      assert.throws(
        () =>
          foldPackageInventory(
            "candidate-package",
            [
              { path: "A", mode: "0644", bytes: Buffer.alloc(0) },
              { path: "a", mode: "0644", bytes: Buffer.alloc(0) },
            ],
            [],
          ),
        /case-fold collision/u,
      );
    } else if (vector.vectorId === "reject-partial-execute") {
      assert.throws(
        () =>
          foldPackageInventory(
            "candidate-package",
            [{ path: "run", mode: "0744", bytes: Buffer.alloc(0) }],
            [],
          ),
        /mode is not portable/u,
      );
    } else {
      assert.fail(`unhandled hash rejection vector: ${vector.vectorId}`);
    }
  }

  for (const vector of genesisVectors.negative) {
    const mutated = structuredClone(genesisVectors.parentStaged.input);
    if (vector.field === "revision") mutated.revision = vector.forbiddenValue;
    if (vector.field === "eventLedger") mutated.eventLedger = [{}];
    if (vector.field === "outboxLedger") mutated.outboxLedger = [{}];
    if (vector.field.startsWith("initialSemanticPayload.")) {
      mutated.initialSemanticPayload[
        vector.field.slice("initialSemanticPayload.".length)
      ] = "f".repeat(64);
    }
    assert.throws(() => parentStagedGenesis(mutated), undefined, vector.vectorId);
  }
});
