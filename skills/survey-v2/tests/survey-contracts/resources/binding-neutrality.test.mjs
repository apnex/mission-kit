import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("SurveyQuestionBinding admits only a shared neutral Question reference and never inline Survey fields", async () => {
  await runObligationScenario("O-SV06-01");
});
