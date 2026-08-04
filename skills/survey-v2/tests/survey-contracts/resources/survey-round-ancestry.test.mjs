import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("SurveyRound encodes its round altitude and exact ancestry", async () => {
  await runObligationScenario("O-SV01-02");
});
