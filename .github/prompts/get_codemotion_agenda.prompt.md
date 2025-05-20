---

mode: 'agent'
tools: ['browser_navigate', 'browser_click']
description: 'Este prompt está diseñado para extraer la agenda de Codemotion Madrid 2025 utilizando el MCP Server de Playwright.'

---

Navigate to https://conferences.codemotion.com/madrid2025/es/agenda-es/ and extract all the sessions from the agenda for all days of the event.

For each session, collect and store the following properties in an array of objects:

date (format: DD-MM-YYYY)

time

duration

stage

title

speakers

type

tags

Dump the full array into a single JSON file named codemotion_agenda_powered_by_playwright.json inside the codemotion-agenda/data directory. The file must contain an array of objects, where each element represents a session with the specified properties.

IMPORTANT: Sessions must appear in the same order as they do on the website. Do not change the session order. If any property is missing, leave it empty string.

The stage where each session takes place is written at the top of the table, such as “Main Stage”, “Demo 3”, “Plató 2”, “Plató 5”, “Plató 3”, “Plató 4”, and “Community Area”. Make sure each talk is correctly assigned to its corresponding stage.

Do not make up any data—only include sessions that you actually retrieve from the Codemotion URL.