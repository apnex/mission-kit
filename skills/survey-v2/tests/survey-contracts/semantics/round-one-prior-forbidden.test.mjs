import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("Round-1 ancestry forbids a prior-round interpretation", async () => {
  await runObligationScenario("O-SV07-01");
});
