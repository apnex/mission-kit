import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContractSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  loadContractFixture
} from "./support/contract-validation.mjs";

test("two protocol transition families cannot claim one source-event edge", async () => {
  const protocol = await loadContractFixture(
    "positive",
    "authoring-protocol"
  );
  protocol.spec.transitions.push({
    id: "AT03",
    source: { mode: "single", stateId: "awaiting_acceptance" },
    eventId: "ACCEPT",
    toState: "complete",
    guardIds: []
  });
  assert.ok(
    validateContractSemantics(protocol).some(
      (candidate) => candidate.code === "PROTOCOL_EDGE_DUPLICATE"
    )
  );
});
