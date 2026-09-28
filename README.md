# BlueVerse Remote Portal

A Vercel-hosted remote interface for Luke's private, local-first BlueVerse AI runtime.

> The Vercel deployment is the window, not the brain. Liam's conversations, durable memory, Cognitive Core, Recursive Learning, models, and local tools remain on the private BlueVerse workstation.

## Current remote features

- Connect to a temporary BlueVerse Remote Gateway using the connection details shown by the local launcher.
- Chat with the same local Liam runtime.
- Continue existing conversations stored in the local BlueVerse database.
- See the active local model, durable-memory count, cognition state, and promoted recursive-learning lessons.
- Choose Fast, Main, or Deep for an individual remote turn without changing the workstation's persistent profile.

## Security boundary

The remote client does not contain the BlueVerse backend. The temporary gateway exposes only health, learning status, conversation read access, and chat. It does not expose shell, files, desktop control, browser control, operator grants, the normal portal API, raw model services, media services, or voice services.

Connection credentials are entered by the user and are not stored in this repository or embedded in the Vercel build. The canonical BlueVerse runtime and gateway implementation live in the private `jasperboi89/blueverse-ai` repository.

## Vercel

This repository contains the Vercel-facing React/Vite application under `apps/web`. The root `vercel.json` builds that application.

## Local development

```powershell
cd apps/web
npm ci
npm run dev
```

A functional remote session also requires the private BlueVerse runtime and its remote gateway to be running.

## Repository map

```text
apps/
  web/                 Vercel remote client
  api/                 Legacy foundation API scaffold
docs/
  ARCHITECTURE.md      Original foundation architecture notes
  LICENSE-INVENTORY.md Third-party license tracking
  ROADMAP.md           Earlier roadmap
vercel.json            Vercel web build configuration
```

## Ownership

Copyright © 2026 Luke / BlueVerse. All rights reserved. See [LICENSE.md](LICENSE.md).
