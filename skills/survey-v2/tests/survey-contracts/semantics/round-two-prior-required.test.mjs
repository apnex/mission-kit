import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("Round-2 ancestry requires the exact sealed Round-1 interpretation", async () => {
  await runObligationScenario("O-SV07-02");
});
