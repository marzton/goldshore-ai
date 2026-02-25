import json
from pathlib import Path


def validate_turbo():
    config = json.loads(Path("turbo.json").read_text())
    pipelines = config.get("pipeline", {})
    if "build" not in pipelines:
        raise Exception("Turbo build pipeline missing")
