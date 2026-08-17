import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
} from "../../source/executables/engine/index.mjs";
import {
  ToolBroker,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";

test("EM04 role capsules and the tool broker prevent forbidden knowledge and capability access before execution", async () => {
  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "semantic_judge",
        workOrderId: "em04-forbidden",
        inputProjection: {
          blindBundleDigest: "a".repeat(64),
          peerResults: ["candidate-controlled"],
        },
        outputSchemaId: "role-output/semantic-judge/v1",
      }),
    AuthorizationError,
  );

  let forbiddenHandlerCalls = 0;
  const evidence = [];
  const broker = new ToolBroker({
    allowedTools: ["evidence.read"],
    handlers: {
      "candidate.install": async () => {
        forbiddenHandlerCalls += 1;
        return { installed: true };
      },
    },
    evidenceSink: (entry) => evidence.push(entry),
  });
  await assert.rejects(
    broker.call("candidate.install", {
      target: "/canonical/skill/root",
    }),
    AuthorizationError,
  );
  assert.equal(forbiddenHandlerCalls, 0);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].status, "denied");
  assert.equal(evidence[0].reason, "tool_not_allowlisted");
});
