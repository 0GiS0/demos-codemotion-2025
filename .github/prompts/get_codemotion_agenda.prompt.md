---

mode: 'agent'
tools: ['browser_navigate', 'browser_click']
description: 'Este prompt está diseñado para extraer la agenda de Codemotion Madrid 2025 utilizando el MCP Server de Playwright.'

---

Abre el navegador y accede a la agenda de Codemotion Madrid 2025: https://conferences.codemotion.com/madrid2025/es/agenda-es/

Extrae todas las sesiones de la agenda de todos los días del evento (no solo martes y miércoles, sino cualquier día que aparezca en la agenda).

Para cada sesión, recopila y guarda en un array de objetos las siguientes propiedades:

date (formato DD-MM-YYYY)
time
duration
stage
title
speakers
type
tags

Vuelca el array completo en un único archivo JSON llamado codemotion_agenda_powered_by_playwright.json en el directorio codemotion-agenda/data. El archivo debe contener un array de objetos, donde cada elemento es una sesión con las propiedades mencionadas.

Ejemplo de estructura JSON:

```json
[
  {
    "date": "20-05-2025",
    "time": "09:30",
    "duration": 15,
    "stage": "Main Stage",
    "title": "Opening",
    "speakers": [],
    "type": "Opening",
    "tags": []
  },
  // ...el resto de las sesiones...
]
```

IMPORTANTE: las sesiones deben estar en el mismo orden que aparecen en la agenda de la web. No modifiques el orden de las sesiones. Si no hay información para alguna propiedad, déjala vacía o como null.

Asegúrate de que el archivo JSON esté bien formado.