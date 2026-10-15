# Calendario de escritorio

App web en Angular 22 para diseñar un calendario de escritorio familiar de **21 × 15 cm** (14 páginas: portada, 12 meses y contraportada) y exportarlo a PDF listo para imprimir.

## Funciones

- **Carga de fechas** desde CSV o JSON (nombre, mes, día y tipo: cumpleaños, festivo o fallecimiento).
- **Selección de año**: la cuadrícula se recalcula para que cada fecha caiga en su día real de la semana.
- **Inicio de semana** configurable: lunes o domingo.
- **Tipografías** seleccionables con buscador (más de 140 fuentes): general (títulos, números y textos), cursiva (nombres y frases) y firma de la portada. Montserrat, Dancing Script y Allura vienen incluidas; las demás se descargan de Google Fonts al elegirlas (requiere conexión).
- Todos los combos tienen **buscador**: escribe para filtrar, flechas para moverte y Enter para elegir.
- **Festivos de Colombia** calculados automáticamente para el año elegido (Semana Santa y Ley Emiliani incluidas).
- **Íconos por tipo**: globos (cumpleaños), banderines (festivo) y vela (fallecimiento).
- **Fotos** por cumpleaños y fallecimiento, en círculos en zigzag al lado del mes, con zoom y encuadre. Se pueden desactivar: sin fotos, la cuadrícula ocupa todo el ancho de la página.
- **Portada** con foto, título `CALENDARIO {año}` y firma; **contraportada** con foto, año y texto.
- Frase y **caption** al pie de cada mes, y colores editables por mes.
- **Margen de argollado** configurable (por defecto 10 mm) con guía visual que no se exporta.
- **Tamaño y alineación** de cada texto (nombre del mes, frase, días, números, nombres, festivos, pie, portada y contraportada).
- Vista previa en vivo con **zoom** (botones, Ctrl + rueda o teclas + / - / 0) y arrastre para desplazarse; vista de todas las páginas y guardado automático en el navegador.
- **Exportar a PDF** de 210 × 150 mm por página.
- Descargar / abrir el proyecto completo (incluye fotos) como `.json`.

## Plantillas y fondos

- **12 plantillas incluidas**: Acuarela, Minimalista, Floral, Boho terracota, Infantil, Elegante, Navidad, Romántico, Nórdico, Tropical, Vintage y Noche estrellada. Cambian colores, tipografías, decoraciones, forma de etiquetas y fotos, y el marco de portada. Las fechas, textos y fotos se conservan.
- **Detalles por página**: decoración, colores, etiquetas, fotos, celdas y posición se pueden aplicar a todo el calendario o solo a una página.
- **21 decoraciones**: acuarela, hojas, confeti, destellos, corazones, copos, lunares, arcoíris boho, marco, flores, mariposas, globos, banderines, nubes, sol, luna, ondas, notas musicales, geométrico, esquinas ornamentales y cinta washi.
- **Plantillas propias**: guarda el estilo actual como `.json` (opcionalmente con fondos) y cárgalo después o compártelo.
- **Fondos desde Canva**: diseña un lienzo de 21 × 15 cm (2480 × 1772 px), descárgalo como PNG o JPG y súbelo como fondo general de los meses, de un mes específico, de la portada o de la contraportada. Se puede ajustar la opacidad de las celdas, agregar bordes y mover la cuadrícula para que encaje con el diseño.

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
