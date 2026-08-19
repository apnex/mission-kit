---
kind: standing-context
schema: urn:mission-kit:schemas:standing-context:standing-context:v1alpha1
knowledge-base: https://github.com/apnex/mission-kit
forbids: []
required-sections: [Contract, External references, Enforcement]
max-bytes: 32768
---

# <workspace> - engineering system context

Standing context for any engineering agent working in this workspace, on any harness.\
This is the only always-on doctrine file here.\
Everything else is hydrated on a stated trigger.

Validate this document with `tools/check-standing-context.sh` from the knowledge base named above.

---

## 1. Contract

State the properties this document guarantees, so a reader can tell when it has been violated.\
The list below is the minimum; add to it, and do not remove from it without saying why.

- **Universal.** Every rule here applies to any agent in this workspace, whatever its role.
- **Harness-neutral.** No rule depends on a particular agent runtime.
- **Addressable.** Every external reference resolves from any working directory.
- **Checkable.** The mechanical properties are enforced by a script, not by prose.

---

## 2. External references - launchpads

Nothing outside this file is preloaded.\
Give every external body of knowledge a launchpad: where it is, what it holds, and the condition under which to open it.\
A topic is not a condition.\
"You are about to write a document another agent will read" is a condition, because an agent can evaluate it against what it is doing.

| Handle | Address | What it holds | Hydrate when |
| --- | --- | --- | --- |
| | | | |

Prefer an address that resolves from anywhere, such as a URL, over a path relative to one machine.

---

## 3. Enforcement

Prose does not enforce.\
Declare the contract in frontmatter and let the checker hold it:
```sh
tools/check-standing-context.sh /path/to/this/file
```

`forbids` names the couplings this workspace has ruled out.\
`required-sections` names the headings that must exist.\
`max-bytes` bounds a file that is read every turn.

If a rule elsewhere in this document ever becomes mechanically checkable, move the check into a script and leave only the name behind.
