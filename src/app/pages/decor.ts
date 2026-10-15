import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecorKind } from '../core/models';

/** Primitiva SVG genérica (todas las decoraciones se describen con estas). */
interface Prim {
  t: 'path' | 'circle' | 'ellipse' | 'rect';
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  rx?: number;
  ry?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  fill?: string;
  stroke?: string;
  sw?: number;
  op?: number;
  tf?: string;
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

type Colors = [string, string, string];

/** Generador pseudoaleatorio con semilla: las decoraciones salen iguales en vista previa y PDF. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t * 1664525 + 1013904223) >>> 0;
    return t / 4294967296;
  };
}

const f2 = (n: number) => Number(n.toFixed(2));

/** Puntos repartidos en una caja, con tamaño, giro y color. */
function points(seed: number, n: number, b: Box, size: [number, number], colors: string[]) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({
    x: b.x0 + r() * (b.x1 - b.x0),
    y: b.y0 + r() * (b.y1 - b.y0),
    s: size[0] + r() * (size[1] - size[0]),
    a: Math.floor(r() * 360),
    c: colors[Math.floor(r() * colors.length)],
  }));
}
type Pt = ReturnType<typeof points>[number];

// ---------- figuras ----------
const circle = (cx: number, cy: number, r: number, fill: string, op?: number): Prim => ({ t: 'circle', cx: f2(cx), cy: f2(cy), r: f2(r), fill, op });

const star4 = (p: Pt): Prim => {
  const r = p.s / 2;
  const k = r * 0.28;
  const { x, y } = p;
  return { t: 'path', fill: p.c, d: `M${f2(x)} ${f2(y - r)} Q ${f2(x + k)} ${f2(y - k)} ${f2(x + r)} ${f2(y)} Q ${f2(x + k)} ${f2(y + k)} ${f2(x)} ${f2(y + r)} Q ${f2(x - k)} ${f2(y + k)} ${f2(x - r)} ${f2(y)} Q ${f2(x - k)} ${f2(y - k)} ${f2(x)} ${f2(y - r)} Z` };
};

const heart = (p: Pt): Prim => {
  const r = p.s / 2;
  const { x, y } = p;
  return { t: 'path', fill: p.c, op: 0.9, d: `M${f2(x)} ${f2(y + r * 0.8)} C ${f2(x - r * 1.3)} ${f2(y - r * 0.1)} ${f2(x - r * 0.6)} ${f2(y - r * 1.05)} ${f2(x)} ${f2(y - r * 0.35)} C ${f2(x + r * 0.6)} ${f2(y - r * 1.05)} ${f2(x + r * 1.3)} ${f2(y - r * 0.1)} ${f2(x)} ${f2(y + r * 0.8)} Z` };
};

const flake = (p: Pt): Prim => {
  const r = p.s / 2;
  const d = [0, 60, 120]
    .map((deg) => {
      const a = ((deg + p.a) * Math.PI) / 180;
      const dx = Math.cos(a) * r;
      const dy = Math.sin(a) * r;
      return `M${f2(p.x - dx)} ${f2(p.y - dy)} L${f2(p.x + dx)} ${f2(p.y + dy)}`;
    })
    .join(' ');
  return { t: 'path', d, stroke: p.c, sw: 0.3 };
};

const confettiPiece = (p: Pt, i: number): Prim => {
  const k = i % 4;
  if (k === 1) return { t: 'rect', x: f2(p.x - p.s / 2), y: f2(p.y - p.s / 5), w: f2(p.s), h: f2(p.s / 2.5), fill: p.c, tf: `rotate(${p.a} ${f2(p.x)} ${f2(p.y)})` };
  if (k === 2) {
    const a = (p.a * Math.PI) / 180;
    const pts = [0, 1, 2].map((j) => {
      const t = a + (j * 2 * Math.PI) / 3;
      return `${f2(p.x + Math.cos(t) * p.s * 0.6)} ${f2(p.y + Math.sin(t) * p.s * 0.6)}`;
    });
    return { t: 'path', fill: p.c, d: `M${pts[0]} L${pts[1]} L${pts[2]} Z` };
  }
  return circle(p.x, p.y, p.s / 2, p.c);
};

const flower = (p: Pt, center: string): Prim[] => {
  const out: Prim[] = [];
  const r = p.s / 2;
  for (let i = 0; i < 5; i++) {
    const a = p.a + i * 72;
    const rad = (a * Math.PI) / 180;
    const cx = p.x + Math.cos(rad) * r * 0.55;
    const cy = p.y + Math.sin(rad) * r * 0.55;
    out.push({ t: 'ellipse', cx: f2(cx), cy: f2(cy), rx: f2(r * 0.5), ry: f2(r * 0.32), fill: p.c, op: 0.9, tf: `rotate(${a} ${f2(cx)} ${f2(cy)})` });
  }
  out.push(circle(p.x, p.y, r * 0.28, center));
  return out;
};

const butterfly = (p: Pt, body: string): Prim[] => {
  const s = p.s / 2;
  const tf = `rotate(${(p.a % 50) - 25} ${f2(p.x)} ${f2(p.y)})`;
  const wing = (dx: number, dy: number, rx: number, ry: number, rot: number): Prim => ({
    t: 'ellipse', cx: f2(p.x + dx), cy: f2(p.y + dy), rx: f2(rx), ry: f2(ry), fill: p.c, op: 0.85,
    tf: `${tf} rotate(${rot} ${f2(p.x + dx)} ${f2(p.y + dy)})`,
  });
  return [
    wing(-s * 0.5, -s * 0.3, s * 0.55, s * 0.38, -30),
    wing(s * 0.5, -s * 0.3, s * 0.55, s * 0.38, 30),
    wing(-s * 0.38, s * 0.32, s * 0.36, s * 0.26, 25),
    wing(s * 0.38, s * 0.32, s * 0.36, s * 0.26, -25),
    { t: 'path', d: `M${f2(p.x)} ${f2(p.y - s * 0.55)} L${f2(p.x)} ${f2(p.y + s * 0.6)}`, stroke: body, sw: 0.35, tf },
    { t: 'path', d: `M${f2(p.x)} ${f2(p.y - s * 0.55)} q ${f2(-s * 0.15)} ${f2(-s * 0.35)} ${f2(-s * 0.35)} ${f2(-s * 0.4)} M${f2(p.x)} ${f2(p.y - s * 0.55)} q ${f2(s * 0.15)} ${f2(-s * 0.35)} ${f2(s * 0.35)} ${f2(-s * 0.4)}`, stroke: body, sw: 0.2, tf },
  ];
};

const note = (p: Pt): Prim[] => {
  const s = p.s;
  const hx = p.x;
  const hy = p.y + s * 0.35;
  const tf = `rotate(${(p.a % 30) - 15} ${f2(p.x)} ${f2(p.y)})`;
  const out: Prim[] = [
    { t: 'ellipse', cx: f2(hx), cy: f2(hy), rx: f2(s * 0.24), ry: f2(s * 0.17), fill: p.c, tf: `${tf} rotate(-20 ${f2(hx)} ${f2(hy)})` },
    { t: 'path', d: `M${f2(hx + s * 0.22)} ${f2(hy - s * 0.02)} L${f2(hx + s * 0.22)} ${f2(hy - s * 0.8)}`, stroke: p.c, sw: 0.3, tf },
  ];
  if (p.a % 2) {
    out.push({ t: 'path', d: `M${f2(hx + s * 0.22)} ${f2(hy - s * 0.8)} q ${f2(s * 0.3)} ${f2(s * 0.12)} ${f2(s * 0.28)} ${f2(s * 0.42)}`, stroke: p.c, sw: 0.3, tf });
  } else {
    const hx2 = hx + s * 0.55;
    out.push(
      { t: 'ellipse', cx: f2(hx2), cy: f2(hy - s * 0.08), rx: f2(s * 0.24), ry: f2(s * 0.17), fill: p.c, tf: `${tf} rotate(-20 ${f2(hx2)} ${f2(hy - s * 0.08)})` },
      { t: 'path', d: `M${f2(hx2 + s * 0.22)} ${f2(hy - s * 0.1)} L${f2(hx2 + s * 0.22)} ${f2(hy - s * 0.88)}`, stroke: p.c, sw: 0.3, tf },
      { t: 'path', d: `M${f2(hx + s * 0.22)} ${f2(hy - s * 0.8)} L${f2(hx2 + s * 0.22)} ${f2(hy - s * 0.88)}`, stroke: p.c, sw: 0.55, tf },
    );
  }
  return out;
};

const cloud = (x: number, y: number, s: number, fill: string): Prim[] => [
  { t: 'ellipse', cx: f2(x), cy: f2(y + s * 0.18), rx: f2(s * 0.62), ry: f2(s * 0.2), fill, op: 0.9 },
  circle(x - s * 0.28, y + s * 0.05, s * 0.22, fill, 0.9),
  circle(x + s * 0.05, y - s * 0.08, s * 0.3, fill, 0.9),
  circle(x + s * 0.34, y + s * 0.06, s * 0.2, fill, 0.9),
];

const geo = (p: Pt, i: number): Prim => {
  const s = p.s;
  switch (i % 4) {
    case 0:
      return { t: 'circle', cx: f2(p.x), cy: f2(p.y), r: f2(s * 0.45), stroke: p.c, sw: 0.45 };
    case 1: {
      const w = s * 1.4;
      const d = Array.from({ length: 5 }, (_, k) => `${k ? 'L' : 'M'}${f2(p.x - w / 2 + (k * w) / 4)} ${f2(p.y + (k % 2 ? -s * 0.25 : s * 0.25))}`).join(' ');
      return { t: 'path', d, stroke: p.c, sw: 0.45, tf: `rotate(${p.a % 90} ${f2(p.x)} ${f2(p.y)})` };
    }
    case 2:
      return { t: 'rect', x: f2(p.x - s * 0.35), y: f2(p.y - s * 0.35), w: f2(s * 0.7), h: f2(s * 0.7), fill: p.c, op: 0.85, tf: `rotate(${p.a} ${f2(p.x)} ${f2(p.y)})` };
    default:
      return { t: 'path', d: `M${f2(p.x - s * 0.4)} ${f2(p.y)} L${f2(p.x + s * 0.4)} ${f2(p.y)} M${f2(p.x)} ${f2(p.y - s * 0.4)} L${f2(p.x)} ${f2(p.y + s * 0.4)}`, stroke: p.c, sw: 0.5 };
  }
};

const SPRIG_LEAVES: [number, number, number][] = [
  [-5, -0.2, -25], [-8, 3.2, 30], [-14, 2.6, -35], [-17, 6.6, 25], [-23, 6.8, -40], [-26, 10.8, 20], [-31, 11.5, -45],
];

const sprig = (tf: string, c: Colors): Prim[] => [
  { t: 'path', d: 'M0 0 Q -16 3 -33 16', stroke: c[0], sw: 0.45, tf },
  ...SPRIG_LEAVES.map(([x, y, a]) => ({ t: 'ellipse' as const, cx: x, cy: y, rx: 2.7, ry: 1.1, fill: c[0], op: 0.85, tf: `${tf} rotate(${a} ${x} ${y})` })),
  { t: 'circle', cx: -2, cy: 5, r: 1.7, fill: c[1], tf },
  { t: 'circle', cx: -2, cy: 5, r: 0.6, fill: c[2], tf },
  { t: 'circle', cx: -35.5, cy: 16.5, r: 1.4, fill: c[1], tf },
  { t: 'circle', cx: -35.5, cy: 16.5, r: 0.5, fill: c[2], tf },
];

const arc = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

const balloons = (x: number, y: number, s: number, c: Colors, flip = false): Prim[] => {
  const k = flip ? -1 : 1;
  const tie = { x: x + k * s * 0.15, y: y + s * 1.9 };
  const items = [
    { dx: -0.45, dy: 0.15, col: c[0] },
    { dx: 0.15, dy: -0.15, col: c[1] },
    { dx: 0.62, dy: 0.32, col: c[2] },
  ];
  const out: Prim[] = [];
  for (const b of items) {
    const bx = x + k * b.dx * s;
    const by = y + b.dy * s;
    out.push({ t: 'path', d: `M${f2(bx)} ${f2(by + s * 0.5)} Q ${f2((bx + tie.x) / 2 + 0.6)} ${f2((by + tie.y) / 2)} ${f2(tie.x)} ${f2(tie.y)}`, stroke: '#9a8f8a', sw: 0.2 });
    out.push({ t: 'ellipse', cx: f2(bx), cy: f2(by), rx: f2(s * 0.36), ry: f2(s * 0.46), fill: b.col });
    out.push({ t: 'path', d: `M${f2(bx - s * 0.06)} ${f2(by + s * 0.52)} L${f2(bx + s * 0.06)} ${f2(by + s * 0.52)} L${f2(bx)} ${f2(by + s * 0.44)} Z`, fill: b.col });
    out.push({ t: 'ellipse', cx: f2(bx - s * 0.12), cy: f2(by - s * 0.16), rx: f2(s * 0.07), ry: f2(s * 0.13), fill: '#ffffff', op: 0.45 });
  }
  return out;
};

const bunting = (x0: number, x1: number, y: number, sag: number, n: number, size: number, c: Colors): Prim[] => {
  const out: Prim[] = [{ t: 'path', d: `M${f2(x0)} ${f2(y)} Q ${f2((x0 + x1) / 2)} ${f2(y + sag * 2)} ${f2(x1)} ${f2(y)}`, stroke: '#9a8f8a', sw: 0.25 }];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
    const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y;
    const w = size * 0.55;
    out.push({ t: 'path', d: `M${f2(px - w)} ${f2(py)} L${f2(px + w)} ${f2(py)} L${f2(px)} ${f2(py + size)} Z`, fill: c[i % 3] });
  }
  return out;
};

const waves = (x0: number, x1: number, y: number, gap: number, amp: number, c: Colors, sw: number): Prim[] =>
  [0, 1, 2].map((i) => {
    const yy = y + i * gap;
    const step = 6;
    let d = `M${f2(x0)} ${f2(yy)}`;
    for (let x = x0; x < x1; x += step) d += ` q ${step / 4} ${i % 2 ? amp : -amp} ${step / 2} 0 t ${step / 2} 0`;
    return { t: 'path' as const, d, stroke: c[i], sw };
  });

const sun = (x: number, y: number, r: number, c: Colors): Prim[] => {
  const out: Prim[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    const r1 = r * 1.35;
    const r2 = r * (i % 2 ? 1.75 : 1.95);
    out.push({ t: 'path', d: `M${f2(x + Math.cos(a) * r1)} ${f2(y + Math.sin(a) * r1)} L${f2(x + Math.cos(a) * r2)} ${f2(y + Math.sin(a) * r2)}`, stroke: c[0], sw: r * 0.16 });
  }
  out.push(circle(x, y, r, c[1]));
  out.push(circle(x, y, r * 0.62, c[0], 0.5));
  return out;
};

const moon = (x: number, y: number, r: number, c: Colors): Prim[] => [
  { t: 'path', fill: c[0], d: `M${f2(x)} ${f2(y - r)} A ${f2(r)} ${f2(r)} 0 1 0 ${f2(x)} ${f2(y + r)} A ${f2(r * 0.75)} ${f2(r * 0.9)} 0 1 1 ${f2(x)} ${f2(y - r)} Z` },
  star4({ x: x + r * 1.6, y: y - r * 0.6, s: r * 0.9, a: 0, c: c[1] }),
  star4({ x: x + r * 2.4, y: y + r * 0.5, s: r * 0.55, a: 0, c: c[2] }),
  star4({ x: x - r * 1.5, y: y + r * 0.8, s: r * 0.5, a: 0, c: c[1] }),
];

const corners = (b: Box, len: number, c: Colors): Prim[] => {
  const one = (x: number, y: number, sx: number, sy: number): Prim[] => [
    { t: 'path', d: `M${f2(x)} ${f2(y + sy * len)} L${f2(x)} ${f2(y)} L${f2(x + sx * len)} ${f2(y)}`, stroke: c[0], sw: 0.45 },
    { t: 'path', d: `M${f2(x + sx * 1.6)} ${f2(y + sy * len * 0.7)} L${f2(x + sx * 1.6)} ${f2(y + sy * 1.6)} L${f2(x + sx * len * 0.7)} ${f2(y + sy * 1.6)}`, stroke: c[0], sw: 0.2 },
    circle(x + sx * 3.4, y + sy * 3.4, 0.8, c[1]),
    { t: 'path', d: `M${f2(x + sx * len)} ${f2(y)} q ${f2(sx * 1.6)} 0 ${f2(sx * 1.6)} ${f2(sy * 1.6)}`, stroke: c[0], sw: 0.3 },
    { t: 'path', d: `M${f2(x)} ${f2(y + sy * len)} q 0 ${f2(sy * 1.6)} ${f2(sx * 1.6)} ${f2(sy * 1.6)}`, stroke: c[0], sw: 0.3 },
  ];
  return [...one(b.x0, b.y0, 1, 1), ...one(b.x1, b.y0, -1, 1), ...one(b.x0, b.y1, 1, -1), ...one(b.x1, b.y1, -1, -1)];
};

const tape = (x: number, y: number, w: number, h: number, rot: number, fill: string): Prim[] => {
  // Bordes dentados como cinta rasgada.
  const n = 6;
  let d = `M${f2(x - w / 2)} ${f2(y - h / 2)} L${f2(x + w / 2)} ${f2(y - h / 2)}`;
  for (let i = 1; i <= n; i++) d += ` L${f2(x + w / 2 + (i % 2 ? 0.5 : 0))} ${f2(y - h / 2 + (i * h) / n)}`;
  d += ` L${f2(x - w / 2)} ${f2(y + h / 2)}`;
  for (let i = n - 1; i >= 1; i--) d += ` L${f2(x - w / 2 - (i % 2 ? 0.5 : 0))} ${f2(y - h / 2 + (i * h) / n)}`;
  d += ' Z';
  return [{ t: 'path', d, fill, op: 0.6, tf: `rotate(${rot} ${f2(x)} ${f2(y)})` }];
};

/**
 * Decoraciones de la plantilla. Se dibujan con colores literales (no variables CSS)
 * porque los SVG se rasterizan aparte al exportar a PDF.
 */
@Component({
  selector: 'app-decor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { position: absolute; inset: 0; pointer-events: none; }
    svg { position: absolute; left: 0; top: 0; width: 210mm; height: 150mm; overflow: visible; }
    .wash { position: absolute; border-radius: 50%; }
  `,
  template: `
    @if (kind() === 'acuarela') {
      @if (area() === 'month') {
        <div class="wash" [style.left.mm]="-20" [style.top.mm]="bind() - 14" [style.width.mm]="150" [style.height.mm]="60"
          [style.background]="radial(monthBase(), 0.9, 70)"></div>
      } @else {
        <div class="wash" [style.left.mm]="-25" [style.top.mm]="-10" [style.width.mm]="120" [style.height.mm]="75"
          [style.background]="radial(colors()[0], 0.75, 68)"></div>
        <div class="wash" [style.left.mm]="-30" [style.top.mm]="80" [style.width.mm]="110" [style.height.mm]="100"
          [style.background]="radial(colors()[1], 0.8, 66)"></div>
        <div class="wash" [style.left.mm]="140" [style.top.mm]="0" [style.width.mm]="100" [style.height.mm]="110"
          [style.background]="radial(colors()[2], 0.7, 66)"></div>
      }
    } @else if (prims().length) {
      <svg viewBox="0 0 210 150" preserveAspectRatio="none">
        @for (p of prims(); track $index) {
          @switch (p.t) {
            @case ('path') {
              <path [attr.d]="p.d" [attr.fill]="p.fill ?? 'none'" [attr.stroke]="p.stroke ?? null" [attr.stroke-width]="p.sw ?? null"
                [attr.opacity]="p.op ?? null" [attr.transform]="p.tf ?? null" stroke-linecap="round" stroke-linejoin="round" />
            }
            @case ('circle') {
              <circle [attr.cx]="p.cx" [attr.cy]="p.cy" [attr.r]="p.r" [attr.fill]="p.fill ?? 'none'" [attr.stroke]="p.stroke ?? null"
                [attr.stroke-width]="p.sw ?? null" [attr.opacity]="p.op ?? null" [attr.transform]="p.tf ?? null" />
            }
            @case ('ellipse') {
              <ellipse [attr.cx]="p.cx" [attr.cy]="p.cy" [attr.rx]="p.rx" [attr.ry]="p.ry" [attr.fill]="p.fill ?? 'none'"
                [attr.opacity]="p.op ?? null" [attr.transform]="p.tf ?? null" />
            }
            @case ('rect') {
              <rect [attr.x]="p.x" [attr.y]="p.y" [attr.width]="p.w" [attr.height]="p.h" [attr.fill]="p.fill ?? 'none'"
                [attr.stroke]="p.stroke ?? null" [attr.stroke-width]="p.sw ?? null" [attr.opacity]="p.op ?? null"
                [attr.transform]="p.tf ?? null" />
            }
          }
        }
      </svg>
    }
  `,
})
export class Decor {
  readonly kind = input.required<DecorKind>();
  readonly area = input<'month' | 'cover'>('month');
  readonly bind = input(15);
  readonly colors = input.required<Colors>();
  readonly monthBase = input('#eeeeee');

  protected radial(color: string, opacity: number, stop: number) {
    const hex = color.replace('#', '');
    const n = parseInt(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex, 16);
    const rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    return `radial-gradient(ellipse at center, rgba(${rgb}, ${opacity}) 0%, rgba(${rgb}, 0) ${stop}%)`;
  }

  protected readonly prims = computed<Prim[]>(() => {
    const b = this.bind();
    const c = this.colors();
    const cl = [...c];
    const month = this.area() === 'month';
    /** Zona libre del encabezado del mes, a la derecha del nombre. */
    const head: Box = { x0: 116, x1: 156, y0: b + 2, y1: b + 20 };
    /** Franjas libres de la portada alrededor de la foto. */
    const coverBoxes: [Box, number][] = [
      [{ x0: 8, x1: 202, y0: b + 1.5, y1: b + 6.5 }, 1],
      [{ x0: 8, x1: 202, y0: 139, y1: 146 }, 1],
      [{ x0: 6, x1: 34, y0: b + 10, y1: 136 }, 0.4],
      [{ x0: 176, x1: 204, y0: b + 10, y1: 136 }, 0.4],
    ];
    const frameTop = b + 8.5;
    const frameBottom = frameTop + Math.min(86, 150 - frameTop - 20);

    /** Reparte figuras: en el mes dentro del encabezado; en portada por las franjas. */
    const spread = (nMonth: number, nCover: number, size: [number, number], make: (p: Pt, i: number) => Prim | Prim[]): Prim[] => {
      const pts = month
        ? points(7, nMonth, head, size, cl)
        : coverBoxes.flatMap(([box, k], j) => points(11 + j * 2, Math.max(1, Math.round(nCover * k)), box, size, cl));
      return pts.flatMap((p, i) => make(p, i));
    };

    switch (this.kind()) {
      case 'hojas':
        return month ? sprig(`translate(157 ${b + 3})`, c) : [...sprig(`translate(36 ${b + 4}) scale(-1 1)`, c), ...sprig('translate(176 146) rotate(180)', c)];
      case 'arcos':
        return month
          ? [
              ...[10, 7.2, 4.4].map((r, i) => ({ t: 'path' as const, d: arc(146, b + 21, r), stroke: c[i], sw: 2.2 })),
              circle(129, b + 7, 2.4, c[1]),
            ]
          : [...[28, 21, 14].map((r, i) => ({ t: 'path' as const, d: arc(20, 152, r), stroke: c[i], sw: 5 })), circle(190, b + 14, 7, c[1])];
      case 'marco':
        return [
          { t: 'rect', x: 2.5, y: f2(b + 0.6), w: 205, h: f2(147.5 - b - 0.6), stroke: c[0], sw: 0.35 },
          { t: 'rect', x: 3.7, y: f2(b + 1.8), w: 202.6, h: f2(145.1 - b - 1.8), stroke: c[0], sw: 0.15 },
        ];
      case 'confeti':
        return spread(16, 18, [1, 2.4], confettiPiece);
      case 'estrellas':
        return spread(9, 10, [1.6, 3.6], star4);
      case 'corazones':
        return spread(9, 11, [1.6, 3.4], heart);
      case 'copos':
        return spread(9, 10, [2, 4.2], flake);
      case 'puntos':
        return spread(14, 16, [1.4, 4.2], (p) => circle(p.x, p.y, p.s / 2, p.c, 0.55));
      case 'flores':
        return spread(7, 9, [3, 5], (p) => flower(p, c[2] === p.c ? c[0] : c[2]));
      case 'mariposas':
        return spread(4, 7, [4, 6.5], (p) => butterfly(p, '#6f625d'));
      case 'notas':
        return spread(7, 9, [3, 5], note);
      case 'geometrico':
        return spread(10, 12, [2, 3.6], geo);
      case 'nubes':
        return month
          ? [...cloud(126, b + 8, 9, c[1]), ...cloud(146, b + 15, 7, c[1]), ...cloud(152, b + 5, 5, c[2])]
          : [...cloud(22, b + 14, 16, c[1]), ...cloud(186, b + 24, 13, c[1]), ...cloud(176, 138, 10, c[2]), ...cloud(30, 132, 11, c[2])];
      case 'globos':
        return month
          ? balloons(146, b + 6, 6, c)
          : [...balloons(20, b + 18, 11, c), ...balloons(190, b + 60, 10, c, true)];
      case 'banderines':
        return month ? bunting(112, 158, b + 2.5, 3, 7, 4, c) : bunting(6, 204, b + 2.2, 3.5, 22, 5, c);
      case 'ondas':
        return month ? waves(118, 156, b + 8, 3.4, 1.4, c, 0.6) : [...waves(8, 60, 136, 3.4, 1.6, c, 0.7), ...waves(150, 202, b + 6, 3.4, 1.6, c, 0.7)];
      case 'sol':
        return month ? sun(146, b + 11, 4.2, c) : sun(188, b + 18, 8, c);
      case 'luna':
        return month ? moon(140, b + 10, 4.5, c) : [...moon(184, b + 16, 7, c), ...moon(24, 132, 5, c)];
      case 'esquinas':
        return corners({ x0: 4, x1: 206, y0: b + 1.5, y1: 146 }, 9, c);
      case 'washi':
        return month
          ? [...tape(150, b + 4, 20, 5, 18, c[0]), ...tape(10, 144, 22, 5, -28, c[1])]
          : [...tape(46, frameTop + 2, 24, 6.5, -35, c[0]), ...tape(164, frameBottom - 2, 24, 6.5, -35, c[1])];
      default:
        return [];
    }
  });
}
