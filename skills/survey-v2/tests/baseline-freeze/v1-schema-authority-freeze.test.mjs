import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

const FROZEN_SOURCE = Object.freeze({
  repository: "apnex/mission-kit",
  commit: "a9e569415d9bb07da097ea6b5e84821ed888279f",
  path: "skills/survey-v2/schemas/v1"
});

const FROZEN_SCHEMA_AUTHORITY = Object.freeze([
  Object.freeze({
    path: "schemas/v1/common.schema.json",
    bytes: 1542,
    sha256: "sha256:b5cab014b84be6f3e024e6f302d5613fd73384fb489c705aba689096d8a764ab"
  }),
  Object.freeze({
    path: "schemas/v1/dependency.schema.json",
    bytes: 21966,
    sha256: "sha256:61e7901b3dee2c58ff1cea89f2f1e10a2248089f8dfcab913edb3cc5786ab8d4"
  }),
  Object.freeze({
    path: "schemas/v1/director-lifecycle.schema.json",
    bytes: 11557,
    sha256: "sha256:b5ea027e6877c9d2b61b59513fdc16278dad5b84065567b3e35a6ef8f1faf4eb"
  }),
  Object.freeze({
    path: "schemas/v1/envelope-model.schema.json",
    bytes: 11049,
    sha256: "sha256:13c393ca11db221459cb5c96927db76bae7c42b9a5478cfae8d78567ebd95533"
  }),
  Object.freeze({
    path: "schemas/v1/fragment.schema.json",
    bytes: 3872,
    sha256: "sha256:a51a15e92dabc785d5942712a3d33f0a8d3a4f5d4dda159d3e939f4031227d67"
  }),
  Object.freeze({
    path: "schemas/v1/instrument.schema.json",
    bytes: 9720,
    sha256: "sha256:9035ce71cd1d6450b1a34b3e42d0d5c1991a681fbad131abf94d108db0e09741"
  }),
  Object.freeze({
    path: "schemas/v1/package.schema.json",
    bytes: 2647,
    sha256: "sha256:bcf4fdc9b77afc8f8c552d15552ed46d117b5e253aac6232136297c5426d610f"
  }),
  Object.freeze({
    path: "schemas/v1/presentation.schema.json",
    bytes: 5206,
    sha256: "sha256:913634c967c2b700d5873e703c2b8646633f524976791ef1843e9603e74ce7a1"
  }),
  Object.freeze({
    path: "schemas/v1/projection.schema.json",
    bytes: 2853,
    sha256: "sha256:da0f2f50d0aceacf91b01c8896a3f026d7818dd5f9279a68c66a2a6c18fc92ea"
  }),
  Object.freeze({
    path: "schemas/v1/protocol.schema.json",
    bytes: 7066,
    sha256: "sha256:ef29f63b387492c0055b12326ac5f1c712700454cefaf065cf55279596fd6b8f"
  }),
  Object.freeze({
    path: "schemas/v1/quarantine.schema.json",
    bytes: 1917,
    sha256: "sha256:e748de20aea0373fc74376ed02e9349a5ef46e7afc0568c8ac429f020653f008"
  }),
  Object.freeze({
    path: "schemas/v1/requirement.schema.json",
    bytes: 2870,
    sha256: "sha256:77dc219de678a3f60cb66f6555d3679de026d1099aee9602bb3e3cb869557f86"
  }),
  Object.freeze({
    path: "schemas/v1/session-state.schema.json",
    bytes: 46100,
    sha256: "sha256:24a294c5aaa799883e1941d7d04a3dd63677ebba6dbaffb27d1550b5aa46457e"
  }),
  Object.freeze({
    path: "schemas/v1/test-evidence.schema.json",
    bytes: 8042,
    sha256: "sha256:ba7c9cf84c659911b7b13077c4fcd3893b5bcabd0e8aba651a0724573be70064"
  }),
  Object.freeze({
    path: "schemas/v1/triangulation-process.schema.json",
    bytes: 2695,
    sha256: "sha256:e71095c146fb995df42c96321fb745d4b0cbfc5426aca6063fe1e6172112d594"
  })
]);

const FROZEN_ORDERED_AGGREGATE =
  "sha256:42d16cbf17f4c13d2423721fa2578a4b95977dceb9736bc1b199c0213b81ed55";

function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function orderedAggregate(entries) {
  const exactRecords = entries
    .map(({ path: entryPath, bytes, sha256: digest }) =>
      `${entryPath}\0${bytes}\0${digest}\n`)
    .join("");
  return sha256(Buffer.from(exactRecords, "utf8"));
}

test("all fifteen predecessor schema authorities retain their frozen Git bytes", async () => {
  const freeze = JSON.parse(
    await readFile(
      path.join(
        surveyRoot,
        "tests/baseline-freeze/v1-schema-authority.freeze.json"
      ),
      "utf8"
    )
  );
  assert.deepEqual(Object.keys(freeze).sort(), [
    "entries",
    "kind",
    "schemaVersion",
    "source"
  ]);
  assert.equal(freeze.kind, "SurveyV2PredecessorSchemaFreeze");
  assert.equal(freeze.schemaVersion, "1.0.0");
  assert.deepEqual(freeze.source, FROZEN_SOURCE);
  assert.deepEqual(freeze.entries, FROZEN_SCHEMA_AUTHORITY);
  assert.equal(
    orderedAggregate(FROZEN_SCHEMA_AUTHORITY),
    FROZEN_ORDERED_AGGREGATE
  );
  assert.equal(orderedAggregate(freeze.entries), FROZEN_ORDERED_AGGREGATE);
  assert.equal(FROZEN_SCHEMA_AUTHORITY.length, 15);

  const paths = FROZEN_SCHEMA_AUTHORITY.map((entry) => entry.path);
  assert.deepEqual(paths, [...paths].sort());
  assert.equal(new Set(paths).size, FROZEN_SCHEMA_AUTHORITY.length);

  const observed = [];
  for (const entry of FROZEN_SCHEMA_AUTHORITY) {
    assert.deepEqual(Object.keys(entry).sort(), ["bytes", "path", "sha256"]);
    const bytes = await readFile(path.join(surveyRoot, entry.path));
    assert.equal(bytes.length, entry.bytes, `${entry.path} byte length`);
    assert.equal(sha256(bytes), entry.sha256, `${entry.path} SHA-256`);
    observed.push({
      path: entry.path,
      bytes: bytes.length,
      sha256: sha256(bytes)
    });
  }
  assert.equal(orderedAggregate(observed), FROZEN_ORDERED_AGGREGATE);
});
