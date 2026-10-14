import { Injectable } from '@angular/core';

export interface FontDef {
  family: string;
  group: string;
}

const g = (group: string, families: string[]): FontDef[] => families.map((family) => ({ family, group }));

/** Tipografía general: títulos, números, días y textos. */
export const MAIN_FONTS: FontDef[] = [
  ...g('Sans serif', [
    'Montserrat', 'Poppins', 'Raleway', 'Lato', 'Josefin Sans', 'Quicksand', 'Nunito', 'Open Sans', 'Roboto',
    'Inter', 'Work Sans', 'DM Sans', 'Outfit', 'Urbanist', 'Manrope', 'Mulish', 'Karla', 'Rubik', 'Jost',
    'Barlow', 'Cabin', 'Lexend', 'Sora', 'Plus Jakarta Sans', 'Space Grotesk', 'Archivo', 'Figtree',
    'Red Hat Display', 'Questrial', 'Didact Gothic', 'Tenor Sans', 'Varela Round', 'Comfortaa', 'Fredoka',
    'Nunito Sans', 'Source Sans 3', 'Kumbh Sans', 'Albert Sans', 'Lexend Deca', 'Gantari',
  ]),
  ...g('Serif', [
    'Playfair Display', 'Lora', 'Merriweather', 'Libre Baskerville', 'EB Garamond', 'Cormorant Garamond',
    'Crimson Text', 'DM Serif Display', 'Prata', 'Marcellus', 'Cinzel', 'Bodoni Moda', 'Noto Serif',
    'Source Serif 4', 'Spectral', 'Fraunces', 'Gilda Display', 'Italiana', 'Cormorant', 'Libre Caslon Text',
  ]),
  ...g('Decorativas', [
    'Abril Fatface', 'Bebas Neue', 'Oswald', 'Josefin Slab', 'Poiret One', 'Righteous', 'Lobster',
    'Alfa Slab One', 'Baloo 2', 'Chewy', 'Bungee', 'Monoton', 'Federo', 'Megrim',
  ]),
];

/** Tipografía cursiva: nombres en las celdas, frase del mes y firma de la portada. */
export const SCRIPT_FONTS: FontDef[] = [
  ...g('Caligráficas', [
    'Dancing Script', 'Allura', 'Great Vibes', 'Sacramento', 'Parisienne', 'Alex Brush', 'Pinyon Script',
    'Tangerine', 'Italianno', 'Petit Formal Script', 'Mrs Saint Delafield', 'Monsieur La Doulaise',
    'Herr Von Muellerhoff', 'Rouge Script', 'Arizonia', 'Imperial Script', 'Corinthia', 'Ephesis', 'Birthstone',
    'Lovers Quarrel', 'Qwigley', 'Euphoria Script', 'Ballet', 'Meow Script', 'Mr Dafoe', 'Rochester',
    'Pacifico', 'Satisfy', 'Kaushan Script', 'Cookie', 'Yellowtail', 'Courgette', 'Damion', 'Niconne',
    'Norican', 'Playball', 'Grand Hotel', 'Lobster Two', 'Marck Script', 'Bad Script', 'Charm',
    'Style Script', 'Water Brush', 'Hurricane', 'Licorice', 'Comforter', 'Send Flowers', 'Updock',
  ]),
  ...g('Manuscritas', [
    'Caveat', 'Kalam', 'Indie Flower', 'Shadows Into Light', 'Amatic SC', 'Homemade Apple', 'Handlee',
    'Patrick Hand', 'Gochi Hand', 'Nothing You Could Do', 'Reenie Beanie', 'La Belle Aurore',
    'Cedarville Cursive', 'Gloria Hallelujah', 'Architects Daughter', 'Covered By Your Grace',
    'Just Another Hand', 'Delius', 'Coming Soon', 'Sue Ellen Francisco',
  ]),
];

/** Fuentes incluidas en el build (funcionan sin conexión). El resto se descarga de Google Fonts al usarlas. */
const BUNDLED = new Set(['Montserrat', 'Dancing Script', 'Allura']);

const GF = 'https://fonts.googleapis.com/css2';
const enc = (family: string) => family.trim().replace(/ /g, '+');

@Injectable({ providedIn: 'root' })
export class FontLoader {
  private readonly full = new Map<string, Promise<void>>();
  private readonly previews = new Set<string>();

  /** Carga la fuente completa (400 y, si existen, 300 y 600). */
  ensure(family: string): Promise<void> {
    if (!family || BUNDLED.has(family)) return Promise.resolve();
    let p = this.full.get(family);
    if (!p) {
      // Tres hojas separadas: si un peso no existe, Google responde error solo para esa hoja.
      p = Promise.all(
        ['', ':wght@300', ':wght@600'].map((w) => this.addLink(`${GF}?family=${enc(family)}${w}&display=swap`)),
      ).then(() => undefined);
      this.full.set(family, p);
    }
    return p;
  }

  /** Carga solo las letras del nombre, para mostrarlo con su propia fuente en el buscador. */
  preview(family: string) {
    if (!family || BUNDLED.has(family) || this.full.has(family) || this.previews.has(family)) return;
    this.previews.add(family);
    this.addLink(`${GF}?family=${enc(family)}&text=${encodeURIComponent(family)}&display=swap`);
  }

  private addLink(href: string): Promise<void> {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  }
}
