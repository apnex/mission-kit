import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("exactly three ordered QuestionFrame slots are accepted", async () => {
  await runObligationScenario("O-SV04-01");
});
