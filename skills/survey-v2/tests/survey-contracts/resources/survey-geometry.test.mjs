import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("the Survey resource fixes the two-round three-question geometry and top frame", async () => {
  await runObligationScenario("O-SV01-01");
});
