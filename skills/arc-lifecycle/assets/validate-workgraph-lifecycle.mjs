#!/usr/bin/env node
// Validate the canonical WorkGraph lifecycle, skill-selection routes, templates, and bundle.
// Dependency-free: intended to run anywhere mission-kit can be checked out.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const DEFAULT_LIFECYCLE = path.join(HERE, 'workgraph-lifecycle-v1.json');
const DEFAULT_SELECTION = path.join(HERE, 'workgraph-skill-selection-v1.json');
const DEFAULT_BUNDLE = path.join(ROOT, 'bundles/workgraph-arc.yaml');

const EXPECTED_STAGE_ORDER = [
  'intent-open',
  'intent-captured',
  'planning',
  'design-sealed',
  'admission',
  'approved-for-go',
  'executing',
  'implementation-sealed',
  'source-delivered',
  'publication-qualified',
  'deployment-qualified',
  'live-qualified',
  'substrate-closing',
  'substrate-closed',
  'director-closing',
  'closed',
];

const EXPECTED_EVENTS = [
  'capture-intent',
  'begin-planning',
  'seal-design',
  'open-admission',
  'approve-for-go',
  'commence',
  'seal-implementation',
  'deliver-source',
  'qualify-publication',
  'qualify-deployment',
  'qualify-live',
  'begin-substrate-closeout',
  'close-substrate',
  'begin-director-closeout',
  'close-arc',
];

const REQUIRED_HARD_STOPS = [
  'constitution-unavailable-or-stale',
  'authority-missing-or-mismatched',
  'exact-binding-mismatch',
  'active-verifier-fail',
  'effect-gate-missing-or-invalid',
  'scope-or-constitutional-conflict',
  'protected-delivery-denied',
  'verifier-independence-invalid',
  'live-proof-used-forbidden-fallback',
  'driver-would-complete-before-child-or-closeout',
  'director-walkthrough-proof-unresolved',
];

const REQUIRED_INVARIANTS = [
  'evidence-derived-stage',
  'dependencies-are-not-authority',
  'exact-pre-effect-rehash',
  'immutable-fail-distinct-repair',
  'pause-revise-unpause',
  'no-give-up-recovery',
  'proof-layers-do-not-collapse',
  'stale-fyi-no-effect',
  'driver-last',
  'progressive-director-closeout',
  'append-only-terminal-correction',
];

const REQUIRED_SITUATIONS = [
  'open-intent-needs-stakeholder-shaping',
  'value-deferral-or-revival-question',
  'bounded-design-or-m7-question',
  'controller-or-commencement-question',
  'assigned-node-or-lease-question',
  'independent-pass-fail-gate-question',
  'branch-pr-merge-publish-deploy-question',
  'stuck-failed-paused-or-drifted-arc-question',
  'terminal-reconciliation-or-director-walkthrough-question',
];

const REQUIRED_BUNDLE_SKILLS = [
  'arc-lifecycle',
  'survey',
  'workgraph-arc-planning',
  'workgraph-arc-operator',
  'workgraph-arc-participant',
  'workgraph-verification-gates',
  'workgraph-pr-delivery',
  'workgraph-recovery',
  'workgraph-arc-closeout',
];

const REQUIRED_TEMPLATES = [
  'skills/arc-lifecycle/templates/lifecycle-checkpoint.md.tmpl',
  'skills/arc-lifecycle/templates/implementation-admission-envelope.md.tmpl',
  'skills/arc-lifecycle/templates/post-terminal-correction.md.tmpl',
  'skills/workgraph-arc-closeout/assets/closeout-packet-template.md',
];

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function uniqueIds(items, key, label, errors) {
  const seen = new Set();
  for (const item of items || []) {
    const id = item?.[key];
    if (!id) errors.push(`${label} entry missing ${key}`);
    else if (seen.has(id)) errors.push(`duplicate ${label} ${id}`);
    else seen.add(id);
  }
  return seen;
}

function includesAll(actual, expected) {
  const set = new Set(actual || []);
  return expected.every((item) => set.has(item));
}

function bundleSkills(text) {
  const after = text.split(/^skills:\s*$/m)[1] || '';
  return after.split('\n')
    .map((line) => line.match(/^\s*-\s*([a-z0-9-]+)/)?.[1])
    .filter(Boolean);
}

export function validateLifecycle(lifecycle, selection, options = {}) {
  const errors = [];
  const root = options.root || ROOT;
  const bundleText = options.bundleText ?? readFileSync(options.bundlePath || DEFAULT_BUNDLE, 'utf8');

  if (lifecycle.initialStage !== 'intent-open') errors.push('initialStage must be intent-open');
  if (lifecycle.terminalStage !== 'closed') errors.push('terminalStage must be closed');
  if (lifecycle.initialControlState !== 'running') errors.push('initialControlState must be running');

  const stageIds = uniqueIds(lifecycle.stages, 'id', 'stage', errors);
  if (!includesAll([...stageIds], EXPECTED_STAGE_ORDER)) {
    errors.push(`missing lifecycle stages: ${EXPECTED_STAGE_ORDER.filter((id) => !stageIds.has(id)).join(', ')}`);
  }
  const terminal = (lifecycle.stages || []).filter((s) => s.terminal);
  if (terminal.length !== 1 || terminal[0]?.id !== 'closed') errors.push('closed must be the only terminal stage');
  for (const stage of lifecycle.stages || []) {
    if (!stage.ownerSkill) errors.push(`stage ${stage.id} missing ownerSkill`);
    if (!Array.isArray(stage.entryEvidence) || !stage.entryEvidence.length) errors.push(`stage ${stage.id} missing entryEvidence`);
    if (!Array.isArray(stage.exitEvidence) || !stage.exitEvidence.length) errors.push(`stage ${stage.id} missing exitEvidence`);
  }

  const events = uniqueIds(lifecycle.transitions, 'event', 'transition event', errors);
  for (let i = 0; i < EXPECTED_EVENTS.length; i++) {
    const event = EXPECTED_EVENTS[i];
    const transition = (lifecycle.transitions || []).find((t) => t.event === event);
    if (!transition) {
      errors.push(`missing transition ${event}`);
      continue;
    }
    if (transition.from !== EXPECTED_STAGE_ORDER[i] || transition.to !== EXPECTED_STAGE_ORDER[i + 1]) {
      errors.push(`${event} must be ${EXPECTED_STAGE_ORDER[i]} -> ${EXPECTED_STAGE_ORDER[i + 1]}`);
    }
    if (!transition.authority?.length) errors.push(`${event} missing authority`);
    if (!transition.requires?.length) errors.push(`${event} missing requires`);
  }
  for (const transition of lifecycle.transitions || []) {
    if (!stageIds.has(transition.from)) errors.push(`${transition.event} has unknown from stage ${transition.from}`);
    if (!stageIds.has(transition.to)) errors.push(`${transition.event} has unknown to stage ${transition.to}`);
  }
  const correction = (lifecycle.transitions || []).find((t) => t.event === 'append-terminal-correction');
  if (!correction || correction.from !== 'closed' || correction.to !== 'closed') {
    errors.push('append-terminal-correction must be the only closed -> closed correction transition');
  } else if (!includesAll(correction.requires, ['append-only-correction-record', 'original-terminal-record-preserved'])) {
    errors.push('append-terminal-correction must require append-only record and original preservation');
  }
  const illegalTerminalTransitions = (lifecycle.transitions || []).filter((t) => t.from === 'closed' && t.event !== 'append-terminal-correction');
  if (illegalTerminalTransitions.length) errors.push('closed has a non-correction outgoing transition');

  const approve = (lifecycle.transitions || []).find((t) => t.event === 'approve-for-go');
  if (!includesAll(approve?.requires, [
    'active-valid-independent-blueprint-pass',
    'active-valid-independent-final-admission-pass',
    'fresh-constitution',
    'exact-authority-envelope',
  ])) errors.push('approve-for-go missing exact independent admission predicates');

  const commence = (lifecycle.transitions || []).find((t) => t.event === 'commence');
  if (!includesAll(commence?.requires, ['participant-local-exact-manifest-rehash', 'exact-once-blueprint-seed', 'controller-held-driver'])) {
    errors.push('commence missing rehash, exact-once seed, or controller-held driver predicate');
  }

  const closeSubstrate = (lifecycle.transitions || []).find((t) => t.event === 'close-substrate');
  if (!includesAll(closeSubstrate?.requires, ['active-valid-closeout-pass', 'closeout-workitem-done', 'driver-completed-last'])) {
    errors.push('close-substrate missing closeout PASS/workitem/driver-last predicates');
  }
  const closeArc = (lifecycle.transitions || []).find((t) => t.event === 'close-arc');
  if (!includesAll(closeArc?.requires, ['progressive-transcript-or-explicit-waiver-or-valid-not-applicable', 'decision-state', 'terminal-closeout-record'])) {
    errors.push('close-arc missing progressive walkthrough/waiver, decision state, or terminal record');
  }

  const hardStopIds = uniqueIds(lifecycle.hardStops, 'id', 'hard stop', errors);
  if (!includesAll([...hardStopIds], REQUIRED_HARD_STOPS)) {
    errors.push(`missing hard stops: ${REQUIRED_HARD_STOPS.filter((id) => !hardStopIds.has(id)).join(', ')}`);
  }
  for (const stop of lifecycle.hardStops || []) {
    if (!stop.blocks?.length) errors.push(`hard stop ${stop.id} missing blocked effects`);
    if (!stop.recovery) errors.push(`hard stop ${stop.id} missing recovery`);
  }

  const invariantIds = uniqueIds(lifecycle.invariants, 'id', 'invariant', errors);
  if (!includesAll([...invariantIds], REQUIRED_INVARIANTS)) {
    errors.push(`missing invariants: ${REQUIRED_INVARIANTS.filter((id) => !invariantIds.has(id)).join(', ')}`);
  }

  const controlStates = new Set(lifecycle.controlStates || []);
  if (!includesAll([...controlStates], ['running', 'hard-stopped', 'repairing', 'closed'])) errors.push('control states incomplete');
  const controlEvents = uniqueIds(lifecycle.controlTransitions, 'event', 'control transition', errors);
  if (!includesAll([...controlEvents], ['hard-stop', 'author-distinct-repair', 'admit-distinct-repair', 'terminalize-control'])) {
    errors.push('control transitions incomplete');
  }
  const repair = (lifecycle.controlTransitions || []).find((t) => t.event === 'author-distinct-repair');
  if (!includesAll(repair?.requires, ['distinct-repair-id', 'original-polarity-preserved'])) errors.push('repair must be distinct and preserve polarity');
  const admitRepair = (lifecycle.controlTransitions || []).find((t) => t.event === 'admit-distinct-repair');
  if (!includesAll(admitRepair?.requires, ['active-valid-independent-repair-pass', 'original-polarity-preserved'])) errors.push('repair admission missing independent PASS or polarity preservation');

  const proofIds = uniqueIds(lifecycle.proofLadder, 'id', 'proof layer', errors);
  if (!includesAll([...proofIds], ['local', 'commit', 'pr-open', 'reviewed', 'ci-green', 'merged', 'published', 'deployed', 'live-observed', 'verifier-attested'])) {
    errors.push('proof ladder missing required distinct layers');
  }
  const deployed = (lifecycle.proofLadder || []).find((p) => p.id === 'deployed');
  if (!deployed?.doesNotProve?.includes('live')) errors.push('deployed layer must explicitly not prove live');

  const routeStages = uniqueIds(selection.stageRoutes, 'stage', 'stage route', errors);
  for (const stage of stageIds) {
    const routes = (selection.stageRoutes || []).filter((r) => r.stage === stage);
    if (routes.length !== 1) errors.push(`stage ${stage} must have exactly one selection route`);
    else {
      const owner = (lifecycle.stages || []).find((s) => s.id === stage)?.ownerSkill;
      if (routes[0].primary !== owner) errors.push(`stage ${stage} route primary ${routes[0].primary} != ownerSkill ${owner}`);
    }
  }
  for (const stage of routeStages) if (!stageIds.has(stage)) errors.push(`selection route has unknown stage ${stage}`);

  const situationIds = uniqueIds(selection.situationRoutes, 'id', 'situation route', errors);
  if (!includesAll([...situationIds], REQUIRED_SITUATIONS)) {
    errors.push(`missing situation routes: ${REQUIRED_SITUATIONS.filter((id) => !situationIds.has(id)).join(', ')}`);
  }

  const selectedSkills = new Set();
  for (const route of selection.stageRoutes || []) {
    if (route.primary) selectedSkills.add(route.primary);
    for (const skill of route.supporting || []) selectedSkills.add(skill);
  }
  for (const route of selection.situationRoutes || []) if (route.primary) selectedSkills.add(route.primary);
  if (selection.hardStopRoute?.primary) selectedSkills.add(selection.hardStopRoute.primary);
  for (const skill of selection.hardStopRoute?.supporting || []) selectedSkills.add(skill);
  for (const skill of selectedSkills) {
    const skillPath = path.join(root, 'skills', skill, 'SKILL.md');
    if (!existsSync(skillPath)) {
      errors.push(`selection route references missing skill ${skill}`);
      continue;
    }
    const text = readFileSync(skillPath, 'utf8');
    if (/scaffold stub|Status:\*\* scaffold/i.test(text)) errors.push(`selected skill ${skill} is still a scaffold stub`);
  }

  const bundled = new Set(bundleSkills(bundleText));
  if (!includesAll([...bundled], REQUIRED_BUNDLE_SKILLS)) {
    errors.push(`workgraph-arc bundle missing: ${REQUIRED_BUNDLE_SKILLS.filter((id) => !bundled.has(id)).join(', ')}`);
  }
  for (const skill of selectedSkills) if (!bundled.has(skill)) errors.push(`selected skill ${skill} is absent from workgraph-arc bundle`);

  for (const rel of REQUIRED_TEMPLATES) if (!existsSync(path.join(root, rel))) errors.push(`missing lifecycle template ${rel}`);

  return errors;
}

export function loadCanonical() {
  return {
    lifecycle: readJson(DEFAULT_LIFECYCLE),
    selection: readJson(DEFAULT_SELECTION),
  };
}

function main() {
  const { lifecycle, selection } = loadCanonical();
  const errors = validateLifecycle(lifecycle, selection);
  if (errors.length) {
    for (const error of errors) console.error(`FAIL ${error}`);
    console.error(`\n${errors.length} lifecycle validation error(s).`);
    process.exit(1);
  }
  console.log(`PASS WorkGraph lifecycle validation: ${lifecycle.stages.length} stages, ${lifecycle.transitions.length} transitions, ${lifecycle.hardStops.length} hard stops, ${selection.situationRoutes.length} situation routes.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
