#!/usr/bin/env python3
"""
Generate OpenAPI specification file from FastAPI app metadata.
"""

import sys
import os
import json

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

try:
    from main import app
    from fastapi.openapi.utils import get_openapi
except ImportError as e:
    print(f"Error importing app: {e}. Make sure backend dependencies are installed.")
    sys.exit(1)

def main():
    os.makedirs(os.path.join(os.path.dirname(__file__), "../docs/api"), exist_ok=True)
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../docs/api/openapi.json"))
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2)
    print(f"OpenAPI spec generated successfully at {output_path}")

if __name__ == "__main__":
    main()
