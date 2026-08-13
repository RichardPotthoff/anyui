/**
 * Möbius transforms as (a z + b) / (c z + d), stored as four complexes.
 * Normalization: sqrt(|c|^2 + |d|^2) = 1  (a,b read as scale/rotate + offset when c≈0).
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

/** Normalize so sqrt(|c|^2 + |d|^2) = 1. */
export function normalizeMobius(m) {
  const s = Math.sqrt(cAbs2(m.c) + cAbs2(m.d));
  if (!(s > 0)) return identityMobius();
  const inv = 1 / s;
  return {
    a: cScale(m.a, inv),
    b: cScale(m.b, inv),
    c: cScale(m.c, inv),
    d: cScale(m.d, inv),
  };
}

export function applyMobius(m, z) {
  // (a z + b) / (c z + d)
  return cDiv(cAdd(cMul(m.a, z), m.b), cAdd(cMul(m.c, z), m.d));
}

/** Derivative T'(z) = (ad - bc) / (c z + d)^2 */
export function dMobius(m, z) {
  const den = cAdd(cMul(m.c, z), m.d);
  return cDiv(detMobius(m), cMul(den, den));
}

/** Matrix multiply: (G ∘ M)(z) = G(M(z)) */
export function composeMobius(G, M) {
  return normalizeMobius({
    a: cAdd(cMul(G.a, M.a), cMul(G.b, M.c)),
    b: cAdd(cMul(G.a, M.b), cMul(G.b, M.d)),
    c: cAdd(cMul(G.c, M.a), cMul(G.d, M.c)),
    d: cAdd(cMul(G.c, M.b), cMul(G.d, M.d)),
  });
}

export function translationMobius(beta) {
  return normalizeMobius({ a: C(1, 0), b: C(beta), c: C(0, 0), d: C(1, 0) });
}

/** Similarity G(z) = α z + β */
export function similarityMobius(alpha, beta) {
  return normalizeMobius({ a: C(alpha), b: C(beta), c: C(0, 0), d: C(1, 0) });
}

/**
 * Unique Möbius sending z1→w1, z2→w2, z3→w3 (all distinct).
 * Uses the cross-ratio construction.
 */
export function mobiusFromThreePairs(z1, w1, z2, w2, z3, w3) {
  // S sends z1,z2,z3 → 0,1,∞
  // S(z) = ((z-z1)/(z-z3)) / ((z2-z1)/(z2-z3))
  const S = mobiusSendingTo01Inf(z1, z2, z3);
  const Sinv = invertMobius(S);
  // T sends w1,w2,w3 → 0,1,∞
  const T = mobiusSendingTo01Inf(w1, w2, w3);
  // Map: z --S→ 0,1,∞ --Tinv→ w
  return composeMobius(invertMobius(T), S);
}

function mobiusSendingTo01Inf(z1, z2, z3) {
  // ((z-z1)/(z-z3)) * ((z2-z3)/(z2-z1))
  // a = (z2-z3), b = -z1(z2-z3), c = (z2-z1), d = -z3(z2-z1)
  const z2mz3 = cSub(z2, z3);
  const z2mz1 = cSub(z2, z1);
  return normalizeMobius({
    a: z2mz3,
    b: cScale(cMul(z1, z2mz3), -1),
    c: z2mz1,
    d: cScale(cMul(z3, z2mz1), -1),
  });
}

export function invertMobius(m) {
  // (d z - b) / (-c z + a) / det, but matrix inverse of [[a,b],[c,d]] is [[d,-b],[-c,a]]/det
  const det = detMobius(m);
  return normalizeMobius({
    a: cDiv(m.d, det),
    b: cDiv(cScale(m.b, -1), det),
    c: cDiv(cScale(m.c, -1), det),
    d: cDiv(m.a, det),
  });
}

const EPS = 1e-8;

function distinct(points, eps = EPS) {
  const out = [];
  for (const p of points) {
    if (!out.some((q) => cEq(p, q, eps))) out.push(p);
  }
  return out;
}

/**
 * Build incremental G from gesture anchors.
 * starts/currents are parallel arrays of complex points (screen space).
 * Uses as many distinct pairs as available → 1/2/3 finger families.
 */
export function gestureMobius(starts, currents, eps = EPS) {
  const n = Math.min(starts.length, currents.length);
  if (n < 1) return identityMobius();

  // Pair and drop near-duplicates on the start side
  const pairs = [];
  for (let i = 0; i < n; i++) {
    if (pairs.some((pr) => cEq(pr.z, starts[i], eps))) continue;
    pairs.push({ z: starts[i], w: currents[i] });
  }

  if (pairs.length === 0) return identityMobius();

  if (pairs.length === 1) {
    const beta = cSub(pairs[0].w, pairs[0].z);
    return translationMobius(beta);
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

  // 3+ → full Möbius from first three distinct pairs
  const [p0, p1, p2] = pairs;
  if (cEq(p0.w, p1.w, eps) || cEq(p0.w, p2.w, eps) || cEq(p1.w, p2.w, eps)) {
    // targets not distinct → fall back to similarity on first two
    return gestureMobius(
      [p0.z, p1.z],
      [p0.w, p1.w],
      eps
    );
  }
  return mobiusFromThreePairs(p0.z, p0.w, p1.z, p1.w, p2.z, p2.w);
}

/** Serialize / deserialize for the anyui model */
export function mobiusToJSON(m) {
  const pack = (z) => [z.re, z.im];
  return { a: pack(m.a), b: pack(m.b), c: pack(m.c), d: pack(m.d) };
}

export function mobiusFromJSON(obj) {
  if (!obj) return identityMobius();
  const unpack = (v) => (Array.isArray(v) ? C(v[0], v[1]) : C(v));
  return normalizeMobius({
    a: unpack(obj.a ?? [1, 0]),
    b: unpack(obj.b ?? [0, 0]),
    c: unpack(obj.c ?? [0, 0]),
    d: unpack(obj.d ?? [1, 0]),
  });
}

export function xyToC(x, y) {
  return cFromXY(x, y);
}
