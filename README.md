# Calendario de escritorio

App web en Angular 22 para diseñar un calendario de escritorio familiar de **21 × 15 cm** (14 páginas: portada, 12 meses y contraportada) y exportarlo a PDF listo para imprimir.

## Funciones

- **Carga de fechas** desde CSV o JSON (nombre, mes, día y tipo: cumpleaños, festivo o fallecimiento).
- **Selección de año**: la cuadrícula se recalcula para que cada fecha caiga en su día real de la semana (semanas de lunes a domingo).
- **Festivos de Colombia** calculados automáticamente para el año elegido (Semana Santa y Ley Emiliani incluidas).
- **Íconos por tipo**: globos (cumpleaños), banderines (festivo) y vela (fallecimiento).
- **Fotos** por cumpleaños y fallecimiento, en círculos en zigzag al lado del mes, con zoom y encuadre.
- **Portada** con foto, título `CALENDARIO {año}` y firma; **contraportada** con foto, año y texto.
- Frase y **caption** al pie de cada mes, y colores editables por mes.
- **Margen de argollado** configurable (por defecto 15 mm) con guía visual que no se exporta.
- Vista previa en vivo, vista de todas las páginas y guardado automático en el navegador.
- **Exportar a PDF** de 210 × 150 mm por página.
- Descargar / abrir el proyecto completo (incluye fotos) como `.json`.

## Formato de fechas

CSV (separado por `,` o `;`):

```csv
nombre,mes,dia,tipo
David,1,5,cumpleaños
Año nuevo,1,1,festivo
Abuelo Luis,3,14,fallecimiento
```

JSON:

```json
[
  { "nombre": "David", "mes": 1, "dia": 5, "tipo": "cumpleaños" },
  { "nombre": "Gabriela", "fecha": "01-09", "tipo": "cumpleaños" }
]
```

También se acepta la columna `fecha` como `MM-DD` o `DD/MM`. Hay un ejemplo en `public/ejemplos/fechas-ejemplo.csv`.

## Desarrollo

Requiere Node.js 22.22.3+ o 24.15+.

```bash
npm install
npm start          # http://localhost:4200
npm run build      # salida en dist/calendario/browser
```

## Despliegue en Vercel

El repo incluye `vercel.json`. Importa el repositorio en Vercel (o ejecuta `npx vercel`) y usa:

- Build command: `npm run build`
- Output directory: `dist/calendario/browser`
- Node.js: 24.x (Project Settings → General)
