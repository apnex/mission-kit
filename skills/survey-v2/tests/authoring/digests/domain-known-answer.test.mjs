import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../source/authoring/kernel/canonical.mjs";
import {
  AUTHORING_DIGEST_DOMAINS,
  authoringDigest,
  isAuthoringDigestDomain
} from "../../../source/authoring/kernel/digests.mjs";
import { goldenDigestFixture as fixture } from "./golden-fixture.mjs";

test("all frozen authoring digest domains match immutable known-answer vectors", () => {
  assert.equal(fixture.schemaVersion, "1.0.0");
  assert.equal(
    Buffer.from(canonicalize(fixture.payload), "utf8").toString("base64"),
    fixture.canonicalBytesBase64
  );
  assert.deepEqual(
    fixture.vectors.map(({ domain }) => domain),
    AUTHORING_DIGEST_DOMAINS
  );
  for (const { domain, digest } of fixture.vectors) {
    assert.equal(authoringDigest(domain, fixture.payload), digest, domain);
    assert.equal(isAuthoringDigestDomain(domain), true, domain);
  }
});
