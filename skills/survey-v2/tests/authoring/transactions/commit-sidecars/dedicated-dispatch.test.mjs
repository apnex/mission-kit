import assert from "node:assert/strict";
import test from "node:test";
import {
  commitAuditResource,
  deriveDirectSidecars,
} from "./support.mjs";

test(
  "dedicated sidecar dispatch receives exact frozen commit ancestry and satisfies its declared target",
  () => {
    let calls = 0;
    const sidecars = deriveDirectSidecars({
      sidecarInvoke(input) {
        calls += 1;
        assert.deepEqual(
          Object.keys(input).sort(),
          [
            "assignment",
            "contextClosure",
            "mutation",
            "receipt",
            "request",
            "resources",
            "submission",
          ],
        );
        assert.equal(Object.isFrozen(input), true);
        assert.equal(Object.isFrozen(input.receipt), true);
        assert.equal(Object.isFrozen(input.resources), true);
        return {
          status: "accept",
          resources: [commitAuditResource(input)],
        };
      },
    });

    assert.equal(calls, 1);
    assert.equal(sidecars.length, 1);
    assert.equal(sidecars[0].kind, "CommitAudit");
    assert.equal(Object.isFrozen(sidecars), true);
    assert.equal(Object.isFrozen(sidecars[0]), true);
  },
);
