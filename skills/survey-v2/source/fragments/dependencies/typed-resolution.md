Accept external Git knowledge only through a schema-valid dependency whose
source contains repository name and whose selector is a normalized
repository-relative POSIX subdirectory. Reject URLs, commits, SHAs, revisions,
branches, tags, trees, expected content digests, absolute paths, traversal,
backslashes, symlinks and special files.

Resolve the declared repository through exactly one explicit host-registry
binding. Never infer it from current working directory, package location,
basename, Git-root discovery, or sibling layout. Treat the machine path as
operational resolver context, not semantic input or generated content.

At T41 enumerate and read the selector twice under no-follow containment,
compare complete sorted path/type/byte inventories, enforce declared budgets,
and atomically store the complete first-pass bytes and digests in the session.
Use those bytes for every later hook and cold resume. Repository drift after
T41 has no effect on the current run.
