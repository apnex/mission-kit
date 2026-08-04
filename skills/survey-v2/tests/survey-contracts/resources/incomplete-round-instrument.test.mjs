import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("an incomplete or inconsistent RoundInstrument is rejected", async () => {
  await runObligationScenario("O-SV05-03");
});
