---

mode: 'agent'
tools: ['browser_navigate', 'browser_click']

---

Abre el navegador y accede a la agenda de Codemotion Madrid 2025: https://conferences.codemotion.com/madrid2025/es/agenda-es/

Extrae toda la agenda de charlas de ambos días (martes 20 y miércoles 21 de mayo de 2025). No me preguntes si quieres extraerla al completo, simplemente hazlo.
Genera un archivo JSON plano (sin agrupación por día) llamado `codemotion-agenda/data/codemotion_agenda_powered_by_playwright.json` con un array de objetos, cada uno representando una charla con los siguientes campos:

- Date (formato DD-MM-YYYY)
- Time
- Duration
- Stage
- Title
- Speakers
- Type
- Tags

