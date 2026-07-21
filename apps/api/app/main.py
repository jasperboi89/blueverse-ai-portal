import asyncio
import os
from dataclasses import dataclass

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


@dataclass(frozen=True)
class ServiceConfig:
    name: str
    url: str
    health_path: str


class ServiceStatus(BaseModel):
    name: str
    url: str
    reachable: bool
    detail: str


app = FastAPI(
    title="BlueVerse Portal API",
    version="0.1.0",
    description="Local-first orchestration API for the BlueVerse AI Portal.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4173", "http://127.0.0.1:4173"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def configured_services() -> list[ServiceConfig]:
    return [
        ServiceConfig("Ollama", os.getenv("OLLAMA_URL", "http://host.docker.internal:11434"), "/api/tags"),
        ServiceConfig("Open WebUI", os.getenv("OPEN_WEBUI_URL", "http://host.docker.internal:3000"), "/health"),
        ServiceConfig("ComfyUI", os.getenv("COMFYUI_URL", "http://host.docker.internal:8188"), "/system_stats"),
    ]


async def check_service(client: httpx.AsyncClient, service: ServiceConfig) -> ServiceStatus:
    target = f"{service.url.rstrip('/')}{service.health_path}"
    try:
        response = await client.get(target)
        response.raise_for_status()
        return ServiceStatus(name=service.name, url=service.url, reachable=True, detail="Connected")
    except httpx.TimeoutException:
        return ServiceStatus(name=service.name, url=service.url, reachable=False, detail="Timed out")
    except httpx.HTTPStatusError as exc:
        return ServiceStatus(
            name=service.name,
            url=service.url,
            reachable=False,
            detail=f"HTTP {exc.response.status_code}",
        )
    except httpx.HTTPError:
        return ServiceStatus(name=service.name, url=service.url, reachable=False, detail="Unavailable")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "blueverse-portal-api",
        "environment": os.getenv("BLUEVERSE_ENV", "development"),
    }


@app.get("/api/services", response_model=list[ServiceStatus])
async def services() -> list[ServiceStatus]:
    timeout = httpx.Timeout(2.5)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        return list(await asyncio.gather(*(check_service(client, item) for item in configured_services())))
