import { CalEvent, newId } from './models';

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Día de la semana con lunes = 0 ... domingo = 6 */
export function mondayIndex(year: number, month: number, day: number): number {
  return (new Date(year, month - 1, day).getDay() + 6) % 7;
}

export interface DayCell {
  day: number | null;
  festivos: CalEvent[];
  births: CalEvent[];
  deaths: CalEvent[];
}

/** Construye la cuadrícula del mes (semanas que empiezan en lunes). */
export function buildMonthGrid(year: number, month: number, events: CalEvent[]): DayCell[] {
  const total = daysInMonth(year, month);
  const lead = mondayIndex(year, month, 1);
  const cells: DayCell[] = [];
  for (let i = 0; i < lead; i++) cells.push({ day: null, festivos: [], births: [], deaths: [] });
  for (let d = 1; d <= total; d++) {
    const evs = events.filter((e) => e.month === month && e.day === d);
    cells.push({
      day: d,
      festivos: evs.filter((e) => e.type === 'festivo'),
      births: evs.filter((e) => e.type === 'cumpleanos'),
      deaths: evs.filter((e) => e.type === 'fallecimiento'),
    });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, festivos: [], births: [], deaths: [] });
  return cells;
}

/** Domingo de Pascua (algoritmo gregoriano anónimo). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Ley Emiliani: se traslada al lunes siguiente si no cae en lunes. */
function nextMonday(d: Date): Date {
  const wd = d.getDay();
  return wd === 1 ? d : addDays(d, (8 - wd) % 7);
}

/** Festivos oficiales de Colombia para el año indicado. */
export function colombianHolidays(year: number): CalEvent[] {
  const easter = easterSunday(year);
  const fixed = (m: number, d: number) => new Date(year, m - 1, d);
  const list: [string, Date][] = [
    ['Año nuevo', fixed(1, 1)],
    ['Reyes Magos', nextMonday(fixed(1, 6))],
    ['San José', nextMonday(fixed(3, 19))],
    ['Jueves Santo', addDays(easter, -3)],
    ['Viernes Santo', addDays(easter, -2)],
    ['Día del trabajo', fixed(5, 1)],
    ['Ascensión del Señor', addDays(easter, 43)],
    ['Corpus Christi', addDays(easter, 64)],
    ['Sagrado Corazón', addDays(easter, 71)],
    ['San Pedro y San Pablo', nextMonday(fixed(6, 29))],
    ['Independencia', fixed(7, 20)],
    ['Batalla de Boyacá', fixed(8, 7)],
    ['Asunción de la Virgen', nextMonday(fixed(8, 15))],
    ['Día de la Raza', nextMonday(fixed(10, 12))],
    ['Todos los Santos', nextMonday(fixed(11, 1))],
    ['Independencia de Cartagena', nextMonday(fixed(11, 11))],
    ['Inmaculada Concepción', fixed(12, 8)],
    ['Navidad', fixed(12, 25)],
  ];
  return list.map(([name, date]) => ({
    id: newId(),
    name,
    month: date.getMonth() + 1,
    day: date.getDate(),
    type: 'festivo' as const,
    source: 'co' as const,
  }));
}
