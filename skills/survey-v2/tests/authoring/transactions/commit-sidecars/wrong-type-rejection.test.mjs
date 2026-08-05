import assert from "node:assert/strict";
import test from "node:test";
import {
  commitAuditResource,
  deriveDirectSidecars,
} from "./support.mjs";

test(
  "a sidecar resource outside every declared target type is rejected",
  () => {
    assert.throws(
      () => deriveDirectSidecars({
        sidecarInvoke(input) {
          return {
            status: "accept",
            resources: [commitAuditResource(input, {
              type: {
                apiVersion: "ambient.example/v1alpha1",
                kind: "AmbientResource",
              },
            })],
          };
        },
      }),
      (error) =>
        error?.code === "COMMIT_SIDECAR_TARGET_MISMATCH",
    );
  },
);
