import test from "node:test";
import {
  commitReceiptDigest,
  projectCommitReceiptCore
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertResourceSelfExclusion,
  selfDigestedResource
} from "./resource-fixture.mjs";

test("AuthoringCommitReceipt digest omits only receiptDigest from its semantic resource core", () => {
  assertResourceSelfExclusion({
    digest: commitReceiptDigest,
    domain: "commit-receipt",
    project: projectCommitReceiptCore,
    resource: selfDigestedResource("AuthoringCommitReceipt", "receiptDigest", {
      beforeRevision: 1,
      afterRevision: 2
    }),
    selfDigestField: "receiptDigest"
  });
});
