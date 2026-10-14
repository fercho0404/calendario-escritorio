import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
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
    '[style.--font-main]': 'quote(store.fontMain())',
    '[style.--font-script]': 'quote(store.fontScript())',
    '[style.--font-cover]': 'quote(store.fontCover())',
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
  protected quote(family: string) {
    return `"${family}"`;
  }
}
