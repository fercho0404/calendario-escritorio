import { CalEvent, EventType, newId } from './models';

export interface ImportResult {
  events: CalEvent[];
  errors: string[];
}

const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

export function parseType(raw: unknown): EventType | null {
  const t = norm(raw);
  if (!t) return 'cumpleanos';
  if (/^(cumple|birth|nacim)/.test(t)) return 'cumpleanos';
  if (/^(festi|feriado|holi|fiesta)/.test(t)) return 'festivo';
  if (/^(falle|aniv|death|memori|luto|defun|deceso)/.test(t)) return 'fallecimiento';
  return null;
}

const NAME_KEYS = ['nombre', 'name', 'label', 'etiqueta', 'titulo'];
const MONTH_KEYS = ['mes', 'month'];
const DAY_KEYS = ['dia', 'day'];
const DATE_KEYS = ['fecha', 'date'];
const TYPE_KEYS = ['tipo', 'type', 'tipo de fecha', 'tipo_fecha', 'tipofecha'];

function pick(row: Record<string, unknown>, keys: string[]): unknown {
  for (const [k, v] of Object.entries(row)) {
    if (keys.includes(norm(k))) return v;
  }
  return undefined;
}

/** Acepta "MM-DD", "YYYY-MM-DD", "--MM-DD" o "DD/MM" ("DD/MM/YYYY"). */
function parseDate(raw: unknown): [number, number] | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  if (s.includes('/')) {
    const [d, m] = s.split('/').map((x) => parseInt(x, 10));
    return [m, d];
  }
  const parts = s.replace(/^--/, '').split('-').map((x) => parseInt(x, 10));
  if (parts.length >= 2) {
    const [m, d] = parts.slice(-2);
    return [m, d];
  }
  return null;
}

function rowToEvent(row: Record<string, unknown>, index: number, errors: string[]): CalEvent | null {
  const name = String(pick(row, NAME_KEYS) ?? '').trim();
  let month = parseInt(String(pick(row, MONTH_KEYS) ?? ''), 10);
  let day = parseInt(String(pick(row, DAY_KEYS) ?? ''), 10);
  if (isNaN(month) || isNaN(day)) {
    const parsed = parseDate(pick(row, DATE_KEYS));
    if (parsed) [month, day] = parsed;
  }
  const type = parseType(pick(row, TYPE_KEYS));
  const line = `Fila ${index + 1}`;
  if (!name) {
    errors.push(`${line}: falta el nombre.`);
    return null;
  }
  if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31) || day > new Date(2024, month, 0).getDate()) {
    errors.push(`${line} (${name}): fecha inválida.`);
    return null;
  }
  if (!type) {
    errors.push(`${line} (${name}): tipo no reconocido (usa cumpleaños, festivo o fallecimiento).`);
    return null;
  }
  return { id: newId(), name, month, day, type, photo: null };
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseCsv(text: string): ImportResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const errors: string[] = [];
  if (!lines.length) return { events: [], errors: ['El archivo está vacío.'] };
  const first = lines[0];
  const sep = [';', '\t', ','].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const header = splitCsvLine(first, sep);
  const events: CalEvent[] = [];
  lines.slice(1).forEach((line, i) => {
    const cells = splitCsvLine(line, sep);
    const row: Record<string, unknown> = {};
    header.forEach((h, j) => (row[h] = cells[j]));
    const ev = rowToEvent(row, i + 1, errors);
    if (ev) events.push(ev);
  });
  return { events, errors };
}

export function parseJson(text: string): ImportResult {
  const errors: string[] = [];
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { events: [], errors: ['El JSON no es válido.'] };
  }
  const rows = Array.isArray(data)
    ? data
    : ((data as Record<string, unknown>)?.['eventos'] ??
      (data as Record<string, unknown>)?.['fechas'] ??
      (data as Record<string, unknown>)?.['events']);
  if (!Array.isArray(rows)) return { events: [], errors: ['Se esperaba un arreglo de fechas.'] };
  const events: CalEvent[] = [];
  rows.forEach((r, i) => {
    const ev = rowToEvent((r ?? {}) as Record<string, unknown>, i, errors);
    if (ev) events.push(ev);
  });
  return { events, errors };
}

export const CSV_TEMPLATE = `nombre,mes,dia,tipo
David,1,5,cumpleaños
Gabriela,1,9,cumpleaños
Año nuevo,1,1,festivo
Abuelo Luis,3,14,fallecimiento
Julian,12,13,cumpleaños
Ana Maria,12,13,cumpleaños
`;

export const JSON_TEMPLATE = JSON.stringify(
  [
    { nombre: 'David', mes: 1, dia: 5, tipo: 'cumpleaños' },
    { nombre: 'Gabriela', fecha: '01-09', tipo: 'cumpleaños' },
    { nombre: 'Año nuevo', mes: 1, dia: 1, tipo: 'festivo' },
    { nombre: 'Abuelo Luis', mes: 3, dia: 14, tipo: 'fallecimiento' },
  ],
  null,
  2,
);
