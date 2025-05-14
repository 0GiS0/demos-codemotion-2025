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

# Print the agenda with rich
def print_agenda(agenda):
    console.print("[bold magenta]Agenda:[/bold magenta]")
    for item in agenda:
        console.print(f"[bold cyan]{item['title']}[/bold cyan]")
        console.print(f"  [green]Date:[/green] {item['date']}")
        console.print(f"  [green]Time:[/green] {item['time']}")
        console.print(f"  [green]Stage:[/green] {item['stage']}")
        if 'speaker' in item:
            console.print(f"  [green]Speaker:[/green] {item['speaker']}")
        if 'tags' in item:
            console.print(f"  [green]Tags:[/green] {', '.join(item['tags'])}")
        console.print(f"  [green]Type:[/green] {item['type']}")
        console.print("")


agenda = get_agenda_items(agenda_file)

print_agenda(agenda)

# Count the number of items in the agenda
agenda_count = len(agenda)
console.print(f"[bold green]Total agenda items: {agenda_count}[/bold green]")
