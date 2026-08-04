import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTHORING_DIGEST_DOMAINS,
  authoringDigestPrefix
} from "../../../source/authoring/kernel/digests.mjs";

test("domain prefixes are exact UTF-8 strings terminated by one NUL byte", () => {
  for (const domain of AUTHORING_DIGEST_DOMAINS) {
    const prefix = Buffer.from(authoringDigestPrefix(domain), "utf8");
    assert.equal(
      prefix.subarray(0, -1).toString("utf8"),
      `mission-kit:authoring:${domain}:v1`
    );
    assert.equal(prefix.at(-1), 0);
    assert.equal(prefix.subarray(0, -1).includes(0), false);
  }
});
