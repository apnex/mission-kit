import assert from "node:assert/strict";
import test from "node:test";
import {
  commitAuditResource,
  deriveDirectSidecars,
} from "./support.mjs";

test(
  "duplicate exact sidecar resource identities are rejected within an otherwise admitted cardinality",
  () => {
    assert.throws(
      () => deriveDirectSidecars({
        cardinality: { min: 1, max: 2 },
        sidecarInvoke(input) {
          const duplicate = commitAuditResource(input);
          return {
            status: "accept",
            resources: [duplicate, duplicate],
          };
        },
      }),
      (error) =>
        error?.code === "COMMIT_SIDECAR_RESOURCE_DUPLICATE",
    );
  },
);
