import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTHORING_DIGEST_DOMAINS,
  authoringDigest
} from "../../../source/authoring/kernel/digests.mjs";
import { goldenDigestFixture as fixture } from "./golden-fixture.mjs";

test("the same canonical value has a distinct digest in every frozen domain", () => {
  const digests = AUTHORING_DIGEST_DOMAINS.map((domain) =>
    authoringDigest(domain, fixture.payload)
  );
  assert.equal(new Set(digests).size, AUTHORING_DIGEST_DOMAINS.length);
});
