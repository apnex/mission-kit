#!/usr/bin/env node
// Validate the reusable WorkGraph planning blueprint template.
// Dependency-free and intentionally structural: catches missing start-gates,
// missing driver completion gates, and happy-path-only validation drift.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLUEPRINT = path.join(HERE, 'planning-blueprint-template.json');

const REQUIRED_NODES = [
  'target_space_mapping',
  'friction_intake',
  'value_unlock_triage',
  'scope_fence',
  'axiom_alignment_audit',
  'current_state_inventory',
  'failure_mode_audit',
  'design_options',
  'feasibility_sketch',
  'design_gate',
  'final_design_packet',
  'planning_closeout',
  'driver',
];

const REQUIRED_DEPENDS_ON = {
  friction_intake: ['target_space_mapping'],
  value_unlock_triage: ['target_space_mapping', 'friction_intake'],
  scope_fence: ['value_unlock_triage'],
  axiom_alignment_audit: ['scope_fence'],
  current_state_inventory: ['scope_fence'],
  failure_mode_audit: ['scope_fence'],
  design_options: ['scope_fence', 'axiom_alignment_audit', 'current_state_inventory', 'failure_mode_audit'],
  feasibility_sketch: ['design_options', 'current_state_inventory'],
  design_gate: ['design_options', 'feasibility_sketch', 'failure_mode_audit', 'axiom_alignment_audit'],
  final_design_packet: ['design_gate', 'design_options', 'feasibility_sketch', 'axiom_alignment_audit'],
  planning_closeout: ['final_design_packet'],
};

const DRIVER_CHILDREN = REQUIRED_NODES.filter((id) => id !== 'driver');

function loadBlueprint() {
  const parsed = JSON.parse(readFileSync(BLUEPRINT, 'utf8'));
  if (!parsed || !Array.isArray(parsed.nodes)) throw new Error('blueprint must contain nodes[]');
  return parsed;
}

function indexNodes(nodes) {
  const byId = new Map();
  for (const node of nodes) {
    if (!node.localId) throw new Error('node without localId');
    if (byId.has(node.localId)) throw new Error(`duplicate localId ${node.localId}`);
    byId.set(node.localId, node);
  }
  return byId;
}

function containsAll(actual, required) {
  const set = new Set(actual || []);
  return required.every((id) => set.has(id));
}

function validate(parsed) {
  const errors = [];
  const nodes = parsed.nodes || [];
  const byId = indexNodes(nodes);

  for (const id of REQUIRED_NODES) {
    if (!byId.has(id)) errors.push(`missing node ${id}`);
  }

  for (const [id, deps] of Object.entries(REQUIRED_DEPENDS_ON)) {
    const actual = byId.get(id)?.dependsOn || [];
    if (!containsAll(actual, deps)) {
      errors.push(`${id} dependsOn missing ${deps.filter((dep) => !actual.includes(dep)).join(', ')}`);
    }
  }

  const driver = byId.get('driver');
  const gated = driver?.completionDependsOn || [];
  if (!driver) {
    errors.push('missing driver');
  } else if (!containsAll(gated, DRIVER_CHILDREN)) {
    errors.push(`driver completionDependsOn missing ${DRIVER_CHILDREN.filter((id) => !gated.includes(id)).join(', ')}`);
  }

  const scopeFenceRunbook = byId.get('scope_fence')?.runbook || '';
  if (!scopeFenceRunbook.includes('scopeRole')) {
    errors.push('scope_fence runbook missing scopeRole classification for linked Bugs/Ideas');
  }

  const axiomRunbook = byId.get('axiom_alignment_audit')?.runbook || '';
  if (!axiomRunbook.includes('get_constitution/get_axiom')) {
    errors.push('axiom_alignment_audit runbook missing get_constitution/get_axiom provenance');
  }
  if (!axiomRunbook.includes('A0-A14')) {
    errors.push('axiom_alignment_audit runbook missing A0-A14 direct mapping scope');
  }
  if (!axiomRunbook.includes('not-required rationale')) {
    errors.push('axiom_alignment_audit runbook missing explicit not-required rationale fallback');
  }

  const finalDesignRunbook = byId.get('final_design_packet')?.runbook || '';
  if (!finalDesignRunbook.includes('direct axiom alignment')) {
    errors.push('final_design_packet runbook missing direct axiom alignment');
  }
  if (!finalDesignRunbook.includes('entityRealizationPlan')) {
    errors.push('final_design_packet runbook missing entityRealizationPlan');
  }
  if (!finalDesignRunbook.includes('disposition gates')) {
    errors.push('final_design_packet runbook missing disposition gates');
  }

  const frictionRunbook = byId.get('friction_intake')?.runbook || '';
  if (!frictionRunbook.includes('included, companion, deferred, no-action, or separate-arc')) {
    errors.push('friction_intake runbook missing explicit disposition taxonomy');
  }

  const designGate = byId.get('design_gate');
  const designGateRunbook = designGate?.runbook || '';
  if (!designGateRunbook.includes('M7')) {
    errors.push('design_gate runbook missing direct M7/axiom evidence check');
  }
  if (!designGateRunbook.includes('entityRealizationPlan/disposition gates')) {
    errors.push('design_gate runbook missing entityRealizationPlan/disposition gates check');
  }
  if (!designGateRunbook.includes('VERIFIER must not claim')) {
    errors.push('design_gate runbook missing non-claiming verifier rule');
  }
  if (!designGateRunbook.includes('FAIL is immutable') || !designGateRunbook.includes('distinct repair')) {
    errors.push('design_gate runbook missing immutable FAIL/distinct repair rule');
  }
  if (JSON.stringify(designGate?.roleEligibility || []) !== JSON.stringify(['architect'])) {
    errors.push('design_gate must be mechanically driven by architect, not claimed by verifier');
  }
  const seal = (designGate?.evidenceRequirements || []).find((req) => req.id === 'design_seal');
  if (!seal || seal.kind !== 'review' || seal.evidenceAuthority !== 'verifier-attestation') {
    errors.push('design_gate missing design_seal verifier-attestation requirement');
  }
  for (const id of ['design_candidate', 'design_binding', 'planning_evidence_matrix']) {
    if (!(designGate?.evidenceRequirements || []).some((req) => req.id === id)) {
      errors.push(`design_gate missing staged evidence requirement ${id}`);
    }
  }

  const closeoutRunbook = byId.get('planning_closeout')?.runbook || '';
  if (!closeoutRunbook.includes('direct axiom alignment')) {
    errors.push('planning_closeout runbook missing direct axiom alignment');
  }
  if (!closeoutRunbook.includes('entityDispositionLedger')) {
    errors.push('planning_closeout runbook missing entityDispositionLedger');
  }
  if (!closeoutRunbook.includes('fully-in-scope')) {
    errors.push('planning_closeout runbook missing fully-in-scope entity disposition coverage');
  }

  for (const node of nodes) {
    for (const dep of node.dependsOn || []) {
      if (!byId.has(dep)) errors.push(`${node.localId} has dangling dependsOn ${dep}`);
      if (dep === node.localId) errors.push(`${node.localId} depends on itself`);
    }
    for (const dep of node.completionDependsOn || []) {
      if (!byId.has(dep)) errors.push(`${node.localId} has dangling completionDependsOn ${dep}`);
      if (dep === node.localId) errors.push(`${node.localId} completion-depends on itself`);
    }
  }

  return errors;
}

function clone(parsed) {
  return JSON.parse(JSON.stringify(parsed));
}

function requireNegativeCheck(name, mutate, expectedSubstring) {
  const broken = clone(loadBlueprint());
  mutate(indexNodes(broken.nodes));
  const errors = validate(broken);
  if (!errors.some((err) => err.includes(expectedSubstring))) {
    throw new Error(`negative check ${name} failed to catch '${expectedSubstring}'. Errors: ${errors.join('; ') || '<none>'}`);
  }
}

const parsed = loadBlueprint();
const errors = validate(parsed);
if (errors.length) {
  for (const err of errors) console.error(`FAIL ${err}`);
  process.exit(1);
}

// Negative/structural checks — not just happy path.
requireNegativeCheck(
  'triage_missing_friction_intake',
  (byId) => { byId.get('value_unlock_triage').dependsOn = byId.get('value_unlock_triage').dependsOn.filter((id) => id !== 'friction_intake'); },
  'value_unlock_triage dependsOn missing friction_intake',
);
requireNegativeCheck(
  'design_gate_before_feasibility',
  (byId) => { byId.get('design_gate').dependsOn = byId.get('design_gate').dependsOn.filter((id) => id !== 'feasibility_sketch'); },
  'design_gate dependsOn missing feasibility_sketch',
);
requireNegativeCheck(
  'final_design_before_design_gate',
  (byId) => { byId.get('final_design_packet').dependsOn = byId.get('final_design_packet').dependsOn.filter((id) => id !== 'design_gate'); },
  'final_design_packet dependsOn missing design_gate',
);
requireNegativeCheck(
  'design_options_missing_axiom_alignment',
  (byId) => { byId.get('design_options').dependsOn = byId.get('design_options').dependsOn.filter((id) => id !== 'axiom_alignment_audit'); },
  'design_options dependsOn missing axiom_alignment_audit',
);
requireNegativeCheck(
  'driver_missing_closeout_gate',
  (byId) => { byId.get('driver').completionDependsOn = byId.get('driver').completionDependsOn.filter((id) => id !== 'planning_closeout'); },
  'driver completionDependsOn missing planning_closeout',
);
requireNegativeCheck(
  'axiom_audit_missing_direct_corpus',
  (byId) => { byId.get('axiom_alignment_audit').runbook = byId.get('axiom_alignment_audit').runbook.replace('A0-A14', 'principles'); },
  'axiom_alignment_audit runbook missing A0-A14 direct mapping scope',
);
requireNegativeCheck(
  'final_design_missing_entity_realization_plan',
  (byId) => { byId.get('final_design_packet').runbook = byId.get('final_design_packet').runbook.replace('entityRealizationPlan', 'entity plan'); },
  'final_design_packet runbook missing entityRealizationPlan',
);
requireNegativeCheck(
  'planning_closeout_missing_entity_disposition_ledger',
  (byId) => { byId.get('planning_closeout').runbook = byId.get('planning_closeout').runbook.replace('entityDispositionLedger', 'entity ledger'); },
  'planning_closeout runbook missing entityDispositionLedger',
);
requireNegativeCheck(
  'design_gate_claimable_by_verifier',
  (byId) => { byId.get('design_gate').roleEligibility = ['verifier']; },
  'design_gate must be mechanically driven by architect',
);
requireNegativeCheck(
  'design_gate_missing_verifier_attestation',
  (byId) => { byId.get('design_gate').evidenceRequirements.find((req) => req.id === 'design_seal').evidenceAuthority = 'executor-evidence'; },
  'design_gate missing design_seal verifier-attestation requirement',
);

const dependencyAssertionCount = Object.values(REQUIRED_DEPENDS_ON).length;
console.log(`PASS planning blueprint validation: ${REQUIRED_NODES.length} nodes, ${dependencyAssertionCount} dependency assertions, driver gates ${DRIVER_CHILDREN.length} children, negative checks caught 10 broken variants.`);
