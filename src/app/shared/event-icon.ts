import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EventType } from '../core/models';

/** Íconos de los tipos de fecha (SVG en línea para que se exporten a PDF). */
@Component({
  selector: 'app-event-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `:host { display: inline-block; line-height: 0; } svg { width: 100%; height: 100%; overflow: visible; }`,
  template: `
    @switch (type()) {
      @case ('cumpleanos') {
        <svg viewBox="0 0 40 46" aria-label="Cumpleaños">
          <path d="M11 22 C 12 30, 17 34, 19 44" fill="none" stroke="#9a8f8a" stroke-width="0.8" />
          <path d="M21 19 C 21 28, 20 36, 19 44" fill="none" stroke="#9a8f8a" stroke-width="0.8" />
          <path d="M30 26 C 28 33, 22 38, 19 44" fill="none" stroke="#9a8f8a" stroke-width="0.8" />
          <ellipse cx="11" cy="13" rx="8" ry="9.5" fill="#f2a43a" />
          <path d="M9.6 22.2 L12.4 22.2 L11 20.6 Z" fill="#f2a43a" />
          <ellipse cx="21" cy="10" rx="8" ry="9.5" fill="#ef6f5e" />
          <path d="M19.6 19.4 L22.4 19.4 L21 17.8 Z" fill="#ef6f5e" />
          <ellipse cx="29.5" cy="17" rx="8" ry="9.5" fill="#6fb3e3" />
          <path d="M28.1 26.4 L30.9 26.4 L29.5 24.8 Z" fill="#6fb3e3" />
          <ellipse cx="8" cy="9.5" rx="2" ry="3.2" fill="#fff" opacity="0.45" />
          <ellipse cx="18" cy="6.5" rx="2" ry="3.2" fill="#fff" opacity="0.45" />
          <ellipse cx="26.5" cy="13.5" rx="2" ry="3.2" fill="#fff" opacity="0.45" />
        </svg>
      }
      @case ('festivo') {
        <svg viewBox="0 0 40 40" aria-label="Festivo">
          <path d="M3 9 Q 20 15 37 9" fill="none" stroke="#9a8f8a" stroke-width="0.9" />
          <path d="M6 10 L12 11.8 L8 22 Z" fill="#f2c94c" />
          <path d="M13.5 12.2 L20 13 L16.5 24 Z" fill="#5b8fd6" />
          <path d="M21.5 13 L28 12 L25.5 23.5 Z" fill="#e85d5d" />
          <path d="M29.5 11.6 L35 9.8 L33.5 21 Z" fill="#f2c94c" />
          <circle cx="11" cy="31" r="1.4" fill="#e85d5d" />
          <circle cx="22" cy="34" r="1.1" fill="#5b8fd6" />
          <circle cx="31" cy="29" r="1.3" fill="#f2c94c" />
          <path d="M17 28 l1.2 2.6 l2.6 1.2 l-2.6 1.2 l-1.2 2.6 l-1.2 -2.6 l-2.6 -1.2 l2.6 -1.2 Z" fill="#f2a43a" />
        </svg>
      }
      @case ('fallecimiento') {
        <svg viewBox="0 0 40 46" aria-label="Fallecimiento">
          <path d="M20 3 C 24.5 8.5, 24 13, 20 15.5 C 16 13, 15.5 8.5, 20 3 Z" fill="#f4b740" />
          <path d="M20 7.5 C 22 10.3, 21.7 12.4, 20 13.8 C 18.3 12.4, 18 10.3, 20 7.5 Z" fill="#fff3c4" />
          <line x1="20" y1="15.5" x2="20" y2="18" stroke="#5e4440" stroke-width="0.9" />
          <rect x="14.5" y="18" width="11" height="21" rx="1.5" fill="#f6f1e7" stroke="#b8aaa0" stroke-width="0.8" />
          <path d="M14.5 21 q 2 2.5 0 5" fill="none" stroke="#e9e0d2" stroke-width="1.2" />
          <ellipse cx="20" cy="40.5" rx="10" ry="2.6" fill="#b8aaa0" />
          <path d="M8 28 c 2 -2 4 -2 6 0" fill="none" stroke="#8c7b74" stroke-width="0.7" opacity="0.6" />
          <path d="M26 28 c 2 -2 4 -2 6 0" fill="none" stroke="#8c7b74" stroke-width="0.7" opacity="0.6" />
        </svg>
      }
    }
  `,
})
export class EventIcon {
  readonly type = input.required<EventType>();
}
