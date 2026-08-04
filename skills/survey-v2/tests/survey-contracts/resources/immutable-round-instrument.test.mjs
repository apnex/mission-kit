import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("RoundInstrument is an immutable-reference-only runtime input", async () => {
  await runObligationScenario("O-SV10-01");
});
