import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecorKind } from '../core/models';

interface Shape {
  kind: 'circle' | 'rect' | 'tri' | 'star' | 'heart' | 'flake' | 'dot';
  x: number;
  y: number;
  s: number;
  r: number;
  c: string;
}

/** Generador pseudoaleatorio con semilla: las decoraciones salen iguales en vista previa y PDF. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t * 1664525 + 1013904223) >>> 0;
    return t / 4294967296;
  };
}

function scatter(seed: number, n: number, x0: number, x1: number, y0: number, y1: number, colors: string[], kinds: Shape['kind'][], size: [number, number]): Shape[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({
    kind: kinds[Math.floor(r() * kinds.length)],
    x: x0 + r() * (x1 - x0),
    y: y0 + r() * (y1 - y0),
    s: size[0] + r() * (size[1] - size[0]),
    r: Math.floor(r() * 360),
    c: colors[Math.floor(r() * colors.length)],
  }));
}

const SPRIG_LEAVES: [number, number, number][] = [
  [-5, -0.2, -25], [-8, 3.2, 30], [-14, 2.6, -35], [-17, 6.6, 25], [-23, 6.8, -40], [-26, 10.8, 20], [-31, 11.5, -45],
];

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
    } @else if (kind() !== 'ninguna') {
      <svg viewBox="0 0 210 150" preserveAspectRatio="none">
        @switch (kind()) {
          @case ('hojas') {
            @for (t of sprigs(); track $index) {
              <g [attr.transform]="t">
                <path d="M0 0 Q -16 3 -33 16" fill="none" [attr.stroke]="colors()[0]" stroke-width="0.45" />
                @for (l of leaves; track $index) {
                  <ellipse [attr.cx]="l[0]" [attr.cy]="l[1]" rx="2.7" ry="1.1" [attr.fill]="colors()[0]"
                    [attr.transform]="'rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')'" opacity="0.85" />
                }
                <circle cx="-2" cy="5" r="1.7" [attr.fill]="colors()[1]" />
                <circle cx="-2" cy="5" r="0.6" [attr.fill]="colors()[2]" />
                <circle cx="-35.5" cy="16.5" r="1.4" [attr.fill]="colors()[1]" />
                <circle cx="-35.5" cy="16.5" r="0.5" [attr.fill]="colors()[2]" />
              </g>
            }
          }
          @case ('arcos') {
            @for (a of arches(); track $index) {
              <path [attr.d]="a.d" fill="none" [attr.stroke]="a.c" [attr.stroke-width]="a.w" stroke-linecap="round" />
            }
            @for (s of suns(); track $index) {
              <circle [attr.cx]="s.x" [attr.cy]="s.y" [attr.r]="s.r" [attr.fill]="colors()[1]" />
            }
          }
          @case ('marco') {
            <rect x="2.5" [attr.y]="bind() + 0.6" width="205" [attr.height]="147.5 - bind() - 0.6" fill="none"
              [attr.stroke]="colors()[0]" stroke-width="0.35" />
            <rect x="3.7" [attr.y]="bind() + 1.8" width="202.6" [attr.height]="145.1 - bind() - 1.8" fill="none"
              [attr.stroke]="colors()[0]" stroke-width="0.15" />
          }
          @default {
            @for (s of shapes(); track $index) {
              @switch (s.kind) {
                @case ('circle') { <circle [attr.cx]="s.x" [attr.cy]="s.y" [attr.r]="s.s / 2" [attr.fill]="s.c" /> }
                @case ('rect') {
                  <rect [attr.x]="s.x - s.s / 2" [attr.y]="s.y - s.s / 5" [attr.width]="s.s" [attr.height]="s.s / 2.5"
                    [attr.fill]="s.c" [attr.transform]="'rotate(' + s.r + ' ' + s.x + ' ' + s.y + ')'" />
                }
                @case ('tri') {
                  <path [attr.d]="tri(s)" [attr.fill]="s.c" />
                }
                @case ('star') {
                  <path [attr.d]="star(s)" [attr.fill]="s.c" />
                }
                @case ('heart') {
                  <path [attr.d]="heart(s)" [attr.fill]="s.c" opacity="0.9" />
                }
                @case ('flake') {
                  <path [attr.d]="flake(s)" fill="none" [attr.stroke]="s.c" stroke-width="0.3" stroke-linecap="round" />
                }
                @case ('dot') {
                  <circle [attr.cx]="s.x" [attr.cy]="s.y" [attr.r]="s.s / 2" [attr.fill]="s.c" opacity="0.55" />
                }
              }
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
  readonly colors = input.required<[string, string, string]>();
  readonly monthBase = input('#eeeeee');

  protected readonly leaves = SPRIG_LEAVES;

  protected radial(color: string, opacity: number, stop: number) {
    const hex = color.replace('#', '');
    const n = parseInt(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex, 16);
    const rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    return `radial-gradient(ellipse at center, rgba(${rgb}, ${opacity}) 0%, rgba(${rgb}, 0) ${stop}%)`;
  }

  protected readonly sprigs = computed(() => {
    const b = this.bind();
    return this.area() === 'month'
      ? [`translate(157 ${b + 3})`]
      : [`translate(36 ${b + 4}) scale(-1 1)`, `translate(176 ${146}) rotate(180)`];
  });

  protected readonly arches = computed(() => {
    const b = this.bind();
    const c = this.colors();
    const arc = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
    if (this.area() === 'month') {
      return [
        { d: arc(146, b + 21, 10), c: c[0], w: 2.2 },
        { d: arc(146, b + 21, 7.2), c: c[1], w: 2.2 },
        { d: arc(146, b + 21, 4.4), c: c[2], w: 2.2 },
      ];
    }
    return [
      { d: arc(20, 152, 28), c: c[0], w: 5 },
      { d: arc(20, 152, 21), c: c[1], w: 5 },
      { d: arc(20, 152, 14), c: c[2], w: 5 },
    ];
  });

  protected readonly suns = computed(() =>
    this.area() === 'month' ? [{ x: 129, y: this.bind() + 7, r: 2.4 }] : [{ x: 190, y: this.bind() + 14, r: 7 }],
  );

  protected readonly shapes = computed<Shape[]>(() => {
    const b = this.bind();
    const c = [...this.colors()];
    // [formas, tamaño mín-máx en mm, cantidad en el mes, cantidad en franjas de portada, cantidad en laterales]
    const cfg: Record<string, [Shape['kind'][], [number, number], number, number, number]> = {
      estrellas: [['star'], [1.6, 3.6], 9, 10, 4],
      corazones: [['heart'], [1.6, 3.4], 9, 11, 4],
      copos: [['flake'], [2, 4.2], 9, 10, 4],
      puntos: [['dot'], [1.4, 4.2], 14, 16, 6],
      confeti: [['circle', 'rect', 'tri', 'circle'], [1, 2.4], 16, 18, 7],
    };
    const [kinds, size, nMonth, nBand, nSide] = cfg[this.kind()] ?? cfg['confeti'];
    if (this.area() === 'month') return scatter(7, nMonth, 116, 156, b + 2, b + 20, c, kinds, size);
    return [
      ...scatter(11, nBand, 8, 202, b + 1.5, b + 6.5, c, kinds, size),
      ...scatter(13, nBand, 8, 202, 139, 146, c, kinds, size),
      ...scatter(17, nSide, 6, 34, b + 10, 136, c, kinds, size),
      ...scatter(19, nSide, 176, 204, b + 10, 136, c, kinds, size),
    ];
  });

  protected heart(s: Shape) {
    const r = s.s / 2;
    const { x, y } = s;
    const f = (n: number) => n.toFixed(2);
    return `M${f(x)} ${f(y + r * 0.8)} C ${f(x - r * 1.3)} ${f(y - r * 0.1)} ${f(x - r * 0.6)} ${f(y - r * 1.05)} ${f(x)} ${f(y - r * 0.35)} C ${f(x + r * 0.6)} ${f(y - r * 1.05)} ${f(x + r * 1.3)} ${f(y - r * 0.1)} ${f(x)} ${f(y + r * 0.8)} Z`;
  }

  protected flake(s: Shape) {
    const r = s.s / 2;
    return [0, 60, 120]
      .map((deg) => {
        const a = ((deg + s.r) * Math.PI) / 180;
        const dx = Math.cos(a) * r;
        const dy = Math.sin(a) * r;
        return `M${(s.x - dx).toFixed(2)} ${(s.y - dy).toFixed(2)} L${(s.x + dx).toFixed(2)} ${(s.y + dy).toFixed(2)}`;
      })
      .join(' ');
  }

  protected tri(s: Shape) {
    const a = (s.r * Math.PI) / 180;
    const p = [0, 1, 2].map((i) => {
      const t = a + (i * 2 * Math.PI) / 3;
      return `${(s.x + Math.cos(t) * s.s * 0.6).toFixed(2)} ${(s.y + Math.sin(t) * s.s * 0.6).toFixed(2)}`;
    });
    return `M${p[0]} L${p[1]} L${p[2]} Z`;
  }

  protected star(s: Shape) {
    const r = s.s / 2;
    const k = r * 0.28;
    const { x, y } = s;
    return `M${x} ${y - r} Q ${x + k} ${y - k} ${x + r} ${y} Q ${x + k} ${y + k} ${x} ${y + r} Q ${x - k} ${y + k} ${x - r} ${y} Q ${x - k} ${y - k} ${x} ${y - r} Z`;
  }
}
