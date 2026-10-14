export type EventType = 'cumpleanos' | 'festivo' | 'fallecimiento';

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  cumpleanos: 'Cumpleaños',
  festivo: 'Festivo',
  fallecimiento: 'Fallecimiento',
};

/** Foto con encuadre: zoom >= 1 y punto focal (x, y) en porcentaje. */
export interface Photo {
  src: string;
  w: number;
  h: number;
  zoom: number;
  x: number;
  y: number;
}

export interface CalEvent {
  id: string;
  name: string;
  /** 1 - 12 */
  month: number;
  day: number;
  type: EventType;
  photo?: Photo | null;
  /** 'co' cuando lo generó el botón de festivos de Colombia (se recalcula al cambiar el año). */
  source?: 'co';
}

export interface MonthConfig {
  subtitle: string;
  caption: string;
  /** color de las celdas */
  base: string;
  /** color de la etiqueta (mancha) de los nombres */
  accent: string;
  /** color de la celda de festivo */
  holiday: string;
}

export interface CoverConfig {
  photo: Photo | null;
  label: string;
  tagColor: string;
}

export interface BackConfig {
  photo: Photo | null;
  label: string;
}

export interface ProjectData {
  app: 'calendario-escritorio';
  version: 1;
  year: number;
  bindingMm: number;
  events: CalEvent[];
  months: MonthConfig[];
  cover: CoverConfig;
  back: BackConfig;
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Medidas físicas de la página (calendario de escritorio). */
export const PAGE_W_MM = 210;
export const PAGE_H_MM = 150;
/** 14 páginas: portada, 12 meses, contraportada */
export const PAGE_COUNT = 14;

const DEFAULT_SUBTITLES = [
  'Un nuevo año para compartir.',
  'El cariño se cultiva cada día',
  'Juntos florecemos',
  'Cada día es un regalo',
  'Gracias por estar',
  'Momentos que se quedan',
  'La alegría de estar juntos',
  'Volar alto, siempre unidos',
  'Amor y amistad en casa',
  'Recuerdos que nos abrazan',
  'Gratitud en cada encuentro',
  'Lo mejor del año: la familia',
];

const DEFAULT_COLORS: [string, string, string][] = [
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
];

export function defaultMonths(): MonthConfig[] {
  return DEFAULT_SUBTITLES.map((subtitle, i) => ({
    subtitle,
    caption: '',
    base: DEFAULT_COLORS[i][0],
    accent: DEFAULT_COLORS[i][1],
    holiday: DEFAULT_COLORS[i][2],
  }));
}

export function defaultCover(): CoverConfig {
  return { photo: null, label: 'Familia', tagColor: '#efbfa5' };
}

export function defaultBack(): BackConfig {
  return { photo: null, label: 'FAMILIA' };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
