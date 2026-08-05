import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executableDigest,
  executeReducerSubmission,
  passRegistrySource,
} from "./support.mjs";

test(
  "transition guards execute in manifest order and stop at the first rejection before handler or validator dispatch",
  async () => {
    const scenario = await createReducerSubmissionScenario({
      mutateAuthority({ profile, protocol }) {
        protocol.spec.guards.push(
          {
            id: "policy-valid",
            description: "Policy admits the normalized values",
          },
          {
            id: "late-valid",
            description: "A later guard must not run after rejection",
          },
        );
        protocol.spec.transitions[0].guardIds = [
          "payload-valid",
          "policy-valid",
          "late-valid",
        ];
        profile.spec.guardBindings.push(
          {
            guardId: "policy-valid",
            handler: {
              id: "policy-guard",
              digest: executableDigest(),
            },
          },
          {
            guardId: "late-valid",
            handler: {
              id: "late-guard",
              digest: executableDigest(),
            },
          },
        );
      },
    });
    const guardCalls = [];
    let handlerCalls = 0;
    let validatorCalls = 0;
    const executables = passRegistrySource({
      guardInvoke: () => {
        guardCalls.push("payload-guard");
        return { status: "pass" };
      },
      handlerInvoke: () => {
        handlerCalls += 1;
        return { status: "accept", products: [] };
      },
      validatorInvoke: () => {
        validatorCalls += 1;
        return { status: "pass" };
      },
    });
    executables.guards.push(
      {
        id: "policy-guard",
        digest: executableDigest(),
        invoke: () => {
          guardCalls.push("policy-guard");
          return {
            status: "reject",
            issues: [{
              code: "POLICY_REJECTED",
              field: "/spec/summary",
              reason: "The declared policy rejected the summary.",
              correction: "Supply a summary admitted by the policy.",
            }],
          };
        },
      },
      {
        id: "late-guard",
        digest: executableDigest(),
        invoke: () => {
          guardCalls.push("late-guard");
          return { status: "pass" };
        },
      },
    );

    const result = await executeReducerSubmission(
      scenario,
      executables,
    );

    assert.equal(result.kind, "rejected");
    assert.equal(result.issues[0].spec.code, "POLICY_REJECTED");
    assert.deepEqual(guardCalls, ["payload-guard", "policy-guard"]);
    assert.equal(handlerCalls, 0);
    assert.equal(validatorCalls, 0);
  },
);
