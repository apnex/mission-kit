function numbered(prefix, mutationPrefix, count) {
  return Array.from({ length: count }, (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return `${prefix}${suffix}/${mutationPrefix}${suffix}`;
  });
}

export const HANDLER_SURFACE = Object.freeze({
  phase: Object.freeze([...numbered("A", "M", 47), "AF01/MF01", "AF02/MF02"].sort()),
  runtime: Object.freeze([...numbered("RA", "RM", 13), "RAF01/RMF01"].sort())
});

export function assertHandlerSurface(actual) {
  for (const machine of ["phase", "runtime"]) {
    const normalized = [...actual[machine]].sort();
    if (JSON.stringify(normalized) !== JSON.stringify(HANDLER_SURFACE[machine])) {
      throw new Error(`${machine} handler registry differs from the declared handler surface`);
    }
  }
}
