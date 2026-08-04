import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("a binding associates one neutral Question with one frozen frame slot", async () => {
  await runObligationScenario("O-SV05-01");
});
