import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContractSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  loadContractFixture
} from "./support/contract-validation.mjs";

test("a protocol transition source set must use canonical lexical order", async () => {
  const protocol = await loadContractFixture(
    "positive",
    "authoring-protocol"
  );
  protocol.spec.transitions[0].source = {
    mode: "set",
    stateIds: ["draft_task", "awaiting_acceptance"]
  };
  assert.ok(
    validateContractSemantics(protocol).some(
      (candidate) => candidate.code === "SOURCE_SET_ORDER_INVALID"
    )
  );
});
