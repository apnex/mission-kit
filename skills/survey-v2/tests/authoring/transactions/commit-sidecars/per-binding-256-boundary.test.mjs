import assert from "node:assert/strict";
import test from "node:test";
import {
  commitAuditResource,
  deriveDirectSidecars,
} from "./support.mjs";

test(
  "one commit-sidecar binding may derive exactly 256 declared resources",
  () => {
    const sidecars = deriveDirectSidecars({
      cardinality: { min: 256, max: 256 },
      sidecarInvoke(input) {
        return {
          status: "accept",
          resources: Array.from(
            { length: 256 },
            (_, index) =>
              commitAuditResource(input, {
                name: `audit-${String(index + 1).padStart(3, "0")}`,
              }),
          ),
        };
      },
    });

    assert.equal(sidecars.length, 256);
    assert.equal(sidecars[0].metadata.name, "audit-001");
    assert.equal(sidecars.at(-1).metadata.name, "audit-256");
  },
);
