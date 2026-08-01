import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { base64urlCanonical } from "../../source/executables/runtime/lib/canonical.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

function decode(encoded) {
  const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  assert.equal(base64urlCanonical(value), encoded);
  return value;
}

function parseMachines(markdown) {
  const machines = [];
  let current;
  for (const line of markdown.split("\n")) {
    const match = line.trim().match(/^%% @([^|]+)\|(.*)$/);
    if (!match) continue;
    const [, kind, body] = match;
    if (kind === "machine") {
      const [id, version, extra] = body.split("|");
      assert.equal(version, "1");
      assert.equal(extra, undefined);
      current = {
        id,
        initial: null,
        states: [],
        events: [],
        guards: [],
        actions: [],
        mutations: [],
        authorities: [],
        selectors: [],
        transitions: [],
        families: []
      };
      machines.push(current);
    } else {
      assert.ok(current);
      if (kind === "initial") {
        current.initial = decode(body).initial;
      } else if (kind === "defs") {
        const separator = body.indexOf("|");
        assert.ok(separator > 0);
        const property = {
          state: "states",
          event: "events",
          guard: "guards",
          action: "actions",
          mutation: "mutations",
          authority: "authorities"
        }[body.slice(0, separator)];
        assert.ok(property);
        current[property] = decode(body.slice(separator + 1));
      } else if (kind === "selectors") {
        current.selectors = decode(body);
      } else if (kind === "transition") {
        current.transitions.push(decode(body));
      } else if (kind === "family") {
        current.families.push(decode(body));
      }
    }
  }
  return machines;
}

test("Mermaid parse-back exactly matches expanded manifest tuples", async () => {
  const protocol = JSON.parse(
    await readFile(`${surveyRoot}/source/protocol/survey.protocol.json`, "utf8")
  );
  const markdown = await readFile(`${surveyRoot}/references/protocol-fsm.md`, "utf8");
  assert.deepEqual(parseMachines(markdown), protocol.machines);
});
