import assert from "node:assert/strict";
import test from "node:test";
import {
  commitAuditResource,
  deriveDirectSidecars,
} from "./support.mjs";

test(
  "a sidecar producing more resources than its target cardinality is rejected",
  () => {
    assert.throws(
      () => deriveDirectSidecars({
        sidecarInvoke(input) {
          return {
            status: "accept",
            resources: [
              commitAuditResource(input, { name: "audit-one" }),
              commitAuditResource(input, { name: "audit-two" }),
            ],
          };
        },
      }),
      (error) =>
        error?.code === "COMMIT_SIDECAR_CARDINALITY_MISMATCH",
    );
  },
);
