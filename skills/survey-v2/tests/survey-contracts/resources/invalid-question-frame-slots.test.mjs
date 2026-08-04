import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("non-three or duplicate QuestionFrame slot geometry is rejected", async () => {
  await runObligationScenario("O-SV04-02");
});
