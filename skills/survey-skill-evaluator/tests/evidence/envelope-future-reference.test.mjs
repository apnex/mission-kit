import test from "node:test";
import assert from "node:assert/strict";
import {
  EvidenceFreezer,
  assertEnvelopeAcyclic,
} from "../../source/executables/evidence/index.mjs";
import { ValidationError } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("campaign evidence envelope rejects future unmask/disclosure references", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const freezer = new EvidenceFreezer({ rootPath: fixture.rootPath });
  await assert.rejects(
    freezer.freezeCampaignEnvelope({
      campaignId: "campaign-1",
      populationRoots: {
        allAssigned: "a".repeat(64),
        protectedUnmaskGrantDigest: "b".repeat(64),
      },
      contentRoot: "c".repeat(64),
      awarenessRoot: "d".repeat(64),
      disclosurePolicy: {},
    }),
    (error) => error instanceof ValidationError,
  );
});
