import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("SurveyRuntimeArtifact admits exactly five closed variants", async () => {
  await runObligationScenario("O-SV13-01");
});
