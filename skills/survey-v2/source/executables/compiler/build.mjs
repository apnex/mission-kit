#!/usr/bin/env node
import { constants } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rename,
  rm
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { HANDLER_SURFACE } from "../runtime/lib/handler-surface.mjs";
import {
  base64urlCanonical,
  canonicalize,
  prettyJson,
  sha256Bytes,
  sha256Value
} from "../runtime/lib/canonical.mjs";

const compilerDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = await realpath(path.resolve(compilerDirectory, "../../.."));
const mode = process.argv[2] ?? "build";

if (!["build", "--check"].includes(mode) || process.argv.length > 3) {
  process.stderr.write("usage: ./compile.sh [--check]\n");
  process.exit(64);
}

function fail(message) {
  throw new Error(message);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function assertRelativePath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.posix.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`unsafe package path: ${String(relativePath)}`);
  }
  return relativePath;
}

function ownedPath(relativePath) {
  assertRelativePath(relativePath);
  const target = path.resolve(root, ...relativePath.split("/"));
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`package path escapes sovereign root: ${relativePath}`);
  }
  return target;
}

async function assertNoFollowAncestors(target, { leafMayBeMissing = false } = {}) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) fail(`resolved path escapes root: ${target}`);
  let current = root;
  const parts = relative.split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    let stat;
    try {
      stat = await lstat(current);
    } catch (error) {
      if (error.code === "ENOENT" && leafMayBeMissing) return;
      throw error;
    }
    if (stat.isSymbolicLink()) fail(`owned path traverses symlink: ${path.relative(root, current)}`);
    if (index < parts.length - 1 && !stat.isDirectory()) {
      fail(`owned path traverses non-directory: ${path.relative(root, current)}`);
    }
  }
}

async function readBytes(relativePath) {
  const target = ownedPath(relativePath);
  await assertNoFollowAncestors(target);
  const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) fail(`registered member is not a regular file: ${relativePath}`);
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

async function readText(relativePath) {
  return (await readBytes(relativePath)).toString("utf8");
}

async function readJson(relativePath) {
  try {
    return JSON.parse(await readText(relativePath));
  } catch (error) {
    fail(`invalid JSON ${relativePath}: ${error.message}`);
  }
}

function unique(values, label) {
  const result = new Set(values);
  if (result.size !== values.length) fail(`duplicate ${label}`);
  return result;
}

function equalSets(left, right) {
  return left.size === right.size && [...left].every((item) => right.has(item));
}

function assertExactValues(actual, expected, label) {
  const actualSorted = [...actual].sort(compareUtf8);
  const expectedSorted = [...expected].sort(compareUtf8);
  if (canonicalize(actualSorted) !== canonicalize(expectedSorted)) {
    const missing = expectedSorted.filter((item) => !actualSorted.includes(item));
    const extra = actualSorted.filter((item) => !expectedSorted.includes(item));
    fail(`${label} mismatch; missing=[${missing.join(",")}], extra=[${extra.join(",")}]`);
  }
}

function validateProtocol(protocol) {
  const machines = new Map(protocol.machines.map((machine) => [machine.id, machine]));
  if (machines.size !== 2 || !machines.has("phase") || !machines.has("runtime")) {
    fail("protocol must declare exactly phase and runtime machines");
  }
  const globalTransitionIds = [];
  const globalEventIds = [];

  for (const machine of machines.values()) {
    const states = unique(machine.states.map((state) => state.id), `${machine.id} state`);
    const events = unique(machine.events.map((item) => item.id), `${machine.id} event`);
    const guards = unique(machine.guards.map((item) => item.id), `${machine.id} guard`);
    const actions = unique(machine.actions.map((item) => item.id), `${machine.id} action`);
    const mutations = unique(machine.mutations.map((item) => item.id), `${machine.id} mutation`);
    const authorities = unique(machine.authorities.map((item) => item.id), `${machine.id} authority`);
    const selectors = new Map(machine.selectors.map((selector) => [selector.id, selector]));
    unique([...selectors.keys()], `${machine.id} selector`);
    globalEventIds.push(...events);

    for (const selector of selectors.values()) {
      unique(selector.members, `${selector.id} member`);
      for (const member of selector.members) {
        if (!states.has(member)) fail(`${selector.id} references unknown state ${member}`);
      }
    }

    const adjacency = new Map([...states].map((state) => [state, new Set()]));
    for (const transition of machine.transitions) {
      globalTransitionIds.push(transition.id);
      if (transition.from !== "start" && !states.has(transition.from)) fail(`${transition.id} has unknown source`);
      if (!states.has(transition.to)) fail(`${transition.id} has unknown target`);
      if (!events.has(transition.event)) fail(`${transition.id} has unknown event`);
      if (!guards.has(transition.guard)) fail(`${transition.id} has unknown guard`);
      if (!actions.has(transition.action)) fail(`${transition.id} has unknown action`);
      if (!mutations.has(transition.mutation)) fail(`${transition.id} has unknown mutation`);
      if (!authorities.has(transition.authority)) fail(`${transition.id} has unknown authority`);
      if (transition.from !== "start") adjacency.get(transition.from).add(transition.to);
    }
    for (const family of machine.families) {
      globalTransitionIds.push(family.id);
      const selector = selectors.get(family.fromSelector);
      if (!selector) fail(`${family.id} has unknown selector`);
      if (family.to !== "same" && !states.has(family.to)) fail(`${family.id} has unknown target`);
      if (
        !events.has(family.event) ||
        !guards.has(family.guard) ||
        !actions.has(family.action) ||
        !mutations.has(family.mutation) ||
        !authorities.has(family.authority)
      ) {
        fail(`${family.id} has unresolved definition`);
      }
      for (const member of selector.members) {
        adjacency.get(member).add(family.to === "same" ? member : family.to);
      }
    }

    const reached = new Set([machine.initial]);
    const queue = [machine.initial];
    while (queue.length > 0) {
      for (const target of adjacency.get(queue.shift()) ?? []) {
        if (!reached.has(target)) {
          reached.add(target);
          queue.push(target);
        }
      }
    }
    if (reached.size !== states.size) {
      fail(`${machine.id} has unreachable states: ${[...states].filter((state) => !reached.has(state)).join(", ")}`);
    }
    for (const state of machine.states.filter((item) => !item.terminal)) {
      if ((adjacency.get(state.id)?.size ?? 0) === 0) {
        fail(`${machine.id} state ${state.id} has no authorized exit`);
      }
    }
  }

  unique(globalTransitionIds, "global transition ID");
  unique(globalEventIds, "global event ID");
  const phase = machines.get("phase");
  const runtime = machines.get("runtime");
  if (phase.transitions.length !== 47 || phase.families.length !== 2) {
    fail(`phase protocol must have 47 direct transitions and two families`);
  }
  if (runtime.transitions.length !== 13 || runtime.families.length !== 1) {
    fail(`runtime protocol must have 13 direct transitions and one family`);
  }
  if (phase.transitions.find((item) => item.id === "T35")?.coupledTransition !== "RT12") fail("T35 must couple RT12");
  if (runtime.transitions.find((item) => item.id === "RT12")?.coupledTransition !== "T35") fail("RT12 must couple T35");
  if (phase.families.find((item) => item.id === "TF01")?.coupledFamily !== "RF01") fail("TF01 must couple RF01");
  if (runtime.families.find((item) => item.id === "RF01")?.coupledFamily !== "TF01") fail("RF01 must couple TF01");

  const expectedPhaseSurface = [...phase.transitions, ...phase.families]
    .map((item) => `${item.action}/${item.mutation}`);
  const expectedRuntimeSurface = [...runtime.transitions, ...runtime.families]
    .map((item) => `${item.action}/${item.mutation}`);
  assertExactValues(HANDLER_SURFACE.phase, expectedPhaseSurface, "phase action/mutation implementation surface");
  assertExactValues(HANDLER_SURFACE.runtime, expectedRuntimeSurface, "runtime action/mutation implementation surface");
}

async function scanOwnedFiles(directory = root, prefix = "") {
  const result = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => Buffer.from(left.name).compare(Buffer.from(right.name)));
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const rootSegment = relative.split("/")[0];
    if (
      rootSegment === "node_modules" ||
      rootSegment === "surveys" ||
      rootSegment === ".git"
    ) {
      continue;
    }
    const absolute = path.join(directory, entry.name);
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink()) fail(`owned tree contains symlink: ${relative}`);
    if (stat.isDirectory()) {
      result.push(...await scanOwnedFiles(absolute, relative));
    } else if (stat.isFile()) {
      result.push(relative);
    } else {
      fail(`owned tree contains special file: ${relative}`);
    }
  }
  return result;
}

async function validateInventory(packageManifest, { generatedMayBeMissing }) {
  const members = new Map(packageManifest.members.map((member) => [member.path, member]));
  const actual = new Set(await scanOwnedFiles());
  for (const member of packageManifest.members) {
    const exists = actual.has(member.path);
    if (!exists && !(generatedMayBeMissing && member.kind === "generated")) {
      fail(`registered member is missing: ${member.path}`);
    }
    if (exists) {
      const target = ownedPath(member.path);
      await assertNoFollowAncestors(target);
      const physical = await realpath(target);
      if (!physical.startsWith(`${root}${path.sep}`)) {
        fail(`registered member resolves outside root: ${member.path}`);
      }
    }
  }
  const extras = [...actual].filter((item) => !members.has(item));
  if (extras.length > 0) fail(`unregistered owned files: ${extras.sort(compareUtf8).join(", ")}`);
}

function validateComposition(fragments, requirements, knownSemanticIds) {
  const fragmentIds = unique(fragments.map((fragment) => fragment.id), "fragment ID");
  const requirementIds = new Set(requirements.requirements.map((item) => item.id));
  const obligationIds = new Set(
    requirements.requirements.flatMap((item) => item.acceptanceObligations.map((obligation) => obligation.id))
  );
  const providers = new Map();
  for (const fragment of fragments) {
    for (const capability of fragment.composition.provides) {
      const owners = providers.get(capability) ?? [];
      owners.push(fragment.id);
      providers.set(capability, owners);
    }
  }
  for (const [capability, owners] of providers) {
    if (owners.length !== 1) fail(`capability ${capability} has ${owners.length} providers`);
  }

  const adjacency = new Map(fragments.map((fragment) => [fragment.id, new Set()]));
  for (const fragment of fragments) {
    const payloadOwner = fragment.representation.payloadPath;
    if (!payloadOwner.startsWith("source/")) fail(`${fragment.id} payload must remain canonical source`);
    for (const capability of fragment.composition.requires) {
      const owners = providers.get(capability);
      if (!owners || owners.length !== 1) fail(`${fragment.id} requires unresolved capability ${capability}`);
      adjacency.get(fragment.id).add(owners[0]);
    }
    for (const dependency of fragment.composition.dependencies) {
      if (!knownSemanticIds.has(dependency)) fail(`${fragment.id} references unknown typed dependency ${dependency}`);
      if (fragmentIds.has(dependency)) adjacency.get(fragment.id).add(dependency);
    }
    for (const requirementId of fragment.requirements) {
      if (!requirementIds.has(requirementId)) fail(`${fragment.id} claims unknown requirement ${requirementId}`);
    }
    for (const obligationId of fragment.contribution.obligations) {
      if (!obligationIds.has(obligationId)) fail(`${fragment.id} claims unknown obligation ${obligationId}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(fragmentId) {
    if (visiting.has(fragmentId)) fail(`fragment composition cycle reaches ${fragmentId}`);
    if (visited.has(fragmentId)) return;
    visiting.add(fragmentId);
    for (const dependency of adjacency.get(fragmentId)) visit(dependency);
    visiting.delete(fragmentId);
    visited.add(fragmentId);
  }
  for (const fragmentId of fragmentIds) visit(fragmentId);

  for (const requirement of requirements.requirements) {
    if (!fragmentIds.has(requirement.primaryOwner)) fail(`${requirement.id} primary owner is absent`);
    const owner = fragments.find((fragment) => fragment.id === requirement.primaryOwner);
    if (!owner.requirements.includes(requirement.id)) fail(`${requirement.id} primary owner does not claim it`);
    for (const capability of requirement.requiredCapabilities) {
      if (!providers.has(capability)) fail(`${requirement.id} requires unresolved capability ${capability}`);
    }
    for (const obligation of requirement.acceptanceObligations) {
      if (!fragments.some((fragment) => fragment.contribution.obligations.includes(obligation.id))) {
        fail(`${obligation.id} has no fragment contribution owner`);
      }
    }
  }

  return providers;
}

function markdownPayload(text) {
  return text.trim();
}

async function renderFragmentSection(section, fragmentById) {
  const blocks = [];
  for (const fragmentId of section.fragmentIds) {
    const fragment = fragmentById.get(fragmentId);
    if (!fragment) fail(`projection selects unknown fragment ${fragmentId}`);
    blocks.push(markdownPayload(await readText(fragment.representation.payloadPath)));
  }
  return `## ${section.heading}\n\n${blocks.join("\n\n")}`;
}

async function renderSkill(recipe, fragmentById) {
  const sections = [];
  for (const section of recipe.selection.sections) {
    sections.push(await renderFragmentSection(section, fragmentById));
  }
  const links = [
    ["Question design", "references/question-design.md"],
    ["Interaction protocol", "references/interaction-protocol.md"],
    ["Interpretation", "references/interpretation.md"],
    ["State and resume", "references/state-and-resume.md"],
    ["Dependency resolution", "references/dependency-resolution.md"],
    ["Envelope contract", "references/envelope-contract.md"],
    ["Validation", "references/validation.md"],
    ["Protocol FSM", "references/protocol-fsm.md"],
    ["Director FLOW", "references/director-flow.md"],
    ["Mechanism index", "references/mechanism-index.md"]
  ];
  return [
    "---",
    "name: survey",
    "description: Capture open stakeholder intent through two sequential three-question rounds, preserve exact evidence and authority, and produce one ratified self-contained planning envelope; use before design when direction remains open.",
    "---",
    "",
    "<!-- GENERATED FILE. Edit canonical fragments and projection recipes, then run ./compile.sh. -->",
    "",
    "# Survey",
    "",
    "Use Survey before committing to a design when stakeholder direction remains open. Bypass it only when intent is already fixed and recorded; never use it to manufacture Director authority.",
    "",
    "Run `scripts/survey-init.mjs` once for a new run, persist cognitive drafts through `scripts/survey-transition.mjs`, and use `scripts/survey-present.mjs` for the exact current Director view. Consult `scripts/survey-status.mjs` on takeover and `scripts/survey-envelope.mjs` only for ratified finalization or byte checking.",
    "",
    ...sections,
    "",
    "## Runtime references",
    "",
    ...links.map(([label, target]) => `- [${label}](${target}) — read when that boundary controls the current step.`),
    "",
    "The only successful terminal handoff is the exact envelope path and digest sealed by T35. A generated file, validator, or proposer cannot ratify for the Director or authorize promotion.",
    ""
  ].join("\n");
}

async function renderReferences(recipe, fragmentById, mechanismMarkdown) {
  const outputs = new Map();
  const sections = recipe.selection.sections;
  assertExactValues(
    sections.map((section) => section.target),
    recipe.targets,
    `${recipe.id} section targets`
  );
  for (const section of sections) {
    const body = section.target === "references/mechanism-index.md"
      ? mechanismMarkdown
      : await renderFragmentSection(section, fragmentById);
    outputs.set(
      section.target,
      `<!-- GENERATED FILE. Edit canonical fragments and projection recipes. -->\n\n${body}\n`
    );
  }
  return outputs;
}

function mermaidMachine(machine) {
  const aliases = new Map(machine.states.map((state) => [state.id, state.label]));
  const lines = [
    "```mermaid",
    "stateDiagram-v2",
    `    %% @machine|${machine.id}|1`,
    `    %% @initial|${base64urlCanonical({ initial: machine.initial })}`
  ];
  for (const [definitionClass, definitions] of [
    ["state", machine.states],
    ["event", machine.events],
    ["guard", machine.guards],
    ["action", machine.actions],
    ["mutation", machine.mutations],
    ["authority", machine.authorities]
  ]) {
    lines.push(`    %% @defs|${definitionClass}|${base64urlCanonical(definitions)}`);
  }
  lines.push(`    %% @selectors|${base64urlCanonical(machine.selectors)}`);
  if (!machine.transitions.some((transition) => transition.from === "start")) {
    lines.push(`    [*] --> ${aliases.get(machine.initial)}`);
  }
  for (const transition of machine.transitions) {
    const from = transition.from === "start" ? "[*]" : aliases.get(transition.from);
    const to = aliases.get(transition.to);
    lines.push(`    %% @transition|${base64urlCanonical(transition)}`);
    lines.push(
      `    ${from} --> ${to}: ${transition.id}|${transition.event}|${transition.guard}|${transition.action}|${transition.mutation}|${transition.authority}`
    );
  }
  for (const family of machine.families) {
    const selector = machine.selectors.find((item) => item.id === family.fromSelector);
    lines.push(`    %% @family|${base64urlCanonical(family)}`);
    lines.push(`    state "${selector.description}" as ${selector.id}`);
    const to = family.to === "same" ? selector.id : aliases.get(family.to);
    lines.push(
      `    ${selector.id} --> ${to}: ${family.id}|${family.event}|${family.guard}|${family.action}|${family.mutation}|${family.authority}`
    );
  }
  for (const state of machine.states.filter((item) => item.terminal)) {
    lines.push(`    ${aliases.get(state.id)} --> [*]`);
  }
  lines.push("```");
  return lines.join("\n");
}

function decodeCanonical(encoded, label) {
  try {
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (base64urlCanonical(value) !== encoded) fail(`${label} is not canonical base64url JSON`);
    return value;
  } catch (error) {
    fail(`${label} cannot be decoded: ${error.message}`);
  }
}

function renderProtocolFsm(protocol) {
  return [
    "<!-- GENERATED FILE. The encoded records and edges are parsed back during conformance tests. -->",
    "",
    "# Protocol FSM",
    "",
    ...protocol.machines.flatMap((machine) => [
      `## ${machine.id === "phase" ? "Phase" : "Runtime-status"} machine`,
      "",
      mermaidMachine(machine),
      ""
    ])
  ].join("\n");
}

function parseProtocolFsm(markdown) {
  const machines = [];
  let current = null;
  for (const line of markdown.split("\n")) {
    const record = line.trim().match(/^%% @([^|]+)\|(.*)$/);
    if (!record) continue;
    const [, kind, body] = record;
    if (kind === "machine") {
      const [id, version, extra] = body.split("|");
      if (!id || version !== "1" || extra !== undefined) fail("FSM @machine record is malformed");
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
      continue;
    }
    if (!current) fail(`FSM @${kind} record precedes @machine`);
    if (kind === "initial") {
      current.initial = decodeCanonical(body, "FSM @initial").initial;
    } else if (kind === "defs") {
      const separator = body.indexOf("|");
      if (separator < 1) fail("FSM @defs record is malformed");
      const definitionClass = body.slice(0, separator);
      const property = {
        state: "states",
        event: "events",
        guard: "guards",
        action: "actions",
        mutation: "mutations",
        authority: "authorities"
      }[definitionClass];
      if (!property) fail(`FSM has unknown definition class ${definitionClass}`);
      current[property] = decodeCanonical(body.slice(separator + 1), `FSM @defs ${definitionClass}`);
    } else if (kind === "selectors") {
      current.selectors = decodeCanonical(body, "FSM @selectors");
    } else if (kind === "transition") {
      current.transitions.push(decodeCanonical(body, "FSM @transition"));
    } else if (kind === "family") {
      current.families.push(decodeCanonical(body, "FSM @family"));
    }
  }
  return { machines };
}

function assertProtocolFsmParseback(markdown, protocol) {
  const parsed = parseProtocolFsm(markdown);
  if (canonicalize(parsed.machines) !== canonicalize(protocol.machines)) {
    fail("protocol FSM parse-back differs from canonical machine definitions or transitions");
  }
}

function renderDirectorFlow(protocol) {
  const phase = protocol.machines.find((machine) => machine.id === "phase");
  const runtime = protocol.machines.find((machine) => machine.id === "runtime");
  const lines = [
    "<!-- GENERATED FILE. Machine edges resolve to the canonical protocol manifest. -->",
    "",
    "# Director FLOW",
    "",
    "```mermaid",
    "flowchart TB"
  ];
  for (const machine of protocol.machines) {
    for (const state of machine.states) {
      const nodeId = `${machine.id}_${state.id}`.replace(/[^A-Za-z0-9_]/g, "_");
      lines.push(`    %% @flow-node|${nodeId}|${machine.id}-state|${state.id}`);
      lines.push(`    ${nodeId}[${state.label}]`);
    }
    for (const selector of machine.selectors) {
      const nodeId = `${machine.id}_${selector.id}`;
      lines.push(`    %% @flow-node|${nodeId}|${machine.id}-selector|${selector.id}`);
      lines.push(`    ${nodeId}{${selector.description}}`);
    }
  }
  for (const machine of protocol.machines) {
    for (const transition of [...machine.transitions, ...machine.families]) {
      const sourceId = transition.from === "start"
        ? `${machine.id}_start`
        : `${machine.id}_${transition.from ?? transition.fromSelector}`.replace(/[^A-Za-z0-9_]/g, "_");
      const targetState = transition.to === "same" ? transition.fromSelector : transition.to;
      const targetId = `${machine.id}_${targetState}`.replace(/[^A-Za-z0-9_]/g, "_");
      if (transition.from === "start") {
        lines.push(`    %% @flow-node|${sourceId}|machine-pseudostate|${machine.id}|start`);
        lines.push(`    ${sourceId}((start))`);
      }
      lines.push(`    %% @flow-edge|${machine.id}|${base64urlCanonical(transition)}`);
      lines.push(`    ${sourceId} -->|${transition.id}| ${targetId}`);
    }
  }
  const questionEvents = ["PRESENT_Q1", "PRESENT_Q2", "PRESENT_Q3", "PRESENT_Q4", "PRESENT_Q5", "PRESENT_Q6"];
  for (const event of questionEvents) {
    const transition = phase.transitions.find((item) => item.event === event);
    lines.push(`    %% @flow-question|${event.slice(-2)}|${transition.id}|${transition.from}|${transition.to}`);
  }
  lines.push("```", "", "The six `@flow-question` records prove distinct Q1–Q6 lanes. Runtime edges remain visible so a Director-facing view cannot imply progress while the process is suspended, blocked, rehydrating, or closed.", "");
  return lines.join("\n");
}

function assertDirectorFlowParseback(markdown, protocol) {
  const parsedByMachine = new Map(protocol.machines.map((machine) => [machine.id, []]));
  const questionRecords = [];
  for (const line of markdown.split("\n")) {
    const edge = line.trim().match(/^%% @flow-edge\|([^|]+)\|(.+)$/);
    if (edge) {
      if (!parsedByMachine.has(edge[1])) fail(`Director FLOW names unknown machine ${edge[1]}`);
      parsedByMachine.get(edge[1]).push(decodeCanonical(edge[2], "Director FLOW edge"));
    }
    const question = line.trim().match(/^%% @flow-question\|(Q[1-6])\|(T[0-9]{2})\|([^|]+)\|([^|]+)$/);
    if (question) questionRecords.push(question.slice(1));
  }
  for (const machine of protocol.machines) {
    const expected = [...machine.transitions, ...machine.families];
    if (canonicalize(parsedByMachine.get(machine.id)) !== canonicalize(expected)) {
      fail(`Director FLOW parse-back differs from canonical ${machine.id} transition tuples`);
    }
  }
  const expectedQuestions = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"].map((questionId) => {
    const transition = protocol.machines[0].transitions.find((item) => item.event === `PRESENT_${questionId}`);
    return [questionId, transition.id, transition.from, transition.to];
  });
  if (canonicalize(questionRecords) !== canonicalize(expectedQuestions)) {
    fail("Director FLOW question-lane parse-back differs from Q1-Q6 presentation transitions");
  }
}

function mechanismIndex(requirements, fragments) {
  const rows = requirements.requirements.map((requirement) => {
    const owners = fragments
      .filter((fragment) => fragment.requirements.includes(requirement.id))
      .map((fragment) => fragment.id);
    return {
      requirementId: requirement.id,
      mechanisms: requirement.mechanisms,
      primaryOwner: requirement.primaryOwner,
      supportingOwners: owners.filter((owner) => owner !== requirement.primaryOwner).sort(compareUtf8),
      capabilities: requirement.requiredCapabilities,
      obligations: requirement.acceptanceObligations.map((item) => item.id),
      evidenceClasses: requirement.evidenceClasses
    };
  });
  return {
    id: "urn:mission-kit:survey-v2:index:mechanisms",
    schemaVersion: "1.0.0",
    mechanisms: rows
  };
}

function mechanismIndexMarkdown(index) {
  return [
    "## Mechanism index",
    "",
    "| Requirement | Mechanism | Primary owner | Obligation | Evidence |",
    "|---|---|---|---|---|",
    ...index.mechanisms.map((item) => (
      `| ${item.requirementId} | ${item.mechanisms.join(", ")} | \`${item.primaryOwner}\` | ${item.obligations.join(", ")} | ${item.evidenceClasses.join(", ")} |`
    ))
  ].join("\n");
}

function dependencyIndex(dependencies, fragments) {
  return {
    id: "urn:mission-kit:survey-v2:index:dependencies",
    schemaVersion: "1.0.0",
    dependencies: dependencies.map(({ path: sourcePath, value }) => ({
      id: value.id,
      kind: value.kind ?? "triangulation-process",
      sourcePath,
      digest: sha256Value(value),
      consumers: fragments
        .filter((fragment) => fragment.composition.dependencies.includes(value.id))
        .map((fragment) => fragment.id)
        .sort(compareUtf8)
    }))
  };
}

function standaloneValidators(ajv, schemas) {
  const exportsById = Object.fromEntries(
    schemas.map((schema, index) => [`schema_${String(index).padStart(2, "0")}`, schema.$id])
  );
  const code = standaloneCode(ajv, exportsById)
    .replaceAll('require("ajv/dist/runtime/equal").default', "__surveyJsonEqual")
    .replaceAll('require("ajv/dist/runtime/ucs2length").default', "__surveyUcs2Length");
  if (/\brequire\s*\(/u.test(code)) {
    fail("standalone validator generation emitted an unsupported runtime dependency");
  }
  const entries = schemas.map((schema, index) => (
    `  [${JSON.stringify(schema.$id)}, schema_${String(index).padStart(2, "0")}]`
  ));
  return [
    "/* GENERATED FILE. Edit schemas and run ./compile.sh. */",
    "function __surveyUcs2Length(value) {",
    "  let length = 0;",
    "  let position = 0;",
    "  while (position < value.length) {",
    "    length += 1;",
    "    const first = value.charCodeAt(position);",
    "    position += 1;",
    "    if (first >= 0xd800 && first <= 0xdbff && position < value.length) {",
    "      const second = value.charCodeAt(position);",
    "      if ((second & 0xfc00) === 0xdc00) position += 1;",
    "    }",
    "  }",
    "  return length;",
    "}",
    "function __surveyJsonEqual(left, right) {",
    "  if (left === right) return true;",
    "  if (!left || !right || typeof left !== \"object\" || typeof right !== \"object\") {",
    "    return left !== left && right !== right;",
    "  }",
    "  if (left.constructor !== right.constructor) return false;",
    "  if (Array.isArray(left)) {",
    "    if (left.length !== right.length) return false;",
    "    for (let index = left.length; index-- !== 0;) {",
    "      if (!__surveyJsonEqual(left[index], right[index])) return false;",
    "    }",
    "    return true;",
    "  }",
    "  if (left.constructor === RegExp) return left.source === right.source && left.flags === right.flags;",
    "  if (left.valueOf !== Object.prototype.valueOf) return left.valueOf() === right.valueOf();",
    "  if (left.toString !== Object.prototype.toString) return left.toString() === right.toString();",
    "  const keys = Object.keys(left);",
    "  if (keys.length !== Object.keys(right).length) return false;",
    "  for (const key of keys) {",
    "    if (!Object.prototype.hasOwnProperty.call(right, key)) return false;",
    "  }",
    "  for (const key of keys) {",
    "    if (!__surveyJsonEqual(left[key], right[key])) return false;",
    "  }",
    "  return true;",
    "}",
    code,
    `const validatorsById = new Map([\n${entries.join(",\n")}\n]);`,
    "export function validateById(schemaId, value) {",
    "  const validator = validatorsById.get(schemaId);",
    "  if (!validator) return { valid: false, errors: [`unknown schema ${schemaId}`] };",
    "  const valid = validator(value);",
    "  return {",
    "    valid,",
    "    errors: valid ? [] : (validator.errors ?? []).map((error) => `${error.instancePath || \"/\"} ${error.message}`)",
    "  };",
    "}",
    ""
  ].join("\n");
}

function countLines(text) {
  return text.endsWith("\n") ? text.slice(0, -1).split("\n").length : text.split("\n").length;
}

function countWords(text) {
  return text.match(/\S+/g)?.length ?? 0;
}

function enforceBudget(recipe, target, bytes) {
  const text = bytes.toString("utf8");
  const lines = countLines(text);
  const words = countWords(text);
  if (lines > recipe.budget.maxLines || words > recipe.budget.maxWords) {
    fail(`${target} exceeds ${recipe.id} budget: ${lines}/${recipe.budget.maxLines} lines, ${words}/${recipe.budget.maxWords} words`);
  }
}

async function validateTestEvidence(packageManifest, ajv, requirements, memberPaths) {
  const manifest = await readJson(packageManifest.testEvidenceManifest);
  const validator = ajv.getSchema("urn:mission-kit:survey-v2:schema:test-evidence:v1");
  if (!validator(manifest)) fail(`test evidence manifest invalid: ${ajv.errorsText(validator.errors, { separator: "; " })}`);
  unique(manifest.tests.map((item) => item.id), "test evidence ID");
  unique(manifest.tests.map((item) => item.descriptorPath), "test descriptor path");
  const obligationIndex = new Map(
    requirements.requirements.flatMap((requirement) => (
      requirement.acceptanceObligations.map((obligation) => [
        obligation.id,
        {
          statement: obligation.statement,
          evidenceClasses: requirement.evidenceClasses
        }
      ])
    ))
  );
  const knownObligations = new Set(obligationIndex.keys());
  const claimedObligations = [];
  const executables = [];
  for (const entry of manifest.tests) {
    if (!memberPaths.has(entry.descriptorPath)) fail(`test descriptor is not an owned member: ${entry.descriptorPath}`);
    const descriptor = await readJson(entry.descriptorPath);
    if (!validator(descriptor)) fail(`${entry.descriptorPath} invalid: ${ajv.errorsText(validator.errors, { separator: "; " })}`);
    if (descriptor.id !== entry.id) fail(`${entry.descriptorPath} ID differs from manifest`);
    if (!knownObligations.has(descriptor.obligationId)) fail(`${descriptor.id} claims unknown obligation`);
    const obligation = obligationIndex.get(descriptor.obligationId);
    if (!obligation.evidenceClasses.includes(descriptor.evidenceClass)) {
      fail(`${descriptor.id} evidence class ${descriptor.evidenceClass} is not admitted by ${descriptor.obligationId}`);
    }
    if (!memberPaths.has(descriptor.executable)) fail(`${descriptor.id} executable is not an owned member`);
    const source = await readText(descriptor.executable);
    const topLevelTests = [...source.matchAll(/(?:^|\n)test\s*\(\s*"([^"\n]+)"\s*,/g)];
    if (topLevelTests.length !== 1) {
      fail(`${descriptor.executable} must contain exactly one literal-named top-level test(), got ${topLevelTests.length}`);
    }
    if (descriptor.behavior !== topLevelTests[0][1]) {
      fail(`${descriptor.id} behavior must exactly match its executable's one top-level test sentence`);
    }
    claimedObligations.push(descriptor.obligationId);
    executables.push(descriptor.executable);
  }
  unique(executables, "test executable");
  const claimedSet = new Set(claimedObligations);
  const missingObligations = [...knownObligations].filter((obligation) => !claimedSet.has(obligation));
  if (missingObligations.length > 0) {
    fail(`test obligation coverage is incomplete: ${missingObligations.sort(compareUtf8).join(", ")}`);
  }
}

async function ensureOwnedDirectory(directory) {
  const relative = path.relative(root, directory);
  if (relative.startsWith("..") || path.isAbsolute(relative)) fail(`output directory escapes root: ${directory}`);
  let current = root;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      await mkdir(current);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`output ancestor is unsafe: ${path.relative(root, current)}`);
  }
}

async function fsyncDirectory(directory) {
  const handle = await open(directory, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function publishOutputs(outputs) {
  const stageRelative = `.survey-v2-build-${randomUUID()}`;
  const stageRoot = ownedPath(stageRelative);
  await mkdir(stageRoot);
  try {
    for (const [relative, bytes] of [...outputs].sort(([left], [right]) => compareUtf8(left, right))) {
      const staged = path.join(stageRoot, ...relative.split("/"));
      await mkdir(path.dirname(staged), { recursive: true });
      const handle = await open(staged, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      try {
        await handle.writeFile(bytes);
        await handle.sync();
      } finally {
        await handle.close();
      }
      if (relative.startsWith("scripts/")) await chmod(staged, 0o755);
    }

    for (const [relative] of [...outputs].sort(([left], [right]) => compareUtf8(left, right))) {
      const target = ownedPath(relative);
      await ensureOwnedDirectory(path.dirname(target));
      const existing = await lstat(target).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (existing && (!existing.isFile() || existing.isSymbolicLink())) {
        fail(`generated target is not a regular no-follow file: ${relative}`);
      }
      const staged = path.join(stageRoot, ...relative.split("/"));
      await rename(staged, target);
      await fsyncDirectory(path.dirname(target));
    }
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
}

async function checkOutputs(outputs) {
  const dirty = [];
  for (const [relative, expected] of outputs) {
    let actual;
    try {
      actual = await readBytes(relative);
    } catch (error) {
      if (error.code === "ENOENT" || /registered member is missing/.test(error.message)) {
        dirty.push(relative);
        continue;
      }
      throw error;
    }
    if (!actual.equals(expected)) dirty.push(relative);
  }
  if (dirty.length > 0) fail(`generated projections are missing or dirty: ${dirty.sort(compareUtf8).join(", ")}`);
}

async function main() {
  const packageManifest = await readJson("survey-v2.package.json");
  const schemaPaths = packageManifest.schemas.map((entry) => entry.path);
  unique(packageManifest.schemas.map((entry) => entry.id), "schema ID");
  unique(schemaPaths, "schema path");
  const memberPaths = unique(packageManifest.members.map((entry) => entry.path), "package member path");
  if (!memberPaths.has("package-lock.json") || packageManifest.members.find((item) => item.path === "package-lock.json")?.kind !== "supply-lock") {
    fail("package-lock.json must be one registered supply-lock member");
  }

  const schemas = [];
  for (const schemaPath of schemaPaths) schemas.push(await readJson(schemaPath));
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    allowUnionTypes: true,
    validateFormats: false,
    code: { source: true, esm: true }
  });
  for (const schema of schemas) ajv.addSchema(schema);

  const packageValidator = ajv.getSchema("urn:mission-kit:survey-v2:schema:package:v1");
  if (!packageValidator(packageManifest)) {
    fail(`package manifest invalid: ${ajv.errorsText(packageValidator.errors, { separator: "; " })}`);
  }

  await validateInventory(packageManifest, { generatedMayBeMissing: mode === "build" });

  const canonicalJson = new Map();
  for (const member of packageManifest.members.filter((item) => item.kind === "authored" && item.path.endsWith(".json"))) {
    const value = await readJson(member.path);
    canonicalJson.set(member.path, value);
    if (member.expectedId) {
      const actual = value.$id ?? value.id;
      if (actual !== member.expectedId) fail(`${member.path} expected ID ${member.expectedId}, got ${actual}`);
    }
    if (hasOwn(value, "$schema") && value.$schema.startsWith("urn:mission-kit:survey-v2:schema:")) {
      const validator = ajv.getSchema(value.$schema);
      if (!validator) fail(`${member.path} names unknown schema ${value.$schema}`);
      if (!validator(value)) fail(`${member.path} invalid: ${ajv.errorsText(validator.errors, { separator: "; " })}`);
    }
  }

  const requirements = await readJson(packageManifest.requirementsRegistry);
  const requirementIds = requirements.requirements.map((item) => item.id);
  assertExactValues(requirementIds, Array.from({ length: 28 }, (_, index) => `R${String(index + 1).padStart(2, "0")}`), "requirement registry");
  const protocol = await readJson("source/protocol/survey.protocol.json");
  validateProtocol(protocol);

  const fragmentMembers = packageManifest.members.filter((member) => {
    const value = canonicalJson.get(member.path);
    return value?.$schema === "urn:mission-kit:survey-v2:schema:fragment:v1";
  });
  const fragments = fragmentMembers.map((member) => canonicalJson.get(member.path));
  for (const fragment of fragments) {
    if (!memberPaths.has(fragment.representation.payloadPath)) fail(`${fragment.id} payload is not registered`);
  }
  const knownSemanticIds = new Set(
    [...canonicalJson.values()].map((value) => value?.id).filter(Boolean)
  );
  const providers = validateComposition(fragments, requirements, knownSemanticIds);
  const fragmentById = new Map(fragments.map((fragment) => [fragment.id, fragment]));

  const projectionRecipes = [];
  for (const projectionPath of packageManifest.projections) {
    if (!memberPaths.has(projectionPath)) fail(`projection recipe is not registered: ${projectionPath}`);
    const recipe = await readJson(projectionPath);
    const validator = ajv.getSchema("urn:mission-kit:survey-v2:schema:projection:v1");
    if (!validator(recipe)) fail(`${projectionPath} invalid: ${ajv.errorsText(validator.errors, { separator: "; " })}`);
    projectionRecipes.push({ path: projectionPath, recipe });
  }
  unique(projectionRecipes.map(({ recipe }) => recipe.id), "projection ID");
  const targetOwners = new Map();
  for (const { path: projectionPath, recipe } of projectionRecipes) {
    for (const fragmentId of recipe.selection.fragmentIds) {
      if (!fragmentById.has(fragmentId)) fail(`${recipe.id} selects unknown fragment ${fragmentId}`);
    }
    for (const sourcePath of recipe.selection.sourcePaths ?? []) {
      const sourceMember = packageManifest.members.find((member) => member.path === sourcePath);
      if (!sourceMember || sourceMember.kind !== "authored") fail(`${recipe.id} selects noncanonical source ${sourcePath}`);
    }
    for (const target of recipe.targets) {
      ownedPath(target);
      if (targetOwners.has(target)) fail(`${target} has two projection owners`);
      targetOwners.set(target, { projectionPath, recipe });
    }
  }
  const generatedMembers = packageManifest.members.filter((member) => member.kind === "generated").map((member) => member.path);
  assertExactValues(targetOwners.keys(), generatedMembers, "generated target ownership");
  for (const target of targetOwners.keys()) {
    if (packageManifest.members.find((member) => member.path === target)?.kind !== "generated") {
      fail(`projection targets canonical member ${target}`);
    }
  }

  await validateTestEvidence(packageManifest, ajv, requirements, memberPaths);

  const mechanism = mechanismIndex(requirements, fragments);
  const dependencies = [
    {
      path: "source/dependencies/references/mission-kit-axioms.reference.json",
      value: await readJson("source/dependencies/references/mission-kit-axioms.reference.json")
    },
    {
      path: "source/dependencies/processes/axiom-applicability.process.json",
      value: await readJson("source/dependencies/processes/axiom-applicability.process.json")
    }
  ];
  const outputs = new Map();

  for (const { recipe } of projectionRecipes) {
    if (recipe.renderer === "build-metadata") continue;
    if (recipe.renderer === "skill-md") {
      outputs.set(recipe.targets[0], Buffer.from(await renderSkill(recipe, fragmentById), "utf8"));
    } else if (recipe.renderer === "references") {
      const rendered = await renderReferences(recipe, fragmentById, mechanismIndexMarkdown(mechanism));
      for (const [target, text] of rendered) outputs.set(target, Buffer.from(text, "utf8"));
    } else if (recipe.renderer === "diagrams") {
      const protocolFsm = renderProtocolFsm(protocol);
      const directorFlow = renderDirectorFlow(protocol);
      assertProtocolFsmParseback(protocolFsm, protocol);
      assertDirectorFlowParseback(directorFlow, protocol);
      outputs.set("references/protocol-fsm.md", Buffer.from(protocolFsm, "utf8"));
      outputs.set("references/director-flow.md", Buffer.from(directorFlow, "utf8"));
    } else if (recipe.renderer === "executables") {
      if ((recipe.selection.sourcePaths ?? []).length !== recipe.targets.length) fail(`${recipe.id} source/target arity differs`);
      for (let index = 0; index < recipe.targets.length; index += 1) {
        outputs.set(recipe.targets[index], await readBytes(recipe.selection.sourcePaths[index]));
      }
    } else if (recipe.renderer === "agent-metadata") {
      outputs.set(recipe.targets[0], Buffer.from([
        "interface:",
        "  display_name: \"Survey\"",
        "  short_description: \"Capture open intent into a ratified planning envelope\"",
        "  default_prompt: \"Use $survey to capture stakeholder intent before design.\"",
        ""
      ].join("\n"), "utf8"));
    } else if (recipe.renderer === "validators") {
      outputs.set(recipe.targets[0], Buffer.from(standaloneValidators(ajv, schemas), "utf8"));
    } else if (recipe.renderer === "indexes") {
      outputs.set("generated/dependency-index.json", Buffer.from(prettyJson(dependencyIndex(dependencies, fragments)), "utf8"));
      outputs.set("generated/mechanism-index.json", Buffer.from(prettyJson(mechanism), "utf8"));
    } else if (recipe.renderer === "assets") {
      outputs.set(recipe.targets[0], await readBytes(recipe.selection.sourcePaths[0]));
    } else {
      fail(`unknown projection renderer ${recipe.renderer}`);
    }
  }

  for (const [target, bytes] of outputs) {
    const owner = targetOwners.get(target);
    if (!owner) fail(`rendered target has no projection owner: ${target}`);
    enforceBudget(owner.recipe, target, bytes);
  }

  const canonicalDigests = [];
  for (const member of packageManifest.members.filter((item) => item.kind !== "generated")) {
    canonicalDigests.push({
      path: member.path,
      digest: sha256Bytes(await readBytes(member.path))
    });
  }
  canonicalDigests.sort((left, right) => compareUtf8(left.path, right.path));
  const projectedDigests = [...outputs]
    .map(([target, bytes]) => ({
      path: target,
      projectionId: targetOwners.get(target).recipe.id,
      digest: sha256Bytes(bytes)
    }))
    .sort((left, right) => compareUtf8(left.path, right.path));
  const lockTarget = projectionRecipes.find(({ recipe }) => recipe.renderer === "build-metadata").recipe.targets[0];
  const portableExclusions = [
    {
      path: "node_modules",
      class: "root-local-build-dependencies",
      rule: "excluded-from-owned-inventory-and-package-fold"
    },
    {
      path: "surveys",
      class: "mutable-runtime-sessions",
      rule: "excluded-from-owned-inventory-and-package-fold"
    },
    {
      path: ".git",
      class: "source-control-metadata",
      rule: "excluded-from-owned-inventory-and-package-fold"
    }
  ];
  const registeredInventory = packageManifest.members
    .map(({ path: memberPath, kind, expectedId = null }) => ({ path: memberPath, kind, expectedId }))
    .sort((left, right) => compareUtf8(left.path, right.path));
  const packageIdentity = {
    packageId: packageManifest.id,
    packageVersion: packageManifest.version,
    publicSkillName: packageManifest.publicSkillName,
    parentDesignSha256: packageManifest.parentDesignSha256,
    portableMode: "whole-sovereign-root",
    portableExclusions,
    registeredInventory,
    nongeneratedMemberDigests: canonicalDigests,
    generatedMemberDigests: projectedDigests,
    selfExcludedTarget: lockTarget
  };
  const lock = {
    id: "urn:mission-kit:survey-v2:projection-lock:survey-v2",
    schemaVersion: "1.0.0",
    parentDesignSha256: packageManifest.parentDesignSha256,
    canonicalDigests,
    projectedDigests,
    portableExclusions,
    registeredInventory,
    selfExcludedTarget: lockTarget,
    packageDigest: sha256Value(packageIdentity),
    aggregateDigest: sha256Value(packageIdentity)
  };
  outputs.set(lockTarget, Buffer.from(prettyJson(lock), "utf8"));
  enforceBudget(targetOwners.get(lockTarget).recipe, lockTarget, outputs.get(lockTarget));
  assertExactValues(outputs.keys(), targetOwners.keys(), "rendered projection targets");

  if (mode === "--check") {
    await checkOutputs(outputs);
  } else {
    await publishOutputs(outputs);
    await validateInventory(packageManifest, { generatedMayBeMissing: false });
  }

  process.stdout.write(`[survey-v2] ${mode === "--check" ? "check" : "build"} PASS\n`);
  process.stdout.write(`[survey-v2] ${schemas.length} schemas, ${fragments.length} fragments, ${providers.size} capabilities, 47+13 direct transitions, ${outputs.size} projections\n`);
  process.stdout.write(`[survey-v2] projection digest ${lock.aggregateDigest}\n`);
}

main().catch((error) => {
  process.stderr.write(`[survey-v2] FAIL: ${error.message}\n`);
  process.exit(1);
});
