import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CalendarStore } from './core/calendar.store';
import { FontLoader } from './core/fonts';
import { MONTH_NAMES, PAGE_COUNT } from './core/models';
import { exportPagesToPdf } from './core/pdf-export';
import { EditorPanel } from './editor/editor-panel';
import { CalendarPage } from './pages/calendar-page';

const MM_TO_PX = 96 / 25.4;
const PAGE_W_PX = 210 * MM_TO_PX;
const PAGE_H_PX = 150 * MM_TO_PX;
const THUMB_SCALE = 0.16;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditorPanel, CalendarPage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '(window:keydown)': 'onKey($event)' },
})
export class App {
  protected readonly store = inject(CalendarStore);
  protected readonly pages = Array.from({ length: PAGE_COUNT }, (_, i) => i);
  protected readonly pageW = PAGE_W_PX;
  protected readonly pageH = PAGE_H_PX;
  protected readonly thumbScale = THUMB_SCALE;

  protected readonly view = signal<'page' | 'grid'>('page');
  /** Escala que hace caber la página en el área de vista previa. */
  private readonly fitScale = signal(1);
  /** Zoom relativo al ajuste (1 = página completa visible). */
  protected readonly zoom = signal(1);
  protected readonly scale = computed(() => this.fitScale() * this.zoom());
  protected readonly zoomPct = computed(() => `${Math.round(this.zoom() * 100)}%`);
  protected readonly panning = signal(false);
  private pan: { x: number; y: number; sl: number; st: number; id: number } | null = null;
  protected readonly gridScale = signal(0.4);

  protected readonly exporting = signal(false);
  protected readonly progress = signal({ done: 0, total: PAGE_COUNT });

  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly exportRoot = viewChild<ElementRef<HTMLElement>>('exportRoot');

  protected readonly pageTitle = computed(() => {
    const p = this.store.page();
    if (p === 0) return 'Portada';
    if (p === 13) return 'Contraportada';
    return `${MONTH_NAMES[p - 1]} ${this.store.year()}`;
  });

  private readonly fonts = inject(FontLoader);

  constructor() {
    // Descarga las fuentes elegidas (las que no vienen incluidas en el build).
    effect(() => {
      this.fonts.ensure(this.store.fontMain());
      this.fonts.ensure(this.store.fontScript());
      this.fonts.ensure(this.store.fontCover());
    });
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.stage()?.nativeElement;
      if (!el) return;
      const ro = new ResizeObserver(() => this.fit(el));
      ro.observe(el);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  private fit(el: HTMLElement) {
    const pad = 48;
    const w = el.clientWidth - pad;
    const h = el.clientHeight - pad;
    this.fitScale.set(Math.max(0.2, Math.min(w / PAGE_W_PX, h / PAGE_H_PX)));
    const cols = w > 1100 ? 3 : w > 640 ? 2 : 1;
    this.gridScale.set(Math.max(0.15, (w - (cols - 1) * 20) / cols / PAGE_W_PX));
  }

  protected go(delta: number) {
    this.store.page.update((p) => Math.min(PAGE_COUNT - 1, Math.max(0, p + delta)));
  }

  protected select(i: number) {
    this.store.page.set(i);
    this.view.set('page');
  }

  protected label(i: number) {
    if (i === 0) return 'Portada';
    if (i === 13) return 'Final';
    return MONTH_NAMES[i - 1].slice(0, 3);
  }

  protected setYear(ev: Event) {
    this.store.setYear(parseInt((ev.target as HTMLInputElement).value, 10));
  }

  // ---- zoom de la vista previa ----
  private static readonly ZOOM_MIN = 0.5;
  private static readonly ZOOM_MAX = 6;

  protected zoomBy(factor: number) {
    const el = this.stage()?.nativeElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.zoomAt(this.zoom() * factor, r.left + r.width / 2, r.top + r.height / 2);
  }

  protected resetZoom() {
    this.zoom.set(1);
  }

  /** Ctrl + rueda (o pellizco en el touchpad) hace zoom hacia el puntero. */
  protected onWheel(ev: WheelEvent) {
    if (this.view() !== 'page' || !(ev.ctrlKey || ev.metaKey)) return;
    ev.preventDefault();
    this.zoomAt(this.zoom() * Math.exp(-ev.deltaY * 0.0018), ev.clientX, ev.clientY);
  }

  private zoomAt(target: number, cx: number, cy: number) {
    const el = this.stage()?.nativeElement;
    const holder = el?.querySelector<HTMLElement>('.page-holder');
    const next = Math.min(App.ZOOM_MAX, Math.max(App.ZOOM_MIN, target));
    if (!el || !holder) {
      this.zoom.set(next);
      return;
    }
    const r = el.getBoundingClientRect();
    const old = this.scale();
    // Punto de la página (en px sin escalar) que está bajo el puntero.
    const ux = (el.scrollLeft + cx - r.left - holder.offsetLeft) / old;
    const uy = (el.scrollTop + cy - r.top - holder.offsetTop) / old;
    this.zoom.set(next);
    requestAnimationFrame(() => {
      const s = this.scale();
      el.scrollLeft = holder.offsetLeft + ux * s - (cx - r.left);
      el.scrollTop = holder.offsetTop + uy * s - (cy - r.top);
    });
  }

  /** Arrastrar para desplazarse cuando la página es más grande que el área visible. */
  protected onPanStart(ev: PointerEvent) {
    const el = this.stage()?.nativeElement;
    if (!el || ev.button !== 0) return;
    if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return;
    if ((ev.target as HTMLElement).closest('button')) return;
    this.pan = { x: ev.clientX, y: ev.clientY, sl: el.scrollLeft, st: el.scrollTop, id: ev.pointerId };
    el.setPointerCapture(ev.pointerId);
    this.panning.set(true);
  }

  protected onPanMove(ev: PointerEvent) {
    const el = this.stage()?.nativeElement;
    if (!el || !this.pan || ev.pointerId !== this.pan.id) return;
    el.scrollLeft = this.pan.sl - (ev.clientX - this.pan.x);
    el.scrollTop = this.pan.st - (ev.clientY - this.pan.y);
  }

  protected onPanEnd() {
    this.pan = null;
    this.panning.set(false);
  }

  protected onKey(ev: KeyboardEvent) {
    const t = ev.target as HTMLElement;
    if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    if (this.view() === 'page' && !ev.ctrlKey && !ev.metaKey) {
      if (ev.key === '+' || ev.key === '=') this.zoomBy(1.25);
      if (ev.key === '-') this.zoomBy(1 / 1.25);
      if (ev.key === '0') this.resetZoom();
    }
    if (ev.key === 'ArrowRight') this.go(1);
    if (ev.key === 'ArrowLeft') this.go(-1);
  }

  protected async exportPdf(scale = 3) {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.progress.set({ done: 0, total: PAGE_COUNT });
    try {
      // Espera a que se pinte el contenedor de exportación.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const root = this.exportRoot()?.nativeElement;
      if (!root) throw new Error('Sin contenedor de exportación');
      const pages = Array.from(root.querySelectorAll<HTMLElement>('.calendar-page'));
      const fonts = { main: this.store.fontMain(), script: this.store.fontScript(), cover: this.store.fontCover() };
      await Promise.all(Object.values(fonts).map((f) => this.fonts.ensure(f)));
      await exportPagesToPdf(pages, `calendario-${this.store.year()}.pdf`, scale, fonts, (done, total) =>
        this.progress.set({ done, total }),
      );
    } catch (e) {
      console.error(e);
      alert('No se pudo generar el PDF. Revisa la consola para más detalles.');
    } finally {
      this.exporting.set(false);
    }
  }
}
