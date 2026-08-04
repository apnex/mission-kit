import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("RoundInterpretation preserves exact round-specific ancestry and ordinals", async () => {
  await runObligationScenario("O-SV07-03");
});
