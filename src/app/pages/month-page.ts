import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CalendarStore } from '../core/calendar.store';
import { DayCell, buildMonthGrid, daysInMonth } from '../core/calendar-utils';
import { CalEvent, MONTH_NAMES, weekdayNames } from '../core/models';
import { EventIcon } from '../shared/event-icon';
import { PhotoBox } from '../shared/photo-box';
import { photoBackground } from '../core/image-utils';
import { BindingGuide } from './binding-guide';
import { Decor } from './decor';

/** Medidas fijas del layout en mm (ver month-page.scss). */
const PAD_LEFT = 11;
const PAD_RIGHT = 4;
const PHOTO_COL = 48;
const COL_GAP = 3;
const GRID_GAP = 0.7;
/** Alto fijo del encabezado y pie (sin escalar), en mm: margen sup. 1 + margen bajo título 2 + inferior 4 */
const FIXED_V = 7;
const MAIN_W = 210 - PAD_LEFT - PAD_RIGHT - PHOTO_COL - COL_GAP;
const CELL_W = (MAIN_W - 6 * GRID_GAP) / 7;
/** Sin columna de fotos la cuadrícula usa todo el ancho, con márgenes simétricos. */
const CELL_W_FULL = (210 - 2 * PAD_LEFT - 6 * GRID_GAP) / 7;

interface CellView extends DayCell {
  fontMm: number;
  festLines: string[][];
  birthLines: string[][];
  deathLines: string[][];
}

interface PhotoSpot {
  ev: CalEvent;
  x: number;
  y: number;
  d: number;
}

/** Divide nombres largos en dos líneas por el espacio más cercano al centro. */
function wrapName(name: string, max = 12): string[] {
  const n = name.trim();
  if (n.length <= max || !n.includes(' ')) return [n];
  const mid = n.length / 2;
  let best = -1;
  for (let i = 0; i < n.length; i++) {
    if (n[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return [n.slice(0, best), n.slice(best + 1)];
}

@Component({
  selector: 'app-month-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EventIcon, PhotoBox, BindingGuide, Decor],
  templateUrl: './month-page.html',
  styleUrl: './month-page.scss',
})
export class MonthPage {
  protected readonly store = inject(CalendarStore);
  /** 1 - 12 */
  readonly month = input.required<number>();

  protected readonly weekdays = computed(() => weekdayNames(this.store.weekStart()));
  protected readonly name = computed(() => MONTH_NAMES[this.month() - 1]);
  protected readonly st = computed(() => this.store.styleFor(this.month()));

  /** Fondo de imagen: el del mes o, si no tiene, el general. */
  protected readonly bgPhoto = computed(() => this.cfg().background ?? this.st().background);
  protected readonly bgStyle = computed(() => {
    const p = this.bgPhoto();
    return p ? photoBackground(p, 210 / 150) : {};
  });
  /** Con fondo propio no se dibujan las decoraciones de la plantilla. */
  protected readonly decorKind = computed(() => (this.bgPhoto() ? 'ninguna' : this.st().decor));
  protected readonly shift = computed(() => {
    const s = this.st();
    return s.contentX || s.contentY ? `translate(${s.contentX}mm, ${s.contentY}mm)` : null;
  });
  protected readonly cfg = computed(() => this.store.months()[this.month() - 1]);

  protected readonly rows = computed(() => this.cells().length / 7);

  /** Alturas de encabezado, días y pie según el tamaño de letra elegido. */
  protected readonly layout = computed(() => {
    const t = this.st().texts;
    const header = 13 * t.title.size + 6.5 * t.subtitle.size;
    const weekdays = 5.5 * Math.max(0.6, t.weekdays.size);
    const caption = 2.4 + 4.6 * t.caption.size;
    return { header, weekdays, caption, reserved: FIXED_V + header + weekdays + caption };
  });

  protected readonly alignClasses = computed(() => {
    const t = this.st().texts;
    return `num-${t.numbers.align} names-${t.names.align} hol-${t.holidays.align}`;
  });

  protected readonly cells = computed<CellView[]>(() => {
    const grid = buildMonthGrid(this.store.year(), this.month(), this.store.events(), this.store.weekStart());
    const rows = grid.length / 7;
    const gridH = 150 - this.store.bindingMm() - this.layout().reserved;
    const cellH = (gridH - (rows - 1) * GRID_GAP) / rows;
    const cellW = this.store.showPhotos() ? CELL_W : CELL_W_FULL;
    return grid.map((c) => {
      const festLines = c.festivos.map((e) => wrapName(e.name, 11));
      const birthLines = c.births.map((e) => wrapName(e.name));
      const deathLines = c.deaths.map((e) => wrapName(e.name));
      const all = [...festLines, ...birthLines, ...deathLines].flat();
      const blobs = (birthLines.length ? 1 : 0) + (deathLines.length ? 1 : 0);
      let fontMm = 3.9;
      if (all.length) {
        const longest = Math.max(...all.map((l) => l.length));
        const byWidth = (cellW * 0.86) / (longest * 0.44);
        const reserved = c.births.length || c.deaths.length ? 6.4 : 6;
        const byHeight = (cellH - reserved - blobs * 1.4) / (all.length * 1.04);
        fontMm = Math.max(1.8, Math.min(3.9, byWidth, byHeight));
        if (!blobs) fontMm = Math.min(fontMm, 3.2);
      }
      // El tamaño elegido por el usuario se aplica en CSS sobre este valor (--fs-names / --fs-holidays).
      return { ...c, fontMm, festLines, birthLines, deathLines };
    });
  });

  /** Fotos en zigzag sobre la columna derecha, como en el calendario de referencia. */
  protected readonly photos = computed<PhotoSpot[]>(() => {
    if (!this.store.showPhotos()) return [];
    const last = daysInMonth(this.store.year(), this.month());
    const evs = this.store
      .sortedEvents()
      .filter((e) => e.month === this.month() && e.day <= last && e.type !== 'festivo' && e.photo);
    const n = evs.length;
    if (!n) return [];
    const colH = 150 - this.store.bindingMm() - 7;
    const d = Math.max(12, Math.min(30, colH / (1 + 0.74 * (n - 1))));
    const step = n > 1 ? Math.min((colH - d) / (n - 1), d * 0.86) : 0;
    const top = (colH - (d + step * (n - 1))) / 2;
    const shift = Math.min(d * 0.42, PHOTO_COL - d);
    const x0 = (PHOTO_COL - d - shift) / 2;
    return evs.map((ev, i) => ({ ev, d, y: top + i * step, x: x0 + (i % 2 ? shift : 0) }));
  });

  protected linesOf(groups: string[][]): string[] {
    return groups.flat();
  }
}
