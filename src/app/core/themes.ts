import { Photo, StyleTokens } from './models';

type ThemeStyle = Omit<StyleTokens, 'themeId' | 'background' | 'contentX' | 'contentY'>;
type Triple = [string, string, string];

/** Plantilla de estilo: colores, tipografías, decoraciones y formas. No toca fechas, textos ni fotos. */
export interface ThemeDef {
  id: string;
  name: string;
  description: string;
  style: ThemeStyle;
  fonts: { main: string; script: string; cover: string };
  /** por mes: [celdas, etiquetas, festivos] */
  colors: Triple[];
  tagColor: string;
  custom?: boolean;
  /** Fondos opcionales (solo en plantillas propias). */
  backgrounds?: {
    months?: (Photo | null)[];
    general?: Photo | null;
    cover?: Photo | null;
    back?: Photo | null;
  };
}

export const THEME_FILE_APP = 'calendario-escritorio-plantilla';

const cycle = (list: Triple[]): Triple[] => Array.from({ length: 12 }, (_, i) => list[i % list.length]);

export const BUILT_IN_THEMES: ThemeDef[] = [
  {
    id: 'acuarela',
    name: 'Acuarela',
    description: 'Pasteles por mes y manchas de acuarela, como el de referencia.',
    fonts: { main: 'Montserrat', script: 'Dancing Script', cover: 'Allura' },
    tagColor: '#efbfa5',
    colors: [
      ['#f8dde7', '#f095b6', '#f5c3bd'],
      ['#d4ebf0', '#9fd5df', '#f4c9d1'],
      ['#e7e0f4', '#b9a7dd', '#f6d3c2'],
      ['#d9efe2', '#92cfad', '#f6cfd6'],
      ['#fbe4d4', '#f2ad85', '#efc9dc'],
      ['#fbf1cf', '#efcd6a', '#f6cdd3'],
      ['#fbdcd6', '#ef998b', '#d4e7f2'],
      ['#d9e6f7', '#93b7e6', '#f8d5c7'],
      ['#e3ecd5', '#a9c48a', '#f4cdd6'],
      ['#fbe4cc', '#f1b06f', '#e3d8f1'],
      ['#efdce7', '#c99ab5', '#f6e0c5'],
      ['#e1ebcb', '#a8c57c', '#f2c9d1'],
    ],
    style: {
      ink: '#5e4440',
      inkSoft: '#6d524c',
      pageBg: '#ffffff',
      backBg: '#fbf8f1',
      decor: 'acuarela',
      decorColors: ['#cdd6aa', '#b0cfe4', '#f0cdc3'],
      titleWeight: 400,
      titleSpacing: 0.13,
      titleUpper: true,
      cellRadius: 0,
      cellAlpha: 1,
      cellBorder: false,
      labelStyle: 'mancha',
      photoShape: 'circulo',
      coverFrame: 'polaroid',
    },
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    description: 'Neutros, mucho aire y tipografía fina.',
    fonts: { main: 'Outfit', script: 'Sacramento', cover: 'Italianno' },
    tagColor: '#2f2f2f',
    colors: cycle([['#f3f2ef', '#d9d4cc', '#ece2d9']]),
    style: {
      ink: '#2f2f2f',
      inkSoft: '#6b6b6b',
      pageBg: '#ffffff',
      backBg: '#f6f5f2',
      decor: 'ninguna',
      decorColors: ['#e9e6e1', '#d8d3cb', '#c9c2b8'],
      titleWeight: 300,
      titleSpacing: 0.32,
      titleUpper: true,
      cellRadius: 0.6,
      cellAlpha: 1,
      cellBorder: false,
      labelStyle: 'texto',
      photoShape: 'aro',
      coverFrame: 'simple',
    },
  },
  {
    id: 'floral',
    name: 'Floral',
    description: 'Rosas y verdes suaves con ramitas de hojas.',
    fonts: { main: 'Cormorant Garamond', script: 'Parisienne', cover: 'Parisienne' },
    tagColor: '#c98b96',
    colors: [
      ['#f9e1e4', '#e8a9b3', '#f3d1c2'],
      ['#e6efe0', '#a9c39b', '#f6d6dc'],
      ['#fbe9e0', '#eeb39d', '#e3ecd9'],
      ['#f6e4ec', '#d8a1bb', '#f4dccb'],
      ['#eef3e4', '#b5cc97', '#f8d9de'],
      ['#fdf0e2', '#f0c08c', '#eadcef'],
      ['#fbe3e3', '#e79b9b', '#e1ecdb'],
      ['#e9efe6', '#9fbc96', '#f9dcd2'],
      ['#f5e6ee', '#cf9bb8', '#efe4d0'],
      ['#fbeadd', '#e6a98a', '#e4ead8'],
      ['#efe6ef', '#b99abf', '#f6dfcf'],
      ['#e8f0e4', '#9cba8f', '#f4cfd6'],
    ],
    style: {
      ink: '#5b4a4f',
      inkSoft: '#8a6f75',
      pageBg: '#fffdfb',
      backBg: '#fbf5f2',
      decor: 'hojas',
      decorColors: ['#9db58f', '#e8b4bc', '#f3d7c9'],
      titleWeight: 500,
      titleSpacing: 0.08,
      titleUpper: false,
      cellRadius: 1.6,
      cellAlpha: 1,
      cellBorder: false,
      labelStyle: 'pastilla',
      photoShape: 'aro',
      coverFrame: 'arco',
    },
  },
  {
    id: 'boho',
    name: 'Boho terracota',
    description: 'Tonos tierra, arcoíris boho y esquinas redondeadas.',
    fonts: { main: 'Josefin Sans', script: 'Satisfy', cover: 'Satisfy' },
    tagColor: '#c9805f',
    colors: cycle([
      ['#f5e1d6', '#d4906f', '#e9dcc3'],
      ['#f4ead9', '#d9b77f', '#ecd7cb'],
      ['#e6eadc', '#a7b48f', '#f1dccd'],
      ['#f3e0dc', '#c98f86', '#e8e0cc'],
    ]),
    style: {
      ink: '#5a3e33',
      inkSoft: '#8a6a5a',
      pageBg: '#fdf9f4',
      backBg: '#f6eee5',
      decor: 'arcos',
      decorColors: ['#d08a6b', '#e3b98f', '#a8b59a'],
      titleWeight: 500,
      titleSpacing: 0.18,
      titleUpper: true,
      cellRadius: 2.2,
      cellAlpha: 1,
      cellBorder: false,
      labelStyle: 'pastilla',
      photoShape: 'redondeada',
      coverFrame: 'arco',
    },
  },
  {
    id: 'infantil',
    name: 'Infantil',
    description: 'Colores alegres, confeti y letras redondas.',
    fonts: { main: 'Fredoka', script: 'Pacifico', cover: 'Pacifico' },
    tagColor: '#f72585',
    colors: cycle([
      ['#fff1c9', '#ffc93c', '#ffd6e0'],
      ['#d9f3ff', '#6cc6f0', '#ffe3c2'],
      ['#e4f8dc', '#7fd36b', '#ffd9ec'],
      ['#ffe2ef', '#ff8fbf', '#d7f0ff'],
      ['#efe3ff', '#b48cf2', '#fff0c2'],
      ['#ffe9d6', '#ffa45c', '#dff5e3'],
    ]),
    style: {
      ink: '#3c3a5c',
      inkSoft: '#5d5a86',
      pageBg: '#ffffff',
      backBg: '#fdf8ec',
      decor: 'confeti',
      decorColors: ['#ffb703', '#4cc9f0', '#f72585'],
      titleWeight: 600,
      titleSpacing: 0.06,
      titleUpper: true,
      cellRadius: 3,
      cellAlpha: 1,
      cellBorder: false,
      labelStyle: 'mancha',
      photoShape: 'aro',
      coverFrame: 'polaroid',
    },
  },
  {
    id: 'elegante',
    name: 'Elegante',
    description: 'Crema, dorado y serif clásica con marco fino.',
    fonts: { main: 'Playfair Display', script: 'Pinyon Script', cover: 'Pinyon Script' },
    tagColor: '#2b2622',
    colors: cycle([['#efe7d6', '#c2a165', '#e9d9cf']]),
    style: {
      ink: '#2b2622',
      inkSoft: '#8a7350',
      pageBg: '#fbf8f1',
      backBg: '#f4efe4',
      decor: 'marco',
      decorColors: ['#c2a165', '#e6d5b0', '#8f8578'],
      titleWeight: 400,
      titleSpacing: 0.22,
      titleUpper: true,
      cellRadius: 0,
      cellAlpha: 0.55,
      cellBorder: true,
      labelStyle: 'texto',
      photoShape: 'aro',
      coverFrame: 'simple',
    },
  },
];

export function defaultStyle(): StyleTokens {
  const t = BUILT_IN_THEMES[0];
  return { ...t.style, themeId: t.id, background: null, contentX: 0, contentY: 0 };
}
