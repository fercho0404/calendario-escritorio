import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CalendarStore } from '../core/calendar.store';
import { PhotoBox } from '../shared/photo-box';
import { BindingGuide } from './binding-guide';

const FRAME_W = 124;
const FRAME_BORDER = 2.6;

@Component({
  selector: 'app-cover-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhotoBox, BindingGuide],
  template: `
    <div class="cal-page" [style.--bind]="store.bindingMm() + 'mm'">
      <div class="wash w1"></div>
      <div class="wash w2"></div>
      <div class="wash w3"></div>
      <app-binding-guide />

      <div class="frame" [style.top.mm]="frameTop()" [style.width.mm]="frameW" [style.height.mm]="frameH()">
        <app-photo-box [photo]="store.cover().photo" [aspect]="photoAspect()" placeholder="Sube la foto de portada" />
      </div>

      <div class="tag" [style.top.mm]="frameTop() - 4.2" [style.background]="store.cover().tagColor">
        CALENDARIO {{ store.year() }}
      </div>

      <div class="label" [style.font-size.mm]="labelSize()" [style.top.mm]="frameTop() + frameH() - labelSize() * 0.55">
        {{ store.cover().label }}
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .cal-page { position: relative; width: 210mm; height: 150mm; overflow: hidden; background: #fff; }
    .wash { position: absolute; border-radius: 50%; }
    .w1 { left: -25mm; top: -10mm; width: 120mm; height: 75mm;
      background: radial-gradient(ellipse at center, rgba(205, 214, 170, .75) 0%, rgba(205, 214, 170, 0) 68%); }
    .w2 { left: -30mm; bottom: -30mm; width: 110mm; height: 100mm;
      background: radial-gradient(ellipse at center, rgba(176, 207, 228, .8) 0%, rgba(176, 207, 228, 0) 66%); }
    .w3 { right: -30mm; top: 0; width: 100mm; height: 110mm;
      background: radial-gradient(ellipse at center, rgba(240, 205, 195, .7) 0%, rgba(240, 205, 195, 0) 66%); }
    .frame { position: absolute; left: 50%; transform: translateX(-50%);
      background: #fff; padding: 2.6mm; box-sizing: border-box;
      box-shadow: 0 0.5mm 1.8mm rgba(60, 40, 35, .22); }
    .tag { position: absolute; left: 50%; transform: translateX(-50%); padding: 1.6mm 4.5mm;
      font: 600 4.4mm/1 var(--font-main, Montserrat), sans-serif; letter-spacing: .09em; color: #fff; white-space: nowrap;
      box-shadow: 0 0.3mm 0.8mm rgba(0, 0, 0, .08); }
    .label { position: absolute; right: 14mm; font-family: var(--font-cover, Allura), cursive; line-height: 1.1; color: #5a2a2e;
      white-space: nowrap; }
  `,
})
export class CoverPage {
  protected readonly store = inject(CalendarStore);
  protected readonly frameW = FRAME_W;
  protected readonly frameTop = computed(() => this.store.bindingMm() + 8.5);
  protected readonly frameH = computed(() => Math.min(86, 150 - this.frameTop() - 20));
  protected readonly photoAspect = computed(
    () => (FRAME_W - 2 * FRAME_BORDER) / (this.frameH() - 2 * FRAME_BORDER),
  );
  protected readonly labelSize = computed(() => {
    const len = Math.max(1, this.store.cover().label.length);
    return Math.max(8, Math.min(19, 175 / (len * 0.42)));
  });
}
