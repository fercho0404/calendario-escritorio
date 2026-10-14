import { Injectable, computed, effect, signal } from '@angular/core';
import { colombianHolidays, daysInMonth } from './calendar-utils';
import {
  BackConfig,
  CalEvent,
  CoverConfig,
  MonthConfig,
  ProjectData,
  WeekStart,
  defaultBack,
  defaultCover,
  defaultMonths,
  newId,
} from './models';
import { idbGet, idbSet } from './storage';

const STORAGE_KEY = 'project';

function defaultYear(): number {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
}

@Injectable({ providedIn: 'root' })
export class CalendarStore {
  readonly year = signal(defaultYear());
  readonly bindingMm = signal(15);
  readonly weekStart = signal<WeekStart>('lunes');
  readonly fontMain = signal('Montserrat');
  readonly fontScript = signal('Dancing Script');
  readonly fontCover = signal('Allura');
  readonly events = signal<CalEvent[]>([]);
  readonly months = signal<MonthConfig[]>(defaultMonths());
  readonly cover = signal<CoverConfig>(defaultCover());
  readonly back = signal<BackConfig>(defaultBack());

  /** Estado de interfaz (no se guarda en el proyecto) */
  readonly page = signal(0);
  readonly showGuides = signal(true);
  readonly loaded = signal(false);

  readonly sortedEvents = computed(() =>
    [...this.events()].sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name)),
  );

  /** Eventos que no existen en el año elegido (p. ej. 29 de febrero en año no bisiesto). */
  readonly invalidEvents = computed(() => {
    const y = this.year();
    return this.events().filter((e) => e.day > daysInMonth(y, e.month));
  });

  readonly hasColombianHolidays = computed(() => this.events().some((e) => e.source === 'co'));

  constructor() {
    this.load();
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      const data = this.toProject();
      if (!this.loaded()) return;
      clearTimeout(timer);
      timer = setTimeout(() => idbSet(STORAGE_KEY, data), 500);
    });
  }

  private async load() {
    const saved = await idbGet<ProjectData>(STORAGE_KEY);
    if (saved) this.applyProject(saved);
    this.loaded.set(true);
  }

  toProject(): ProjectData {
    return {
      app: 'calendario-escritorio',
      version: 1,
      year: this.year(),
      bindingMm: this.bindingMm(),
      weekStart: this.weekStart(),
      fontMain: this.fontMain(),
      fontScript: this.fontScript(),
      fontCover: this.fontCover(),
      events: this.events(),
      months: this.months(),
      cover: this.cover(),
      back: this.back(),
    };
  }

  applyProject(p: Partial<ProjectData>) {
    if (p.year) this.year.set(p.year);
    if (p.bindingMm) this.bindingMm.set(p.bindingMm);
    if (p.weekStart) this.weekStart.set(p.weekStart);
    if (p.fontMain) this.fontMain.set(p.fontMain);
    if (p.fontScript) this.fontScript.set(p.fontScript);
    if (p.fontCover) this.fontCover.set(p.fontCover);
    if (Array.isArray(p.events)) this.events.set(p.events);
    if (Array.isArray(p.months) && p.months.length === 12) {
      const defs = defaultMonths();
      this.months.set(p.months.map((m, i) => ({ ...defs[i], ...m })));
    }
    if (p.cover) this.cover.set({ ...defaultCover(), ...p.cover });
    if (p.back) this.back.set({ ...defaultBack(), ...p.back });
  }

  reset() {
    this.year.set(defaultYear());
    this.bindingMm.set(15);
    this.weekStart.set('lunes');
    this.fontMain.set('Montserrat');
    this.fontScript.set('Dancing Script');
    this.fontCover.set('Allura');
    this.events.set([]);
    this.months.set(defaultMonths());
    this.cover.set(defaultCover());
    this.back.set(defaultBack());
    this.page.set(0);
  }

  setYear(y: number) {
    if (!Number.isFinite(y) || y < 1900 || y > 2200) return;
    this.year.set(y);
    // Los festivos de Colombia cambian de fecha cada año: se recalculan.
    if (this.hasColombianHolidays()) this.addColombianHolidays();
  }

  // ---- eventos ----
  addEvents(evs: CalEvent[], replace: boolean) {
    this.events.update((cur) => (replace ? evs : [...cur, ...evs]));
  }

  addEvent(partial: Omit<CalEvent, 'id'>) {
    this.events.update((cur) => [...cur, { ...partial, id: newId() }]);
  }

  updateEvent(id: string, patch: Partial<CalEvent>) {
    this.events.update((cur) => cur.map((e) => (e.id === id ? { ...e, ...patch, source: undefined } : e)));
  }

  updateEventPhoto(id: string, photo: CalEvent['photo']) {
    this.events.update((cur) => cur.map((e) => (e.id === id ? { ...e, photo } : e)));
  }

  removeEvent(id: string) {
    this.events.update((cur) => cur.filter((e) => e.id !== id));
  }

  addColombianHolidays() {
    const hol = colombianHolidays(this.year());
    this.events.update((cur) => {
      const rest = cur.filter((e) => e.source !== 'co');
      // Evita duplicar festivos que el usuario ya cargó con el mismo nombre y fecha.
      const fresh = hol.filter(
        (h) => !rest.some((e) => e.type === 'festivo' && e.month === h.month && e.day === h.day),
      );
      return [...rest, ...fresh];
    });
  }

  removeColombianHolidays() {
    this.events.update((cur) => cur.filter((e) => e.source !== 'co'));
  }

  // ---- páginas ----
  updateMonth(index: number, patch: Partial<MonthConfig>) {
    this.months.update((cur) => cur.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  updateCover(patch: Partial<CoverConfig>) {
    this.cover.update((c) => ({ ...c, ...patch }));
  }

  updateBack(patch: Partial<BackConfig>) {
    this.back.update((c) => ({ ...c, ...patch }));
  }
}
