#!/usr/bin/env node
// Behavioral/negative conformance tests for the canonical WorkGraph lifecycle.

import { loadCanonical, validateLifecycle } from './validate-workgraph-lifecycle.mjs';

let passed = 0;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectValid(label, lifecycle, selection) {
  const errors = validateLifecycle(lifecycle, selection);
  if (errors.length) throw new Error(`${label}: expected valid, got: ${errors.join('; ')}`);
  console.log(`PASS ${label}`);
  passed++;
}

function expectInvalid(label, mutate, expected) {
  const canonical = loadCanonical();
  const lifecycle = clone(canonical.lifecycle);
  const selection = clone(canonical.selection);
  mutate(lifecycle, selection);
  const errors = validateLifecycle(lifecycle, selection);
  if (!errors.some((error) => error.includes(expected))) {
    throw new Error(`${label}: expected error containing '${expected}', got: ${errors.join('; ') || '<none>'}`);
  }
  console.log(`PASS ${label} -> rejected (${expected})`);
  passed++;
}

const canonical = loadCanonical();
expectValid('canonical lifecycle and selection bundle', canonical.lifecycle, canonical.selection);

expectInvalid(
  'constitution-stale hard stop cannot disappear',
  (lifecycle) => { lifecycle.hardStops = lifecycle.hardStops.filter((stop) => stop.id !== 'constitution-unavailable-or-stale'); },
  'missing hard stops: constitution-unavailable-or-stale',
);

expectInvalid(
  'dependencies cannot replace exact final admission',
  (lifecycle) => {
    const transition = lifecycle.transitions.find((item) => item.event === 'approve-for-go');
    transition.requires = transition.requires.filter((item) => item !== 'active-valid-independent-final-admission-pass');
    transition.requires.push('dependency-done');
  },
  'approve-for-go missing exact independent admission predicates',
);

expectInvalid(
  'commencement cannot skip participant-local exact rehash',
  (lifecycle) => {
    const transition = lifecycle.transitions.find((item) => item.event === 'commence');
    transition.requires = transition.requires.filter((item) => item !== 'participant-local-exact-manifest-rehash');
  },
  'commence missing rehash',
);

expectInvalid(
  'failed gate repair cannot reuse polarity or identity',
  (lifecycle) => {
    const transition = lifecycle.controlTransitions.find((item) => item.event === 'author-distinct-repair');
    transition.requires = ['reuse-failed-gate'];
  },
  'repair must be distinct and preserve polarity',
);

expectInvalid(
  'driver cannot close before closeout and children',
  (lifecycle) => {
    const transition = lifecycle.transitions.find((item) => item.event === 'close-substrate');
    transition.requires = transition.requires.filter((item) => item !== 'driver-completed-last');
  },
  'close-substrate missing closeout PASS/workitem/driver-last predicates',
);

expectInvalid(
  'stale FYI discipline is load-bearing',
  (lifecycle) => { lifecycle.invariants = lifecycle.invariants.filter((item) => item.id !== 'stale-fyi-no-effect'); },
  'missing invariants: stale-fyi-no-effect',
);

expectInvalid(
  'progressive Director walkthrough cannot collapse to packet dump',
  (lifecycle) => {
    const transition = lifecycle.transitions.find((item) => item.event === 'close-arc');
    transition.requires = transition.requires.filter((item) => item !== 'progressive-transcript-or-explicit-waiver-or-valid-not-applicable');
  },
  'close-arc missing progressive walkthrough/waiver',
);

expectInvalid(
  'pause-revise-unpause is the only semantic correction path',
  (lifecycle) => { lifecycle.invariants = lifecycle.invariants.filter((item) => item.id !== 'pause-revise-unpause'); },
  'missing invariants: pause-revise-unpause',
);

expectInvalid(
  'routine failures require no-give-up recovery',
  (lifecycle) => { lifecycle.invariants = lifecycle.invariants.filter((item) => item.id !== 'no-give-up-recovery'); },
  'missing invariants: no-give-up-recovery',
);

expectInvalid(
  'post-terminal correction must preserve original terminal record',
  (lifecycle) => {
    const transition = lifecycle.transitions.find((item) => item.event === 'append-terminal-correction');
    transition.requires = ['overwrite-terminal-record'];
  },
  'append-terminal-correction must require append-only record and original preservation',
);

expectInvalid(
  'deployment proof cannot imply live proof',
  (lifecycle) => {
    lifecycle.proofLadder.find((item) => item.id === 'deployed').doesNotProve = [];
  },
  'deployed layer must explicitly not prove live',
);

expectInvalid(
  'every lifecycle stage has one primary skill',
  (_lifecycle, selection) => { selection.stageRoutes = selection.stageRoutes.filter((route) => route.stage !== 'admission'); },
  'stage admission must have exactly one selection route',
);

expectInvalid(
  'assigned node always routes to participant guidance',
  (_lifecycle, selection) => { selection.situationRoutes = selection.situationRoutes.filter((route) => route.id !== 'assigned-node-or-lease-question'); },
  'missing situation routes: assigned-node-or-lease-question',
);

expectInvalid(
  'hard-stop recovery route must be bundled',
  (_lifecycle, selection) => { selection.hardStopRoute.primary = 'missing-recovery-skill'; },
  'selection route references missing skill missing-recovery-skill',
);

console.log(`\nPASS lifecycle conformance: ${passed} scenarios (canonical + negative hard-stop/authority/repair/driver/stale-FYI/walkthrough/correction/delivery/selection checks).`);
