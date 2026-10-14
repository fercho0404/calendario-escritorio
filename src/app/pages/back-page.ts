import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CalendarStore } from '../core/calendar.store';
import { PhotoBox } from '../shared/photo-box';
import { BindingGuide } from './binding-guide';

const PHOTO_W = 146;

@Component({
  selector: 'app-back-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhotoBox, BindingGuide],
  template: `
    <div class="cal-page">
      <div class="disc d1" [style.top.mm]="store.bindingMm() + 4"></div>
      <div class="disc d2"></div>
      <app-binding-guide />

      <div class="photo" [style.top.mm]="photoTop()" [style.width.mm]="photoW" [style.height.mm]="photoH()">
        <app-photo-box [photo]="store.back().photo" [aspect]="photoW / photoH()" placeholder="Sube la foto de contraportada" />
      </div>

      <div class="foot">
        <span class="year">{{ store.year() }}</span>
        <span class="rule"></span>
        <span class="label">{{ store.back().label }}</span>
      </div>
      <span class="vrule" [style.top.mm]="photoTop() + 6"></span>
    </div>
  `,
  styles: `
    :host { display: block; }
    .cal-page { position: relative; width: 210mm; height: 150mm; overflow: hidden; background: #fbf8f1;
      font-family: Montserrat, sans-serif; color: #4f3a37; }
    .disc { position: absolute; border-radius: 50%; }
    .d1 { right: 18mm; width: 58mm; height: 58mm; background: #d8b9b3; opacity: .8; }
    .d2 { left: 22mm; bottom: 24mm; width: 46mm; height: 46mm; background: #e2dcd9; }
    .photo { position: absolute; left: 50%; transform: translateX(-50%);
      border-radius: 1.2mm 3mm 1.5mm 2.6mm; overflow: hidden; }
    .foot { position: absolute; left: 14mm; right: 14mm; bottom: 7mm; display: flex; align-items: center; gap: 5mm; }
    .year { font-size: 10mm; font-weight: 300; letter-spacing: .06em; line-height: 1; }
    .rule { flex: 1; height: 0.35mm; background: #b9908a; }
    .label { font-size: 4.2mm; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
    .vrule { position: absolute; left: 14mm; width: 0.35mm; height: 50mm; background: #b9908a; }
  `,
})
export class BackPage {
  protected readonly store = inject(CalendarStore);
  protected readonly photoW = PHOTO_W;
  protected readonly photoTop = computed(() => this.store.bindingMm() + 7);
  protected readonly photoH = computed(() => Math.min(96, 150 - this.photoTop() - 24));
}
