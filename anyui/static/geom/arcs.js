/**
 * Turtle-style arc segments [length, deltaAngle] (radians) and generators.
 * Multi-turn safe split + Möbius image of principal arcs (chord + T' method).
 */

import {
  C, cAdd, cSub, cMul, cScale, cAbs, cNorm, cExpI, cFromXY, cToXY,
} from "./complex.js";
import { applyMobius, dMobius } from "./mobius.js";

const TAU = 2 * Math.PI;

/** Unnormalized sinc: sin(x)/x, sinc(0)=1 */
export function sinc(x) {
  return x === 0 ? 1 : Math.sin(x) / x;
}

/**
 * Split multi-turn arc, preserving rotation sense (trunc toward 0).
 * Returns { L0, d0, n, R } with d0 in (-TAU, TAU), n integer turns.
 */
export function splitTurns(L, dTheta) {
  if (dTheta === 0 || !Number.isFinite(dTheta)) {
    return { L0: L, d0: 0, n: 0, R: Infinity };
  }
  const R = L / dTheta;
  const n = Math.trunc(dTheta / TAU);
  const d0 = dTheta - n * TAU;
  const L0 = R * d0;
  return { L0, d0, n, R };
}

/**
 * Map one principal arc (no full turns) under Möbius m.
 * p0, a0: start point & unit heading (complex).
 * Returns { L, dTheta, p1, a1 } in image space (heading unit length).
 */
export function transformPrincipalArc(m, p0, a0, L, dTheta) {
  if (dTheta === 0) {
    const p1 = cAdd(p0, cScale(a0, L));
    const p0t = applyMobius(m, p0);
    const p1t = applyMobius(m, p1);
    const chord = cSub(p1t, p0t);
    const len = cAbs(chord);
    const a0t = cNorm(cMul(a0, dMobius(m, p0)));
    return { L: len, dTheta: 0, p0: p0t, a0: a0t, p1: p1t, a1: a0t };
  }

  // Chord in world: length L * sinc(dTheta/2), direction rotated by dTheta/2
  const half = dTheta / 2;
  const chordLen = L * sinc(half);
  const eChord = cNorm(cMul(a0, cExpI(half)));
  const p1 = cAdd(p0, cScale(eChord, chordLen));

  const p0t = applyMobius(m, p0);
  const p1t = applyMobius(m, p1);
  const chordT = cSub(p1t, p0t);
  const chordTLen = cAbs(chordT);

  const a0t = cNorm(cMul(a0, dMobius(m, p0)));
  // Image turning from angle between heading and chord direction
  const edl = cNorm(chordT);
  const eda = cMul(edl, C(a0t.re, -a0t.im)); // edl / a0t  (a0t unit → conj = inv)
  const dThetaT = 2 * Math.atan2(eda.im, eda.re);
  const LT = chordTLen / sinc(dThetaT / 2);

  const a1t = cNorm(cMul(a0t, cExpI(dThetaT)));
  return { L: LT, dTheta: dThetaT, p0: p0t, a0: a0t, p1: p1t, a1: a1t };
}

/**
 * Transform a full arc-chain under Möbius m.
 * segments: iterable of [L, dTheta, ...extras]
 * Yields transformed [L', dTheta', ...extras] and returns { p0, a0 } image start.
 */
export function* transformArcs(segments, m, p0 = C(0, 0), a0 = C(1, 0)) {
  let P = C(p0);
  let a = cNorm(C(a0));
  const pStart = applyMobius(m, P);
  const aStart = cNorm(cMul(a, dMobius(m, P)));

  for (const seg of segments) {
    const L = +seg[0];
    const dTheta = +seg[1];
    const extras = seg.slice(2);
    const { L0, d0, n, R } = splitTurns(L, dTheta);

    if (dTheta === 0) {
      const r = transformPrincipalArc(m, P, a, L, 0);
      yield [r.L, 0, ...extras];
      P = r.p1;
      a = r.a1;
      continue;
    }

    // Principal part
    let Lp = L0;
    let dp = d0;
    // If pure full turns (principal ~ 0), map via a sample point on the circle
    if (Math.abs(d0) < 1e-12 && n !== 0) {
      // Use a quarter-turn sample to get image radius, keep winding
      const sample = transformPrincipalArc(m, P, a, Math.abs(R) * (Math.PI / 2), Math.sign(R) * (Math.PI / 2) || Math.PI / 2);
      const Rp = sample.L / (Math.PI / 2);
      const sigma = Math.sign(sample.dTheta) === Math.sign(dTheta) || dTheta === 0 ? 1 : -1;
      const n2 = sigma * n;
      const dTot = n2 * TAU;
      const Ltot = Math.abs(Rp) * Math.abs(dTot);
      yield [Ltot, dTot, ...extras];
      // Advance world pose by full original segment
      P = cAdd(P, cScale(cNorm(cMul(a, cExpI(dTheta / 2))), L * sinc(dTheta / 2)));
      a = cNorm(cMul(a, cExpI(dTheta)));
      continue;
    }

    const r = transformPrincipalArc(m, P, a, Lp, dp);
    const sigma =
      Math.abs(dp) < 1e-14
        ? 1
        : Math.sign(r.dTheta) === Math.sign(dp)
          ? 1
          : -1;
    const n2 = sigma * n;
    const dTot = r.dTheta + n2 * TAU;
    const Rimg = Math.abs(r.dTheta) > 1e-14 ? r.L / r.dTheta : 0;
    const Ltot = Math.abs(dTot) > 1e-14 ? Rimg * dTot : r.L;
    yield [Ltot, dTot, ...extras];

    // Advance world pose along the *original* full segment
    const half = dTheta / 2;
    const chordLen = L * sinc(half);
    const eChord = cNorm(cMul(a, cExpI(half)));
    P = cAdd(P, cScale(eChord, chordLen));
    a = cNorm(cMul(a, cExpI(dTheta)));
  }

  return { p0: pStart, a0: aStart };
}

/**
 * Densify segments to points for canvas stroking (generator).
 * Yields { x, y, angle, length, segmentIndex }.
 */
export function* segmentsToPoints(
  segments,
  {
    p0 = [0, 0],
    a0 = [1, 0],
    scale = 1,
    tol = 0.4,
    returnStart = true,
  } = {}
) {
  let px = p0[0];
  let py = p0[1];
  let ax = a0[0];
  let ay = a0[1];
  // normalize heading
  const ah = Math.hypot(ax, ay) || 1;
  ax /= ah;
  ay /= ah;
  let Lsum = 0;

  if (returnStart) {
    yield { x: px, y: py, angle: [ax, ay], length: 0, segmentIndex: -1 };
  }

  let si = 0;
  for (const seg of segments) {
    let l = (+seg[0]) * scale;
    let da = +seg[1];
    if (da !== 0) {
      let r = l / da;
      if (r !== 0) {
        const dl = 2 * Math.sqrt(2 * Math.abs(r) * tol);
        const n = Math.max(
          Math.ceil(6 * Math.abs(da / TAU)),
          Math.floor(Math.abs(l) / dl) + 1
        );
        const dda = da / n;
        const c = Math.cos(dda);
        const s = Math.sin(dda);
        const c2 = Math.cos(dda / 2);
        const s2 = Math.sin(dda / 2);
        // chord step for one sub-arc of angle dda
        let vx = 2 * r * s2 * c2;
        let vy = 2 * r * s2 * s2;
        // rotate step into current heading frame
        let stepx = vx * ax - vy * ay;
        let stepy = vx * ay + vy * ax;
        for (let i = 0; i < n; i++) {
          Lsum += l / n;
          px += stepx;
          py += stepy;
          const nax = ax * c - ay * s;
          const nay = ax * s + ay * c;
          ax = nax;
          ay = nay;
          yield { x: px, y: py, angle: [ax, ay], length: Lsum, segmentIndex: si };
          // rotate step vector
          const nsx = stepx * c - stepy * s;
          const nsy = stepx * s + stepy * c;
          stepx = nsx;
          stepy = nsy;
        }
      }
    } else {
      Lsum += l;
      px += l * ax;
      py += l * ay;
      yield { x: px, y: py, angle: [ax, ay], length: Lsum, segmentIndex: si };
    }
    si++;
  }
}

/** Degrees → radians for outline JSON that stores angles in degrees. */
export function segsDegreesToRadians(segs) {
  return segs.map(([L, deg, ...rest]) => [L, (deg * Math.PI) / 180, ...rest]);
}
