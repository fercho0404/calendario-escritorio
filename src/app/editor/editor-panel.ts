import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CalendarStore } from '../core/calendar.store';
import { downloadText } from '../core/image-utils';
import { CSV_TEMPLATE, JSON_TEMPLATE, parseCsv, parseJson } from '../core/importer';
import { daysInMonth } from '../core/calendar-utils';
import { EVENT_TYPE_LABEL, EventType, MONTH_NAMES, Photo, ProjectData } from '../core/models';
import { FontDef, FontLoader, MAIN_FONTS, SCRIPT_FONTS } from '../core/fonts';
import { SearchSelect, SelectOption } from '../shared/search-select';
import { EventIcon } from '../shared/event-icon';
import { PhotoEditor } from './photo-editor';

type Tab = 'fechas' | 'pagina' | 'proyecto';

@Component({
  selector: 'app-editor-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhotoEditor, EventIcon, SearchSelect],
  templateUrl: './editor-panel.html',
  styleUrl: './editor-panel.scss',
})
export class EditorPanel {
  protected readonly store = inject(CalendarStore);
  readonly exportPdf = output<number>();

  protected readonly tab = signal<Tab>('fechas');
  protected readonly monthNames = MONTH_NAMES;
  protected readonly typeLabel = EVENT_TYPE_LABEL;
  private readonly fonts = inject(FontLoader);
  private static fontOptions(list: FontDef[]): SelectOption[] {
    return list.map((f) => ({ value: f.family, label: f.family, group: f.group, font: f.family }));
  }
  protected readonly mainFontOptions = EditorPanel.fontOptions(MAIN_FONTS);
  protected readonly scriptFontOptions = EditorPanel.fontOptions(SCRIPT_FONTS);
  protected readonly monthOptions: SelectOption[] = MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m }));
  protected readonly typeOptions: SelectOption[] = (['cumpleanos', 'festivo', 'fallecimiento'] as EventType[]).map(
    (t) => ({ value: t, label: EVENT_TYPE_LABEL[t] }),
  );
  protected readonly filterOptions: SelectOption[] = [
    { value: 'auto', label: 'Mes de la página visible' },
    { value: 'all', label: 'Todos los meses' },
    ...MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m, group: 'Meses' })),
  ];
  protected readonly qualityOptions: SelectOption[] = [
    { value: '2', label: 'Borrador (~190 ppp)' },
    { value: '3', label: 'Impresión (~290 ppp)' },
    { value: '4', label: 'Alta (~380 ppp)' },
  ];
  protected readonly filterValue = computed(() => String(this.filter()));

  protected previewFonts(opts: SelectOption[]) {
    opts.forEach((o) => o.font && this.fonts.preview(o.font));
  }

  protected toInt(v: string) {
    return parseInt(v, 10);
  }

  protected asType(v: string) {
    return v as EventType;
  }
  protected readonly types: EventType[] = ['cumpleanos', 'festivo', 'fallecimiento'];

  // ---- importación ----
  protected readonly replaceOnImport = signal(true);
  protected readonly importMsg = signal<{ ok: string; errors: string[] } | null>(null);

  // ---- nuevo evento ----
  protected readonly draftName = signal('');
  protected readonly draftMonth = signal(1);
  protected readonly draftDay = signal(1);
  protected readonly draftType = signal<EventType>('cumpleanos');

  // ---- filtro de la lista: 'auto' sigue la página visible ----
  protected readonly filter = signal<'auto' | 'all' | number>('auto');
  protected readonly filterMonth = computed<number | null>(() => {
    const f = this.filter();
    if (f === 'all') return null;
    if (f === 'auto') {
      const p = this.store.page();
      return p >= 1 && p <= 12 ? p : null;
    }
    return f;
  });
  protected readonly visibleEvents = computed(() => {
    const m = this.filterMonth();
    return this.store.sortedEvents().filter((e) => m === null || e.month === m);
  });

  protected readonly pdfScale = signal(3);

  protected readonly pageKind = computed(() => {
    const p = this.store.page();
    return p === 0 ? 'cover' : p === 13 ? 'back' : 'month';
  });

  protected val(ev: Event): string {
    return (ev.target as HTMLInputElement).value;
  }

  protected num(ev: Event): number {
    return parseInt((ev.target as HTMLInputElement).value, 10);
  }

  protected setFilter(v: string) {
    this.filter.set(v === 'auto' || v === 'all' ? v : parseInt(v, 10));
  }

  protected async onImport(ev: Event) {
    const inputEl = ev.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    const text = await file.text();
    const isJson = file.name.toLowerCase().endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{');
    const res = isJson ? parseJson(text) : parseCsv(text);
    if (res.events.length) {
      this.store.addEvents(res.events, this.replaceOnImport());
    }
    this.importMsg.set({
      ok: res.events.length ? `Se cargaron ${res.events.length} fechas.` : 'No se cargó ninguna fecha.',
      errors: res.errors,
    });
  }

  protected downloadTemplate(kind: 'csv' | 'json') {
    if (kind === 'csv') downloadText('plantilla-fechas.csv', '﻿' + CSV_TEMPLATE, 'text/csv');
    else downloadText('plantilla-fechas.json', JSON_TEMPLATE, 'application/json');
  }

  protected maxDay(month: number) {
    return daysInMonth(2024, month);
  }

  protected addDraft() {
    const name = this.draftName().trim();
    const m = this.draftMonth();
    const d = Math.min(Math.max(1, this.draftDay() || 1), this.maxDay(m));
    if (!name) return;
    this.store.addEvent({ name, month: m, day: d, type: this.draftType(), photo: null });
    this.draftName.set('');
  }

  protected setEventPhoto(id: string, photo: Photo | null) {
    this.store.updateEventPhoto(id, photo);
  }

  protected isInvalid(id: string) {
    return this.store.invalidEvents().some((e) => e.id === id);
  }

  // ---- proyecto ----
  protected saveProject() {
    const data = this.store.toProject();
    downloadText(`calendario-${data.year}.calendario.json`, JSON.stringify(data), 'application/json');
  }

  protected async openProject(ev: Event) {
    const inputEl = ev.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as ProjectData;
      if (data.app !== 'calendario-escritorio') throw new Error();
      this.store.applyProject(data);
      this.store.page.set(0);
    } catch {
      alert('El archivo no es un proyecto de calendario válido.');
    }
  }

  protected resetAll() {
    if (confirm('¿Borrar todas las fechas, fotos y textos y empezar de cero?')) this.store.reset();
  }
}
