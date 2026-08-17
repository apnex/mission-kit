import assert from "node:assert/strict";
import test from "node:test";
import {
  EvidenceFreezer,
  projectRedactedDisclosure,
} from "../../source/executables/evidence/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("protected evidence and redacted disclosure remain separate under an output-first acyclic derivation", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const protectedEvidence = {
    public: { summary: "The treatment completed." },
    private: { semanticKey: "never disclose" },
  };
  const disclosure = projectRedactedDisclosure({
    recipeId: "public-summary-v1",
    protectedEvidence,
    allowedPaths: ["public.summary"],
  });
  assert.deepEqual(disclosure.disclosure, {
    public: { summary: "The treatment completed." },
  });
  assert.equal(JSON.stringify(disclosure).includes("never disclose"), false);

  const freezer = new EvidenceFreezer({
    rootPath: fixture.rootPath,
    clock: () => 10,
  });
  const protectedRef = await freezer.freezeJson(protectedEvidence, {
    disclosureClass: "protected",
  });
  const derivation = await freezer.publishDerivation({
    derivationId: "public-summary-1",
    recipeId: "public-summary-v1",
    inputRoots: [protectedRef.rawDigest],
    output: disclosure,
    actor: "deterministic-redactor",
    tool: "field-projection/v1",
    disclosureClass: "redacted",
  });
  assert.notEqual(
    protectedRef.rawDigest,
    derivation.outputReference.rawDigest,
  );
  assert.deepEqual(derivation.record.inputRoots, [protectedRef.rawDigest]);
  assert.equal(
    Object.hasOwn(disclosure, "derivationRecordDigest"),
    false,
  );

  await assert.rejects(
    freezer.publishDerivation({
      derivationId: "cyclic-summary",
      recipeId: "public-summary-v1",
      inputRoots: [protectedRef.rawDigest],
      output: { summary: "invalid", sidecarDigest: "a".repeat(64) },
      actor: "deterministic-redactor",
      tool: "field-projection/v1",
      disclosureClass: "redacted",
    }),
    /sidecar or self reference/u,
  );
});
