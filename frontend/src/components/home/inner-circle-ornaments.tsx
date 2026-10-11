// Stroke-only line-art ornaments for the Inner Circle popup: a scalloped
// certification seal holding a laurel wreath, and a smaller corner seal with
// a botanical sprig flowing down the card edge. Geometry is generated from
// bezier math so both motifs scale crisply to any render size.

type Pt = { x: number; y: number };

const f = (n: number) => +n.toFixed(2);

const quadAt = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};

const quadAngle = (p0: Pt, c: Pt, p1: Pt, t: number): number => {
  const dx = 2 * (1 - t) * (c.x - p0.x) + 2 * t * (p1.x - c.x);
  const dy = 2 * (1 - t) * (c.y - p0.y) + 2 * t * (p1.y - c.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

const cubicAt = (p0: Pt, c1: Pt, c2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
  };
};

const cubicAngle = (p0: Pt, c1: Pt, c2: Pt, p3: Pt, t: number): number => {
  const u = 1 - t;
  const dx = 3 * u * u * (c1.x - p0.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (p3.x - c2.x);
  const dy = 3 * u * u * (c1.y - p0.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (p3.y - c2.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

/** Closed path of `teeth` outward scallops around a circle of radius r. */
const scallopSeal = (r: number, teeth: number): string => {
  const arc = 2 * r * Math.sin(Math.PI / teeth) * 0.62;
  let d = "";
  for (let i = 0; i <= teeth; i++) {
    const a = (i / teeth) * 2 * Math.PI;
    const x = f(r * Math.cos(a));
    const y = f(r * Math.sin(a));
    d += i === 0 ? `M${x} ${y}` : ` A${f(arc)} ${f(arc)} 0 0 1 ${x} ${y}`;
  }
  return `${d}Z`;
};

// Small laurel leaf pointing along the +x axis, ~10 units long.
const LEAF = "M0 0Q4.6 -3.5 10 -0.7Q4.6 2.7 0 0";

// Left branch of the wreath, drawn from just below centre-bottom up the left
// side; the right branch mirrors it.
const WREATH_STEM = { p0: { x: 2, y: 29 }, c: { x: -25, y: 10 }, p1: { x: -15, y: -24 } };
const WREATH_NODES = [0.14, 0.31, 0.48, 0.65, 0.82, 0.96];

const SPRIG_STEM = {
  p0: { x: 62, y: 60 },
  c1: { x: 34, y: 82 },
  c2: { x: 96, y: 98 },
  p3: { x: 70, y: 126 },
};
const SPRIG_NODES = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9];

/** Scalloped certification seal with a laurel wreath inside (top-left corner). */
export function WreathSeal({ className }: { className?: string }) {
  const leaves = WREATH_NODES.flatMap((t, i) => {
    const p = quadAt(WREATH_STEM.p0, WREATH_STEM.c, WREATH_STEM.p1, t);
    const a = quadAngle(WREATH_STEM.p0, WREATH_STEM.c, WREATH_STEM.p1, t);
    const s = i % 2 === 0 ? 1 : 0.9;
    return [
      { p, rot: a - 56, s },
      { p, rot: a + 56, s },
    ];
  });

  return (
    <svg
      viewBox="-48 -48 96 96"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={scallopSeal(41, 36)} vectorEffect="non-scaling-stroke" />
      <circle r={34.5} vectorEffect="non-scaling-stroke" />
      {[1, -1].map((dir) => (
        <g key={dir} transform={dir === -1 ? "scale(-1 1)" : undefined}>
          <path
            d={`M${f(WREATH_STEM.p0.x)} ${f(WREATH_STEM.p0.y)}Q${f(WREATH_STEM.c.x)} ${f(WREATH_STEM.c.y)} ${f(WREATH_STEM.p1.x)} ${f(WREATH_STEM.p1.y)}`}
            vectorEffect="non-scaling-stroke"
          />
          {leaves.map((leaf, i) => (
            <path
              key={i}
              d={LEAF}
              transform={`translate(${f(leaf.p.x)} ${f(leaf.p.y)}) rotate(${f(leaf.rot)}) scale(${leaf.s})`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** Smaller seal with a botanical sprig flowing downward (top-right corner). */
export function SprigSeal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 132"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(62 32)">
        <path d={scallopSeal(25, 30)} vectorEffect="non-scaling-stroke" />
        <circle r={20} vectorEffect="non-scaling-stroke" />
      </g>
      <path
        d={`M${f(SPRIG_STEM.p0.x)} ${f(SPRIG_STEM.p0.y)}C${f(SPRIG_STEM.c1.x)} ${f(SPRIG_STEM.c1.y)} ${f(SPRIG_STEM.c2.x)} ${f(SPRIG_STEM.c2.y)} ${f(SPRIG_STEM.p3.x)} ${f(SPRIG_STEM.p3.y)}`}
        vectorEffect="non-scaling-stroke"
      />
      <path d="M74 58C60 78 90 92 76 110" opacity={0.55} vectorEffect="non-scaling-stroke" />
      {SPRIG_NODES.map((t, i) => {
        const p = cubicAt(SPRIG_STEM.p0, SPRIG_STEM.c1, SPRIG_STEM.c2, SPRIG_STEM.p3, t);
        const a = cubicAngle(SPRIG_STEM.p0, SPRIG_STEM.c1, SPRIG_STEM.c2, SPRIG_STEM.p3, t);
        return (
          <path
            key={t}
            d={LEAF}
            transform={`translate(${f(p.x)} ${f(p.y)}) rotate(${f(a + (i % 2 === 0 ? -60 : 60))}) scale(0.85)`}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
