/**
 * Möbius transforms as (a z + b) / (c z + d), stored as four complexes.
 *
 * Safety order:
 *   1. check / project pole outside |z| <= Rmax  (|c| Rmax < |d|)
 *   2. only then normalize by dividing through by d  (d' === 1)
 *
 * With d = 1, a and b are rotation/scale + translation when c ≈ 0; c is bend.
 */

import {
  C, cAdd, cSub, cMul, cDiv, cScale, cAbs, cAbs2, cNorm, cEq, cFromXY,
} from "./complex.js";

export function identityMobius() {
  return { a: C(1, 0), b: C(0, 0), c: C(0, 0), d: C(1, 0) };
}

export function detMobius(m) {
  return cSub(cMul(m.a, m.d), cMul(m.b, m.c));
}

/**
 * Keep the pole outside the disk |z| <= Rmax:
 *   |c| * Rmax < |d|   (with a small epsilon).
 * Does NOT divide by d yet — call normalizeByD after.
 */
export function projectPoleOutside(m, Rmax, eps = 1e-4) {
  const absC = cAbs(m.c);
  const absD = cAbs(m.d);
  const limit = Math.max(Rmax, 1e-9);

  // Already safe (strict with eps)
  if (absC * limit <= absD * (1 - eps)) {
    return m;
  }

  // Need |d| > 0 to place the pole at all
  if (absD < 1e-15) {
    // Purely singular denominator direction — fall back to no bend
    return { a: m.a, b: m.b, c: C(0, 0), d: C(1, 0) };
  }

  // Shrink c so |c| * Rmax = |d| * (1 - eps)
  const targetAbsC = (absD * (1 - eps)) / limit;
  const scale = targetAbsC / absC;
  return {
    a: m.a,
    b: m.b,
    c: cScale(m.c, scale),
    d: m.d,
  };
}

/** Divide through by d so d' = 1. Requires d ≠ 0 (guard ensures that). */
export function normalizeByD(m) {
  const absD = cAbs(m.d);
  if (absD < 1e-15) {
    return identityMobius();
  }
  return {
    a: cDiv(m.a, m.d),
    b: cDiv(m.b, m.d),
    c: cDiv(m.c, m.d),
    d: C(1, 0),
  };
}

/**
 * Full pipeline: det check → pole project → d = 1.
 * Rmax = max |z| we care about (e.g. farthest grid corner).
 */
export function guardAndNormalize(m, Rmax, eps = 1e-4) {
  if (cAbs(detMobius(m)) < 1e-15) {
    return identityMobius();
  }
  return normalizeByD(projectPoleOutside(m, Rmax, eps));
}

/** @deprecated old name — prefer guardAndNormalize when Rmax is known */
export function normalizeMobius(m) {
  // Scale-invariant fallback without pole knowledge: unit denominator coeffs, then d=1 if possible
  const s = Math.sqrt(cAbs2(m.c) + cAbs2(m.d));
  if (!(s > 0)) return identityMobius();
  const inv = 1 / s;
  const scaled = {
    a: cScale(m.a, inv),
    b: cScale(m.b, inv),
    c: cScale(m.c, inv),
    d: cScale(m.d, inv),
  };
  if (cAbs(scaled.d) < 1e-15) return identityMobius();
  return normalizeByD(scaled);
}

export function applyMobius(m, z) {
  return cDiv(cAdd(cMul(m.a, z), m.b), cAdd(cMul(m.c, z), m.d));
}

/** Derivative T'(z) = (ad - bc) / (c z + d)^2 */
export function dMobius(m, z) {
  const den = cAdd(cMul(m.c, z), m.d);
  return cDiv(detMobius(m), cMul(den, den));
}

/** Raw matrix product (G ∘ M)(z) = G(M(z)). No normalize — caller guards. */
export function composeMobiusRaw(G, M) {
  return {
    a: cAdd(cMul(G.a, M.a), cMul(G.b, M.c)),
    b: cAdd(cMul(G.a, M.b), cMul(G.b, M.d)),
    c: cAdd(cMul(G.c, M.a), cMul(G.d, M.c)),
    d: cAdd(cMul(G.c, M.b), cMul(G.d, M.d)),
  };
}

/** Compose then guard with Rmax. If Rmax omitted, use soft normalizeByD only. */
export function composeMobius(G, M, Rmax = null) {
  const product = composeMobiusRaw(G, M);
  if (Rmax != null && Rmax > 0) {
    return guardAndNormalize(product, Rmax);
  }
  if (cAbs(detMobius(product)) < 1e-15) return identityMobius();
  if (cAbs(product.d) < 1e-15) return normalizeMobius(product);
  return normalizeByD(product);
}

export function translationMobius(beta) {
  return { a: C(1, 0), b: C(beta), c: C(0, 0), d: C(1, 0) };
}

/** Similarity G(z) = α z + β */
export function similarityMobius(alpha, beta) {
  return { a: C(alpha), b: C(beta), c: C(0, 0), d: C(1, 0) };
}

/**
 * Unique Möbius sending z1→w1, z2→w2, z3→w3 (all distinct).
 * Uses the cross-ratio construction. Optional Rmax to guard the result.
 */
export function mobiusFromThreePairs(z1, w1, z2, w2, z3, w3, Rmax = null) {
  const S = mobiusSendingTo01Inf(z1, z2, z3);
  const T = mobiusSendingTo01Inf(w1, w2, w3);
  const Tinv = invertMobiusRaw(T);
  const product = composeMobiusRaw(Tinv, S);
  if (Rmax != null && Rmax > 0) return guardAndNormalize(product, Rmax);
  if (cAbs(product.d) < 1e-15) return normalizeMobius(product);
  return normalizeByD(product);
}

function mobiusSendingTo01Inf(z1, z2, z3) {
  // ((z-z1)/(z-z3)) * ((z2-z3)/(z2-z1))
  const z2mz3 = cSub(z2, z3);
  const z2mz1 = cSub(z2, z1);
  return {
    a: z2mz3,
    b: cScale(cMul(z1, z2mz3), -1),
    c: z2mz1,
    d: cScale(cMul(z3, z2mz1), -1),
  };
}

function invertMobiusRaw(m) {
  const det = detMobius(m);
  return {
    a: cDiv(m.d, det),
    b: cDiv(cScale(m.b, -1), det),
    c: cDiv(cScale(m.c, -1), det),
    d: cDiv(m.a, det),
  };
}

export function invertMobius(m, Rmax = null) {
  const inv = invertMobiusRaw(m);
  if (Rmax != null && Rmax > 0) return guardAndNormalize(inv, Rmax);
  if (cAbs(inv.d) < 1e-15) return normalizeMobius(inv);
  return normalizeByD(inv);
}

const EPS = 1e-8;

/**
 * Build incremental G from gesture anchors.
 * starts/currents are parallel arrays of complex points (plane space).
 */
export function gestureMobius(starts, currents, eps = EPS, Rmax = null) {
  const n = Math.min(starts.length, currents.length);
  if (n < 1) return identityMobius();

  const pairs = [];
  for (let i = 0; i < n; i++) {
    if (pairs.some((pr) => cEq(pr.z, starts[i], eps))) continue;
    pairs.push({ z: starts[i], w: currents[i] });
  }

  if (pairs.length === 0) return identityMobius();

  if (pairs.length === 1) {
    return translationMobius(cSub(pairs[0].w, pairs[0].z));
  }

  if (pairs.length === 2) {
    const { z: z1, w: w1 } = pairs[0];
    const { z: z2, w: w2 } = pairs[1];
    const dz = cSub(z2, z1);
    const dw = cSub(w2, w1);
    if (cAbs(dz) < eps) return translationMobius(cSub(w1, z1));
    const alpha = cDiv(dw, dz);
    const beta = cSub(w1, cMul(alpha, z1));
    return similarityMobius(alpha, beta);
  }

  const [p0, p1, p2] = pairs;
  if (cEq(p0.w, p1.w, eps) || cEq(p0.w, p2.w, eps) || cEq(p1.w, p2.w, eps)) {
    return gestureMobius([p0.z, p1.z], [p0.w, p1.w], eps, Rmax);
  }
  return mobiusFromThreePairs(p0.z, p0.w, p1.z, p1.w, p2.z, p2.w, Rmax);
}

export function mobiusToJSON(m) {
  const pack = (z) => [z.re, z.im];
  return { a: pack(m.a), b: pack(m.b), c: pack(m.c), d: pack(m.d) };
}

export function mobiusFromJSON(obj) {
  if (!obj) return identityMobius();
  const unpack = (v) => (Array.isArray(v) ? C(v[0], v[1]) : C(v));
  return {
    a: unpack(obj.a ?? [1, 0]),
    b: unpack(obj.b ?? [0, 0]),
    c: unpack(obj.c ?? [0, 0]),
    d: unpack(obj.d ?? [1, 0]),
  };
}

export function xyToC(x, y) {
  return cFromXY(x, y);
}
