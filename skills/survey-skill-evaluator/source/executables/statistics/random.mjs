import { hashCanonical } from "../engine/hash.mjs";
import { ValidationError } from "../engine/errors.mjs";
import {
  stabilizeJson,
  stabilizeTrustedCallbackConfig,
} from "./input-boundary.mjs";

const MASK_64 = (1n << 64n) - 1n;
const TWO_POW_53 = 2 ** 53;

function seedToUint64(seed) {
  const digest = hashCanonical("statistics-seed/v1", { seed });
  return BigInt(`0x${digest.slice(0, 16)}`);
}

/**
 * A deterministic SplitMix64 generator. It is deliberately small and
 * reproducible; it is experimental entropy, not a cryptographic capability.
 */
export function createDeterministicRng(seed) {
  seed = stabilizeJson(seed);
  let state = seedToUint64(seed);

  function nextUint64() {
    state = (state + 0x9e3779b97f4a7c15n) & MASK_64;
    let value = state;
    value = ((value ^ (value >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK_64;
    value = ((value ^ (value >> 27n)) * 0x94d049bb133111ebn) & MASK_64;
    return (value ^ (value >> 31n)) & MASK_64;
  }

  return Object.freeze({
    nextUint64,
    next() {
      return Number(nextUint64() >> 11n) / TWO_POW_53;
    },
    integer(maxExclusive) {
      if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
        throw new ValidationError(
          "Random integer bound must be a positive safe integer",
          { maxExclusive },
        );
      }
      const bound = BigInt(maxExclusive);
      const range = 1n << 64n;
      const limit = range - (range % bound);
      let draw;
      do {
        draw = nextUint64();
      } while (draw >= limit);
      return Number(draw % bound);
    },
  });
}

export function deterministicShuffle(values, rng) {
  values = stabilizeJson(values);
  const trustedRng = stabilizeTrustedCallbackConfig(
    rng,
    ["nextUint64", "next", "integer"],
    "Deterministic RNG",
    ["integer"],
  );
  rng = trustedRng.callbacks;
  if (!Array.isArray(values)) {
    throw new ValidationError("Shuffle requires an array and deterministic RNG");
  }
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = rng.integer(index + 1);
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}
