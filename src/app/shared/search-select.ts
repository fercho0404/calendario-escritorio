import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  /** Si se indica, la opción se dibuja con esta fuente. */
  font?: string;
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Combo con buscador: escribe para filtrar, flechas para moverte, Enter para elegir. */
@Component({
  selector: 'app-search-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:pointerdown)': 'onDocPointer($event)',
    '(window:resize)': 'close()',
  },
  template: `
    <button
      #trigger
      type="button"
      class="trigger"
      [class.open]="open()"
      [class.big]="bigPreview()"
      [style.font-family]="fontOf(selected())"
      (click)="toggle()"
      (keydown)="onTriggerKey($event)"
      [attr.aria-expanded]="open()"
      aria-haspopup="listbox"
    >
      <span class="label">{{ selected()?.label ?? placeholder() }}</span>
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" /></svg>
    </button>

    @if (open()) {
      <div class="pop" [style.top.px]="pos().top" [style.left.px]="pos().left" [style.width.px]="pos().width"
        [class.up]="pos().up">
        <div class="search">
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.5" /></svg>
          <input
            #search
            type="text"
            [placeholder]="searchPlaceholder()"
            [value]="query()"
            (input)="onQuery($event)"
            (keydown)="onSearchKey($event)"
            autocomplete="off"
            spellcheck="false"
          />
          <span class="count">{{ filtered().length }}</span>
        </div>
        <ul #list class="list" role="listbox">
          @for (o of filtered(); track o.value; let i = $index) {
            @if (o.group && (i === 0 || filtered()[i - 1].group !== o.group)) {
              <li class="group" role="presentation">{{ o.group }}</li>
            }
            <li
              role="option"
              class="opt"
              [attr.data-i]="i"
              [class.active]="i === active()"
              [class.sel]="o.value === value()"
              [class.big]="bigPreview()"
              [attr.aria-selected]="o.value === value()"
              [style.font-family]="fontOf(o)"
              (pointerenter)="active.set(i)"
              (pointerdown)="$event.preventDefault()"
              (click)="choose(o)"
            >
              {{ o.label }}
            </li>
          } @empty {
            <li class="empty">Sin resultados</li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .trigger {
      width: 100%; display: flex; align-items: center; gap: 6px; padding: 6px 8px;
      border: 1px solid var(--ui-line); border-radius: 6px; background: #fff; color: var(--ui-ink);
      font: 400 13px Montserrat, sans-serif; text-align: left; cursor: pointer; min-height: 32px;
      &:hover { border-color: #d8ccc6; }
      &.open, &:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: -1px; }
      &.big { font-size: 17px; min-height: 38px; }
      .label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      svg { width: 12px; height: 12px; flex: none; color: var(--ui-muted); }
    }
    .pop {
      position: fixed; z-index: 1000; background: #fff; border: 1px solid var(--ui-line); border-radius: 8px;
      box-shadow: 0 10px 28px rgba(60, 40, 30, .18); display: flex; flex-direction: column; overflow: hidden;
      max-height: 340px; font: 400 13px Montserrat, sans-serif;
      &.up { flex-direction: column-reverse; }
    }
    .search {
      display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-bottom: 1px solid var(--ui-line);
      flex: none;
      svg { width: 14px; height: 14px; color: var(--ui-muted); flex: none; }
      input { flex: 1; min-width: 0; border: 0; outline: none; font: 13px Montserrat, sans-serif; color: var(--ui-ink);
        padding: 4px 0; background: none; }
      .count { font-size: 11px; color: var(--ui-muted); font-family: Montserrat, sans-serif; }
    }
    .up .search { border-bottom: 0; border-top: 1px solid var(--ui-line); }
    .list { list-style: none; margin: 0; padding: 4px; overflow: auto; flex: 1; min-height: 0; }
    .group {
      font: 700 10px Montserrat, sans-serif; text-transform: uppercase; letter-spacing: .06em; color: var(--ui-muted);
      padding: 8px 8px 4px;
    }
    .opt {
      padding: 6px 8px; border-radius: 5px; cursor: pointer; font-size: 13px; color: var(--ui-ink);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      &.big { font-size: 18px; padding: 5px 8px; }
      &.active { background: #f5efec; }
      &.sel { color: var(--ui-accent); font-weight: 600; }
    }
    .empty { padding: 10px 8px; font: 12px Montserrat, sans-serif; color: var(--ui-muted); }
  `,
})
export class SearchSelect {
  readonly options = input.required<SelectOption[]>();
  readonly value = input<string>('');
  readonly placeholder = input('Seleccionar…');
  readonly searchPlaceholder = input('Buscar…');
  /** Opciones más grandes (útil para mostrar fuentes). */
  readonly bigPreview = input(false);
  readonly valueChange = output<string>();
  /** Emite las opciones visibles cuando se abre o se filtra (para precargar fuentes). */
  readonly visibleChange = output<SelectOption[]>();

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly active = signal(0);
  protected readonly pos = signal({ top: 0, left: 0, width: 0, up: false });

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly searchEl = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly listEl = viewChild<ElementRef<HTMLElement>>('list');
  private scrollHandler = () => this.place();

  protected readonly selected = computed(() => this.options().find((o) => o.value === this.value()));

  protected readonly filtered = computed(() => {
    const q = norm(this.query().trim());
    const opts = this.options();
    if (!q) return opts;
    return opts.filter((o) => norm(o.label).includes(q) || (o.group && norm(o.group).includes(q)));
  });

  protected fontOf(o: SelectOption | undefined) {
    return o?.font ? `"${o.font}", Montserrat, sans-serif` : null;
  }

  protected toggle() {
    if (this.open()) this.close();
    else this.show();
  }

  private show() {
    this.query.set('');
    const idx = this.filtered().findIndex((o) => o.value === this.value());
    this.active.set(Math.max(0, idx));
    this.place();
    this.open.set(true);
    window.addEventListener('scroll', this.scrollHandler, true);
    this.visibleChange.emit(this.filtered());
    setTimeout(() => {
      this.searchEl()?.nativeElement.focus();
      this.scrollActive();
    });
  }

  close() {
    if (!this.open()) return;
    this.open.set(false);
    window.removeEventListener('scroll', this.scrollHandler, true);
  }

  private place() {
    const el = this.trigger()?.nativeElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const up = below < 260 && r.top > below;
    const width = Math.max(r.width, 220);
    const left = Math.min(r.left, window.innerWidth - width - 8);
    this.pos.set({ top: up ? Math.max(8, r.top - 344) : r.bottom + 4, left, width, up });
    if (up) {
      // Ajusta la altura real hacia arriba cuando hay menos opciones.
      setTimeout(() => {
        const pop = this.host.nativeElement.querySelector('.pop') as HTMLElement | null;
        if (pop) this.pos.update((p) => ({ ...p, top: Math.max(8, r.top - pop.offsetHeight - 4) }));
      });
    }
  }

  protected onQuery(ev: Event) {
    this.query.set((ev.target as HTMLInputElement).value);
    this.active.set(0);
    this.visibleChange.emit(this.filtered());
  }

  protected choose(o: SelectOption) {
    this.valueChange.emit(o.value);
    this.close();
    this.trigger()?.nativeElement.focus();
  }

  protected onTriggerKey(ev: KeyboardEvent) {
    if (!this.open() && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      ev.preventDefault();
      this.show();
    } else if (!this.open() && ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey) {
      // Empezar a escribir abre el buscador con esa letra.
      ev.preventDefault();
      this.show();
      this.query.set(ev.key);
      this.visibleChange.emit(this.filtered());
    }
  }

  protected onSearchKey(ev: KeyboardEvent) {
    const n = this.filtered().length;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.active.set(Math.min(n - 1, this.active() + 1));
      this.scrollActive();
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.active.set(Math.max(0, this.active() - 1));
      this.scrollActive();
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      const o = this.filtered()[this.active()];
      if (o) this.choose(o);
    } else if (ev.key === 'Escape' || ev.key === 'Tab') {
      this.close();
      if (ev.key === 'Escape') this.trigger()?.nativeElement.focus();
    }
  }

  private scrollActive() {
    setTimeout(() => {
      const li = this.listEl()?.nativeElement.querySelector(`[data-i="${this.active()}"]`);
      li?.scrollIntoView({ block: 'nearest' });
    });
  }

  protected onDocPointer(ev: PointerEvent) {
    if (this.open() && !this.host.nativeElement.contains(ev.target as Node)) this.close();
  }
}
