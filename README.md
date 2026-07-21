# BlueVerse AI Portal

A private, local-first AI workspace that connects chat, knowledge, image generation, and practical business workflows behind one calm interface.

> Status: foundation scaffold. The first working slice provides a BlueVerse dashboard, API health checks, and configuration hooks for Ollama, Open WebUI, and ComfyUI. The existing portal source can be merged into this structure when it is ready.

## What this repository owns

- The BlueVerse user experience and visual system
- Portal orchestration and business logic
- Knowledge Vault and workflow features added here
- Installation, configuration, documentation, and tests

Open WebUI, Ollama, ComfyUI, models, LoRAs, and custom nodes remain separate dependencies. They are not copied into this repository.

## Quick start

### Requirements

- Docker Desktop with Docker Compose
- Git
- Optional services running on your network: Ollama, Open WebUI, and ComfyUI

### Run it

1. Copy `.env.example` to `.env`.
2. Adjust the service URLs if the defaults do not match your machines.
3. Start the portal:

   ```powershell
   .\scripts\start.ps1
   ```

   Or on macOS/Linux:

   ```bash
   ./scripts/start.sh
   ```

4. Open <http://localhost:4173>.

The API health endpoint is available at <http://localhost:8787/api/health>.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `BLUEVERSE_ENV` | `development` | Runtime environment label |
| `PORTAL_API_PORT` | `8787` | Host port for the API |
| `PORTAL_WEB_PORT` | `4173` | Host port for the web app |
| `OLLAMA_URL` | `http://host.docker.internal:11434` | Ollama endpoint |
| `OPEN_WEBUI_URL` | `http://host.docker.internal:3000` | Open WebUI endpoint |
| `COMFYUI_URL` | `http://host.docker.internal:8188` | ComfyUI endpoint |

Never commit `.env`. It may eventually contain API keys, database credentials, and private network details.

## Repository map

```text
apps/
  api/                 FastAPI orchestration service
  web/                 React + Vite BlueVerse interface
docs/
  ARCHITECTURE.md      System boundaries and data flow
  LICENSE-INVENTORY.md Third-party license tracking
  ROADMAP.md           Practical build sequence
scripts/               Local startup helpers
.github/workflows/     Automated validation
```

## Safety and privacy defaults

- The repository is intended to remain private during development.
- Models, generated media, chats, uploads, databases, and secrets are ignored by Git.
- AI services are referenced by URL rather than bundled or redistributed.
- Internet-facing deployment is intentionally not configured yet.

See [SECURITY.md](SECURITY.md) before connecting real customer or company data.

## Ownership

Copyright © 2026 Luke / BlueVerse. All rights reserved. See [LICENSE.md](LICENSE.md).
