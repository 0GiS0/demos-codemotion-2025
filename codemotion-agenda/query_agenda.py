from qdrant_client import QdrantClient
from openai import OpenAI
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
import os

load_dotenv()
console = Console()

collection_name = os.getenv("QDRANT_COLLECTION_NAME")
client = OpenAI(
    base_url=os.getenv("GITHUB_MODELS_URL"),
    api_key=os.getenv("GITHUB_TOKEN")
)

# Inicializar el cliente de Qdrant
qdrant_client = QdrantClient(url=os.getenv("QDRANT_URL"))


def query_embeddings(query):
    console.print(
        ":mag: [bold cyan]Generando embedding para la consulta...[/bold cyan]")
    embedding_response = client.embeddings.create(
        model=os.getenv("GITHUB_MODELS_MODEL_FOR_EMBEDDINGS"),
        input=query
    )
    query_vector = embedding_response.data[0].embedding

    console.print(
        ":satellite: [bold cyan]Buscando documentos similares en Qdrant...[/bold cyan]")
    search_results = qdrant_client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=3,
        with_payload=True
    ).points

    console.print(
        f":page_facing_up: [bold green]{len(search_results)} resultados encontrados.[/bold green]")
    return search_results


def generate_response_with_embeddings(query, search_results):
    context = ""
    for i, result in enumerate(search_results):
        date = result.payload.get("date", "Sin fecha")
        time = result.payload.get("time", "Sin hora")
        stage = result.payload.get("stage", "Sin escenario")
        speaker = result.payload.get("speaker", "Sin ponente")
        session_type = result.payload.get("type", "Sin tipo")
        title = result.payload.get("title", "Sin título")

        context += f"\n--- Información relevante para el día {date} ---\n"
        context += f"título: {title}\n"
        context += f"speaker: {speaker}\n"
        context += f"tipo de sesión: {session_type}\n"
        context += f"stage: {stage}\n"
        context += f"hora de la charla: {time}\n\n"

    prompt = f"""Responde a la siguiente consulta utilizando la información proporcionada.\n 
            Si la información proporcionada no es suficiente para responder, puedes indicarlo.\n\n                
            
            Contexto:\n 
              {context}\n\n
            
            Consulta: {query}\n\n 
            
            Respuesta:"""

    system_prompt = ("Eres un asistente experto en la agenda del evento Codemotion Madrid 2025."
                     "Tu tarea es responder a las preguntas de los usuarios utilizando la información proporcionada en el contexto."
                     "Si la información no es suficiente, indícalo y sugiere buscar más información.")

    console.print(
        ":robot: [bold cyan]Generando respuesta con el modelo...[/bold cyan]")
    
    response = client.chat.completions.create(
        model=os.getenv("GITHUB_MODELS_MODEL_FOR_GENERATION"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content


# 1. Genero un bucle para poder preguntar de forma continua
while True:
    # Solicitar la consulta al usuario
    query = console.input(
        ":question: [bold blue]¿Qué charla estás buscando? (Escribe 'salir' para terminar): [/bold blue]")
    if query.lower() == "salir":
        console.print(":wave: [bold red]Saliendo...[/bold red]")
        break
    if not query.strip():
        console.print(
            ":warning: [bold red]Consulta vacía. Por favor, introduce una consulta válida.[/bold red]")
        continue

    console.print(Panel(
        f":thinking_face: [bold yellow]Consulta:[/bold yellow] {query}", title="Consulta del usuario"))

    # 2. Obtener los embeddings más similares a la consulta
    search_results = query_embeddings(query)

    # 3. Generar la respuesta utilizando los embeddings como contexto
    result = generate_response_with_embeddings(query, search_results)

    # 4. Imprimir la respuesta generada
    console.print(Panel(Markdown(result), title=":sparkles: Respuesta Generada",
                  subtitle=":clapper: Codemotion Assistant"))
