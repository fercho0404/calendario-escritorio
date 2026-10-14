import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { photoBackground } from '../core/image-utils';
import { Photo } from '../core/models';

/** Caja de foto con encuadre. El tamaño y la forma los define el contenedor. */
@Component({
  selector: 'app-photo-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style]': 'style()', '[class.empty]': '!photo()' },
  styles: `
    :host { display: block; width: 100%; height: 100%; border-radius: inherit; }
    :host(.empty) {
      background: repeating-linear-gradient(45deg, #f1ece8, #f1ece8 6px, #e9e2dc 6px, #e9e2dc 12px);
      display: flex; align-items: center; justify-content: center;
    }
    .hint { font: 500 2.6mm Montserrat, sans-serif; color: #a2948d; text-align: center; padding: 0 2mm; }
  `,
  template: `@if (!photo() && placeholder()) {<span class="hint" data-html2canvas-ignore>{{ placeholder() }}</span>}`,
})
export class PhotoBox {
  readonly photo = input<Photo | null | undefined>(null);
  /** relación ancho / alto de la caja */
  readonly aspect = input(1);
  readonly placeholder = input('');
  protected readonly style = computed(() => {
    const p = this.photo();
    return p ? photoBackground(p, this.aspect()) : {};
  });
}
