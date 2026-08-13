/** Minimal complex helpers (re/im objects). */

export const C = (re = 0, im = 0) =>
  typeof re === "object" && re !== null ? { re: +re.re, im: +re.im } : { re: +re, im: +im };

export const cAdd = (z, w) => C(z.re + w.re, z.im + w.im);
export const cSub = (z, w) => C(z.re - w.re, z.im - w.im);
export const cMul = (z, w) => C(z.re * w.re - z.im * w.im, z.re * w.im + z.im * w.re);
export const cDiv = (z, w) => {
  const n = w.re * w.re + w.im * w.im;
  return C((z.re * w.re + z.im * w.im) / n, (z.im * w.re - z.re * w.im) / n);
};
export const cScale = (z, s) => C(z.re * s, z.im * s);
export const cConj = (z) => C(z.re, -z.im);
export const cAbs = (z) => Math.hypot(z.re, z.im);
export const cAbs2 = (z) => z.re * z.re + z.im * z.im;
export const cArg = (z) => Math.atan2(z.im, z.re);
export const cExpI = (theta) => C(Math.cos(theta), Math.sin(theta));
export const cNorm = (z) => {
  const a = cAbs(z);
  return a === 0 ? C(1, 0) : cScale(z, 1 / a);
};
export const cEq = (z, w, eps = 1e-12) => Math.hypot(z.re - w.re, z.im - w.im) < eps;
export const cFromXY = (x, y) => C(x, y);
export const cToXY = (z) => [z.re, z.im];
