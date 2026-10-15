import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CalendarStore } from '../core/calendar.store';
import { photoBackground } from '../core/image-utils';
import { PhotoBox } from '../shared/photo-box';
import { BindingGuide } from './binding-guide';
import { Decor } from './decor';

const FRAME_W = 124;

@Component({
  selector: 'app-cover-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhotoBox, BindingGuide, Decor],
  template: `
    <div class="cal-page" [class]="'frame-' + st().coverFrame">
      @if (store.cover().background; as bg) {
        <div class="bg-image" [style]="bgStyle()"></div>
      } @else {
        <app-decor [kind]="st().decor === 'washi' ? 'ninguna' : st().decor" area="cover" [bind]="store.bindingMm()" [colors]="st().decorColors" />
      }
      <app-binding-guide />

      <div class="frame" [style.top.mm]="frameTop()" [style.width.mm]="frameW" [style.height.mm]="frameH()">
        <app-photo-box [photo]="store.cover().photo" [aspect]="photoAspect()" placeholder="Sube la foto de portada" />
      </div>
      @if (st().decor === 'washi' && !store.cover().background) {
        <!-- La cinta washi va encima de la foto -->
        <app-decor class="over" kind="washi" area="cover" [bind]="store.bindingMm()" [colors]="st().decorColors" />
      }

      <div class="tag" [class]="'tag-' + texts().coverTag.align" [style.top.mm]="tagTop()" [style.background]="store.cover().tagColor">
        CALENDARIO {{ store.year() }}
      </div>

      <div class="label" [class]="'label-' + texts().coverLabel.align" [class.dragging]="dragging()"
        [style.font-size.mm]="labelSize()" [style.top.mm]="frameTop() + frameH() - labelSize() * 0.55"
        [style.transform]="labelTransform()" title="Arrastra para mover la firma"
        (pointerdown)="onLabelDown($event)" (pointermove)="onLabelMove($event)"
        (pointerup)="onLabelUp()" (pointercancel)="onLabelUp()">
        {{ store.cover().label }}
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .cal-page { position: relative; width: 210mm; height: 150mm; overflow: hidden; background: var(--page-bg, #fff); }
    .bg-image { position: absolute; inset: 0; }
    .over { z-index: 1; }
    .frame { position: absolute; left: 50%; transform: translateX(-50%); box-sizing: border-box; }
    .frame app-photo-box { border-radius: inherit; overflow: hidden; }
    .frame-polaroid .frame { background: #fff; padding: 2.6mm; box-shadow: 0 0.5mm 1.8mm rgba(60, 40, 35, .22); }
    .frame-simple .frame { border-radius: 2.5mm; overflow: hidden; box-shadow: 0 0.6mm 2mm rgba(60, 40, 35, .18); }
    .frame-arco .frame { border-radius: 62mm 62mm 2mm 2mm / 44mm 44mm 2mm 2mm; overflow: hidden;
      box-shadow: 0 0 0 1.4mm #fff, 0 0.6mm 2mm 1.4mm rgba(60, 40, 35, .16); }
    .tag { position: absolute; padding: 1.6mm 4.5mm; z-index: 2;
      font: 600 calc(4.4mm * var(--fs-coverTag, 1))/1 var(--font-main, Montserrat), sans-serif; letter-spacing: .09em; color: #fff; white-space: nowrap;
      box-shadow: 0 0.3mm 0.8mm rgba(0, 0, 0, .08); }
    .tag-center { left: 50%; transform: translateX(-50%); }
    .tag-left { left: 43mm; }
    .tag-right { right: 43mm; }
    .label { position: absolute; font-family: var(--font-cover, Allura), cursive; line-height: 1.1;
      color: var(--ink, #5a2a2e); white-space: nowrap; z-index: 2; cursor: move; touch-action: none;
      border-radius: 1mm; }
    .label:hover, .label.dragging { outline: 0.3mm dashed rgba(138, 79, 71, .6); outline-offset: 1mm; }
    .label-right { right: 14mm; }
    .label-left { left: 14mm; }
    .label-center { left: 50%; }
  `,
})
export class CoverPage {
  protected readonly store = inject(CalendarStore);
  protected readonly st = computed(() => this.store.styleFor(0));
  protected readonly frameW = FRAME_W;
  protected readonly frameTop = computed(() => this.store.bindingMm() + 8.5);
  protected readonly frameH = computed(() => Math.min(86, 150 - this.frameTop() - 20));
  protected readonly photoAspect = computed(() => {
    const border = this.st().coverFrame === 'polaroid' ? 2.6 : 0;
    return (FRAME_W - 2 * border) / (this.frameH() - 2 * border);
  });
  protected readonly bgStyle = computed(() => {
    const bg = this.store.cover().background;
    return bg ? photoBackground(bg, 210 / 150) : {};
  });
  protected readonly texts = computed(() => this.st().texts);

  // ---- mover la firma ----
  protected readonly labelTransform = computed(() => {
    const c = this.store.cover();
    const center = this.texts().coverLabel.align === 'center' ? 'translateX(-50%) ' : '';
    return `${center}translate(${c.labelX ?? 0}mm, ${c.labelY ?? 0}mm)`;
  });
  protected readonly dragging = signal(false);
  private drag: { x: number; y: number; lx: number; ly: number; k: number; id: number } | null = null;

  protected onLabelDown(ev: PointerEvent) {
    const el = ev.currentTarget as HTMLElement;
    if (ev.button !== 0 || el.closest('.export-root')) return;
    ev.preventDefault();
    ev.stopPropagation();
    const page = el.closest('.cal-page') as HTMLElement;
    // px de pantalla por mm, teniendo en cuenta el zoom de la vista previa.
    const k = page.getBoundingClientRect().width / 210;
    const c = this.store.cover();
    this.drag = { x: ev.clientX, y: ev.clientY, lx: c.labelX ?? 0, ly: c.labelY ?? 0, k, id: ev.pointerId };
    el.setPointerCapture(ev.pointerId);
    this.dragging.set(true);
  }

  protected onLabelMove(ev: PointerEvent) {
    const d = this.drag;
    if (!d || ev.pointerId !== d.id) return;
    const snap = (v: number) => Math.round(v * 2) / 2;
    const x = Math.max(-150, Math.min(150, snap(d.lx + (ev.clientX - d.x) / d.k)));
    const y = Math.max(-120, Math.min(80, snap(d.ly + (ev.clientY - d.y) / d.k)));
    this.store.updateCover({ labelX: x, labelY: y });
  }

  protected onLabelUp() {
    this.drag = null;
    this.dragging.set(false);
  }
  protected readonly tagTop = computed(() => this.frameTop() - (4.4 * this.texts().coverTag.size + 3.2) * 0.55);
  protected readonly labelSize = computed(() => {
    const len = Math.max(1, this.store.cover().label.length);
    return Math.max(8, Math.min(19, 175 / (len * 0.42))) * this.texts().coverLabel.size;
  });
}
