# Demos Codemotion 2025 🚀

¡Hola developer 👋🏻! En este repo puedes encontrar todas las demos que mostré durante la Codemotion Madrid 2025, donde hablé sobre **GitHub Copilot Chat** en su modo agente y, como no, sobre **MCP Servers**. También puedes ver [este vídeo que he publicado en mi canal de YouTube](https://youtu.be/wvtoy_z99xI) con todas las demos que mostré. 🎥

[![Codemotion Madrid 2025](images/mis%20demos%20de%20codemotion%20madrid%202025.png)](https://youtu.be/wvtoy_z99xI)

## ¿Qué es GitHub Copilot? 🤖

GitHub Copilot es un asistente de programación impulsado por IA que ayuda a los desarrolladores a escribir código más rápido y con menos errores. Utiliza modelos de lenguaje avanzados para sugerir líneas de código, funciones completas e incluso resolver problemas complejos.

## ¿Qué es GitHub Copilot Chat? 💬

GitHub Copilot Chat es una herramienta de chat que permite a los desarrolladores interactuar con GitHub Copilot de manera más natural. Puedes hacer preguntas, pedir sugerencias y recibir respuestas en tiempo real, lo que facilita la colaboración y la resolución de problemas.

## ¿Cuáles son los diferentes modos de Copilot Chat? 🛠️

A día de hoy GitHub Copilot Chat tiene tres modos de funcionamiento:
1. **Ask** ❓: Permite a los desarrolladores hacer preguntas y recibir respuestas en lenguaje natural, pero estas no modifican tu código, solamente se muestran en el chat.
2. **Edit** ✏️: Permite realizar cambios en tu código directamente desde el chat. Una vez que termine de obtener la respuesta, el código se actualizará automáticamente en el editor.
3. **Agent** 🤝: Permite interactuar con GitHub Copilot de manera más avanzada. No solo es capaz de editar código, sino que además puede crear contenido totalmente nuevo, ejecutar scripts, dividir tareas en subtareas y, como no, interactuar con MCP Servers.

En esta sesión se mostraron diferentes ejemplos con todo ello.

---

## 🗓️ Misión 1: Recuperar la agenda de Codemotion Madrid 2025

Puedes encontrar la agenda aquí: https://conferences.codemotion.com/madrid2025/es/agenda-es/ y quiero que GitHub Copilot Chat pueda usarla para darme recomendaciones de charlas que ver durante estos dos días. Así que lo primero que hice fue unos cuantos pantallazos de la web de la Codemotion 😇 que he guardado en `codemotion-agenda/screenshots`. Estos se los he pasado a GitHub Copilot en su modo agente para que los leyera y me creara un JSON con la info de todas las charlas en el directorio `codemotion-agenda/data/agenda-codemotion-2025.json`.

### 🤖 Usar el MCP Server de Playwright para recuperar la agenda

La otra opción es usar el modo agente y uno de los MCP servers que ya existe de la herramienta Playwright: https://github.com/microsoft/playwright-mcp. Para ello me creé un archivo de tipo prompt llamado `.github/prompts/get_codemotion_agenda.prompt.md` con todas las instrucciones, el modo de chat que quería usar y las tools del MCP Server de Playwright que quería que tuviera en cuenta.

---

## 🧠 Misión 2: Guardar la agenda en una base de datos vectorial

Para guardar la agenda en una base de datos vectorial utilicé **Qdrant**, que es una base de datos vectorial open source. Para ello creé un script en Python que lee el JSON que hemos creado en la misión 1 y lo guarda en Qdrant. El script se encuentra en `codemotion-agenda/insert_agenda.py`. La base de datos de Qdrant forma parte de mi configuración de Dev Containers, por lo que no necesitas instalar nada. 

Para ver el resultado de la inserción de los datos puedes abrir la interfaz de Qdrant en el navegador [http://localhost:6333/dashboard](http://localhost:6333/dashboard) y ver los datos que hemos insertado. 🖥️

---

## 🔍 Misión 3: Consultar los datos de la agenda usando un modelo de IA Generativa con GitHub Models

Previo al MCP Server, para consultar los datos de la agenda también creé un script en Python: `codemotion-agenda/query_agenda.py` para verificar que podía recuperar la información sin problemas.

---

## 🛡️ Misión 4: Crear un MCP Server para que podamos integrar estas consultas como parte de GitHub Copilot Chat

Para nuestra cuarta misión he creado un MCP Server que se encuentra en el directorio `codemotion-mcp-server`. Este servidor se encarga de recibir las consultas del usuario, que le llegan a través de GitHub Copilot Chat, para buscar en esa base de datos vectorial las charlas que más se ajustan a la petición. También se encarga de darle la hora y el día actual para que le dé información de las charlas que se están dando en ese momento o que se van a dar en el futuro. ⏰

Puedes probar el servidor usando la herramienta MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

¡Nos vemos 👋🏻!