import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CalendarStore } from './core/calendar.store';
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
  protected readonly scale = signal(1);
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

  constructor() {
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
    this.scale.set(Math.max(0.2, Math.min(w / PAGE_W_PX, h / PAGE_H_PX)));
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

  protected onKey(ev: KeyboardEvent) {
    const t = ev.target as HTMLElement;
    if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
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
