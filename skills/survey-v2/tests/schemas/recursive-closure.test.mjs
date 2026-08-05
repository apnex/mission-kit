import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validateById } from "../../generated/validators.mjs";
import {
  envelopeModel,
  newRun,
  reachAwaitingRatification
} from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(surveyRoot, relativePath), "utf8"));
}

test("all fifteen schema classes validate offline and reject unknown fields", async () => {
  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const values = new Map([
      ["common", {}],
      ["dependency", await readJson("source/dependencies/references/mission-kit-axioms.reference.json")],
      ["director-lifecycle", await readJson("source/views/director-lifecycle.view.json")],
      ["envelope-model", envelopeModel(run.session)],
      ["fragment", await readJson("source/fragments/navigation/fragment-contract.fragment.json")],
      ["instrument", structuredClone(run.session.interpretations.round1Instrument)],
      ["package", await readJson("tests/fixtures/baseline-v1/package-manifest.json")],
      ["presentation", structuredClone(run.session.outbox.payload)],
      ["projection", await readJson("source/projections/skill-md.projection.json")],
      ["protocol", await readJson("source/protocol/survey.protocol.json")],
      ["quarantine", {
        $schema: "urn:mission-kit:survey-v2:schema:quarantine:v1",
        schemaVersion: "1.0.0",
        operation: "OQ01",
        sessionMember: "session.json",
        runIdentity: {
          slug: run.session.slug,
          sessionId: run.session.sessionId
        },
        observedDigest: run.session.snapshotDigest,
        failureClass: "schema-invalid-session",
        package: {
          id: "urn:mission-kit:survey-v2:package:survey-v2",
          version: "1.0.0"
        },
        detectedBy: "recursive-closure-test",
        evidence: ["deliberate fixture"],
        lastGoodRevision: run.session.revision
      }],
      [
        "requirement",
        await readJson(
          "tests/fixtures/baseline-v1/requirements-registry.json"
        )
      ],
      [
        "session-state",
        await readJson(
          "tests/fixtures/survey/session-v2/historical-v1-session.json"
        )
      ],
      [
        "test-evidence",
        await readJson(
          "tests/fixtures/baseline-v1/test-evidence.manifest.json"
        )
      ],
      ["triangulation-process", await readJson("source/dependencies/processes/axiom-applicability.process.json")]
    ]);

    assert.equal(values.size, 15);
    for (const [schemaClass, value] of values) {
      const schemaId = `urn:mission-kit:survey-v2:schema:${schemaClass}:v1`;
      assert.equal(validateById(schemaId, value).valid, true, `${schemaClass} valid fixture`);
      const unknownRoot = structuredClone(value);
      unknownRoot.unknownSchemaField = true;
      assert.equal(
        validateById(schemaId, unknownRoot).valid,
        false,
        `${schemaClass} rejects unknown root field`
      );
    }

    for (const [schemaId, fixturePath] of [
      [
        "urn:mission-kit:survey-v2:schema:projection:v2",
        "source/projections/validators.projection.json"
      ],
      [
        "urn:mission-kit:survey-v2:schema:requirement:v2",
        "source/requirements/survey-v2.requirements.json"
      ],
      [
        "urn:mission-kit:survey-v2:schema:test-evidence:v2",
        "tests/test-evidence.manifest.json"
      ]
    ]) {
      const value = await readJson(fixturePath);
      assert.equal(
        validateById(schemaId, value).valid,
        true,
        `${schemaId} validates its active fixture`
      );
      const unknownRoot = structuredClone(value);
      unknownRoot.unknownSchemaField = true;
      assert.equal(
        validateById(schemaId, unknownRoot).valid,
        false,
        `${schemaId} rejects an unknown active-root field`
      );
    }

    const session = structuredClone(values.get("session-state"));
    session.dependencies.unknownNestedField = true;
    assert.equal(
      validateById("urn:mission-kit:survey-v2:schema:session-state:v1", session).valid,
      false,
      "session rejects unknown nested dependency state"
    );
    const model = structuredClone(values.get("envelope-model"));
    model.methodology.unknownNestedField = true;
    assert.equal(
      validateById("urn:mission-kit:survey-v2:schema:envelope-model:v1", model).valid,
      false,
      "envelope rejects unknown nested methodology field"
    );
    const dependency = structuredClone(values.get("dependency"));
    dependency.source.unknownNestedField = true;
    assert.equal(
      validateById("urn:mission-kit:survey-v2:schema:dependency:v1", dependency).valid,
      false,
      "dependency rejects unknown nested source field"
    );
  } finally {
    await run.cleanup();
  }
});
