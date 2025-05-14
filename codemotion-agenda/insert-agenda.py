import json
from openai import OpenAI
from dotenv import load_dotenv
import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from qdrant_client.http.exceptions import UnexpectedResponse
from rich.console import Console
from rich.progress import track

load_dotenv()
console = Console()

collection_name = os.getenv("QDRANT_COLLECTION_NAME")
qdrant_url = os.getenv("QDRANT_URL")

# Create a collection if it doesn't exist
qdrant_client = QdrantClient(url=qdrant_url)
try:
    qdrant_client.get_collection(collection_name)
except UnexpectedResponse:
    qdrant_client.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=1536,
            distance=Distance.COSINE
        )
    )

# Load OpenAI API key
client = OpenAI(
    base_url=os.getenv("GITHUB_MODELS_URL"),
    api_key=os.getenv("GITHUB_TOKEN"),
)

agenda_file = "codemotion-agenda/data/agenda-codemotion-2025.json"


def get_agenda_items(file_path):
    with open(file_path, "r") as file:
        agenda = json.load(file)
    return agenda

# Print the agenda in tables by day and time
def print_agenda_by_day_and_time(agenda):
    from rich.table import Table
    from itertools import groupby
    from operator import itemgetter

    # Ordenar por fecha y hora
    agenda_sorted = sorted(agenda, key=lambda x: (x['date'], x['time']))
    for date, items in groupby(agenda_sorted, key=itemgetter('date')):
        table = Table(title=f"Agenda {date}")
        table.add_column("Hora", style="cyan", no_wrap=True)
        table.add_column("Stage", style="magenta")
        table.add_column("Título", style="bold")
        table.add_column("Ponente(s)", style="green")
        table.add_column("Tipo", style="yellow")
        for item in items:
            table.add_row(
                item['time'],
                item['stage'],
                item['title'],
                item.get('speaker', ''),
                item['type']
            )
        console.print(table)


agenda = get_agenda_items(agenda_file)

print_agenda_by_day_and_time(agenda)

# Count the number of items in the agenda
agenda_count = len(agenda)
console.print(f"[bold green]Total agenda items: {agenda_count}[/bold green]")
