import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("RoundInstrument closes exactly three ordered Question, binding, and frame references", async () => {
  await runObligationScenario("O-SV05-02");
});
