import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("SurveyPolicySnapshot freezes the exact geometry, disclosure, and context-selection policy", async () => {
  await runObligationScenario("O-SV10-02");
});
