import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CalendarStore } from '../core/calendar.store';
import { BackPage } from './back-page';
import { CoverPage } from './cover-page';
import { MonthPage } from './month-page';

/** Página n del calendario: 0 = portada, 1-12 = meses, 13 = contraportada. */
@Component({
  selector: 'app-calendar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CoverPage, MonthPage, BackPage],
  host: {
    class: 'calendar-page',
    '[style]': 'vars()',
  },
  styles: `:host { display: block; width: 210mm; height: 150mm; }`,
  template: `
    @if (index() === 0) {
      <app-cover-page />
    } @else if (index() === 13) {
      <app-back-page />
    } @else {
      <app-month-page [month]="index()" />
    }
  `,
})
export class CalendarPage {
  readonly index = input.required<number>();
  protected readonly store = inject(CalendarStore);

  /** Variables CSS con los tokens de estilo; todas las páginas las usan. */
  protected readonly vars = computed(() => {
    const s = this.store.style();
    const q = (f: string) => `"${f}"`;
    const texts: Record<string, string> = {};
    for (const [k, v] of Object.entries(s.texts)) {
      texts[`--fs-${k}`] = String(v.size);
      texts[`--al-${k}`] = v.align;
    }
    return {
      ...texts,
      '--font-main': q(this.store.fontMain()),
      '--font-script': q(this.store.fontScript()),
      '--font-cover': q(this.store.fontCover()),
      '--ink': s.ink,
      '--ink-soft': s.inkSoft,
      '--page-bg': s.pageBg,
      '--back-bg': s.backBg,
      '--deco-1': s.decorColors[0],
      '--deco-2': s.decorColors[1],
      '--deco-3': s.decorColors[2],
      '--title-weight': String(s.titleWeight),
      '--title-spacing': `${s.titleSpacing}em`,
      '--title-transform': s.titleUpper ? 'uppercase' : 'none',
      '--cell-radius': `${s.cellRadius}mm`,
      '--cell-alpha': String(s.cellAlpha),
    };
  });
}
