import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("child frame bindings carry the exact parent reference, scope relation, and rationale", async () => {
  await runObligationScenario("O-SV03-01");
});
