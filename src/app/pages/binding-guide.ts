import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CalendarStore } from '../core/calendar.store';
import { PAGE_W_MM } from '../core/models';

/** Guía visual del argollado (perforaciones). Nunca se exporta al PDF. */
@Component({
  selector: 'app-binding-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-html2canvas-ignore': 'true' },
  styles: `
    :host { position: absolute; inset: 0; pointer-events: none; z-index: 20; }
    .hole { position: absolute; top: 4.2mm; width: 2.6mm; height: 3.6mm; border-radius: 0.8mm;
      background: #3b3533; opacity: .78; }
    .line { position: absolute; left: 0; right: 0; border-top: 0.25mm dashed rgba(214, 72, 72, .55); }
    .tag { position: absolute; right: 2mm; font: 500 2.1mm Montserrat, sans-serif; color: rgba(214, 72, 72, .75);
      transform: translateY(20%); letter-spacing: .04em; }
  `,
  template: `
    @if (store.showGuides()) {
      @for (x of holes(); track $index) {
        <span class="hole" [style.left.mm]="x"></span>
      }
      <div class="line" [style.top.mm]="store.bindingMm()"></div>
      <span class="tag" [style.top.mm]="store.bindingMm()">zona de argollado · {{ store.bindingMm() }} mm</span>
    }
  `,
})
export class BindingGuide {
  protected readonly store = inject(CalendarStore);
  /** Paso típico de anillado doble alambre 3:1 = 8,47 mm */
  protected readonly holes = computed(() => {
    const pitch = 8.47;
    const n = Math.floor((PAGE_W_MM - 14) / pitch) + 1;
    const start = (PAGE_W_MM - (n - 1) * pitch) / 2 - 1.3;
    return Array.from({ length: n }, (_, i) => start + i * pitch);
  });
}
