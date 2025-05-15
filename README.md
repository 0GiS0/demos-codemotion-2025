# Demos Codemotion 2025

¡Hola developer 👋🏻! En este repo puedes encontrar todas las demos que mostré durante la Codemotion Madrid 2025, donde hablé sobre GitHub Copilot Chat en su modo agente y, como no, sobre MCP Servers.

## Qué es GitHub Copilot

GitHub Copilot es un asistente de programación impulsado por IA que ayuda a los desarrolladores a escribir código más rápido y con menos errores. Utiliza modelos de lenguaje avanzados para sugerir líneas de código, funciones completas e incluso resolver problemas complejos.

## Qué es GitHub Copilot Chat

GitHub Copilot Chat es una herramienta de chat que permite a los desarrolladores interactuar con GitHub Copilot de manera más natural. Puedes hacer preguntas, pedir sugerencias y recibir respuestas en tiempo real, lo que facilita la colaboración y la resolución de problemas.

## ¿Y qué es el modo agente?

El modo agente de GitHub Copilot Chat es una funcionalidad avanzada que permite a los desarrolladores utilizar Copilot como un asistente virtual. Puedes pedirle que realice tareas específicas, como escribir código, depurar errores o incluso aprender nuevas tecnologías. Esto transforma la forma en que los desarrolladores interactúan con la IA, haciéndola más intuitiva y eficiente.

## Misión 1: Recuperar la agenda de Codemotion Madrid 2025

Esta la podemos encontrar aqui: https://conferences.codemotion.com/madrid2025/es/agenda-es/ y quiero que GitHub Copilot Chat pueda usarla para darme recomendaciones de charlas que ver durante estos dos días. Así que lo primero que hice fue unos cuantos pantallazos de la web de la Codemotion 😇 que he guardado en `codemotion-agenda/screenshots`. Estos se los he pasado a GitHub Copilot en su modo agente para que los leyera y me creara un JSON con la info de todas las charlas en el directorio `codemotion-agenda/data/agenda-codemotion-2025.json`

## Mision 2: Guardar la agenda en una base de datos vectorial

Para guardar la agenda en una base de datos vectorial voy a utilizar Qdrant, que es una base de datos vectorial open source. Para ello he creado un script en Python que lee el JSON que hemos creado en la misión 1 y lo guarda en Qdrant. El script se encuentra en `codemotion-agenda/insert_agenda.py`. La base de datos de Qdrant forma parte de mi configuración de Dev Containers, por lo que no necesitas instalar nada. Para ver el resultado de la inserción de los datos puedes abrir la interfaz de Qdrant en el navegador [http://localhost:6333/dashboard](http://localhost:6333/dashboard) y ver los datos que hemos insertado. 

## Misión 3: Consultar los datos de la agenda usando un modelo de IA Generativa con GitHub Models

Para consultar los datos de la agenda he creado un script en Python que utiliza el modelo de IA Generativa de GitHub, que es un modelo de lenguaje entrenado por GitHub. Este modelo es capaz de entender el lenguaje natural y responder a preguntas sobre los datos que hemos insertado en Qdrant. El script se encuentra en `codemotion-agenda/query_agenda.py`.

## Misión 4: Crear un MCP Server para que podamos integrar estas consultas como parte de Github Copilot Chat

Para nuestra cuarta mision he creado un MCP Server que se encuentra en el direction `codemotion-mcp-server`. Este servidor se encarga de recibir las consultasdel usuario, que le llegan a través de GitHub Copilot Chat para buscar en esa base de datos vectorial las charlas que más se ajustan a la consulta del usuario. También se encarga de darle la hora y el día actual para que le de información de las charlas que se están dando en ese momento o que se van a dar en el futuro. 


Puedes probar el servidor usando la herramienta MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```
