import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { fileToPhoto, photoBackground } from '../core/image-utils';
import { Photo } from '../core/models';

/** Carga de foto + ajuste de encuadre (zoom y posición). */
@Component({
  selector: 'app-photo-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <label class="thumb" [class.round]="round()" [style]="thumbStyle()" title="Cargar foto">
        @if (!photo()) { <span>+ foto</span> }
        <input type="file" accept="image/*" (change)="onFile($event)" hidden />
      </label>
      @if (photo(); as p) {
        <div class="actions">
          <button type="button" class="link" (click)="open.set(!open())">{{ open() ? 'Cerrar ajuste' : 'Ajustar encuadre' }}</button>
          <button type="button" class="link danger" (click)="photoChange.emit(null)">Quitar</button>
        </div>
      } @else if (loading()) {
        <span class="muted">Procesando…</span>
      }
    </div>
    @if (open() && photo(); as p) {
      <div class="sliders">
        <label>Zoom <input type="range" min="1" max="3" step="0.01" [value]="p.zoom" (input)="patch('zoom', $event)" /></label>
        <label>Horizontal <input type="range" min="0" max="100" step="0.5" [value]="p.x" (input)="patch('x', $event)" /></label>
        <label>Vertical <input type="range" min="0" max="100" step="0.5" [value]="p.y" (input)="patch('y', $event)" /></label>
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .row { display: flex; align-items: center; gap: 10px; }
    .thumb { width: 46px; height: 46px; border-radius: 6px; flex: none; cursor: pointer;
      border: 1px dashed #c9bdb6; display: flex; align-items: center; justify-content: center;
      font-size: 11px; color: #9c8a83; background-color: #faf7f5; }
    .thumb.round { border-radius: 50%; }
    .thumb:hover { border-color: #8a5a52; }
    .actions { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
    .sliders { display: grid; gap: 4px; margin-top: 8px; padding: 8px 10px; background: #f7f3f0; border-radius: 8px; }
    .sliders label { display: grid; grid-template-columns: 76px 1fr; align-items: center; font-size: 12px; color: #6d5d58; }
    .muted { font-size: 12px; color: #9c8a83; }
  `,
})
export class PhotoEditor {
  readonly photo = input<Photo | null | undefined>(null);
  readonly round = input(false);
  readonly photoChange = output<Photo | null>();
  protected readonly open = signal(false);
  protected readonly loading = signal(false);

  protected readonly thumbStyle = computed(() => {
    const p = this.photo();
    return p ? { ...photoBackground(p, 1), 'border-style': 'solid' } : {};
  });

  protected async onFile(ev: Event) {
    const inputEl = ev.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    this.loading.set(true);
    try {
      this.photoChange.emit(await fileToPhoto(file));
    } catch {
      alert('No se pudo leer la imagen.');
    } finally {
      this.loading.set(false);
    }
  }

  protected patch(key: 'zoom' | 'x' | 'y', ev: Event) {
    const p = this.photo();
    if (!p) return;
    this.photoChange.emit({ ...p, [key]: parseFloat((ev.target as HTMLInputElement).value) });
  }
}
