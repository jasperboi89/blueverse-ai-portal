# Security Policy

## Development status

BlueVerse AI Portal is under active development and is not yet approved for public internet exposure or production handling of regulated data.

## Never commit

- `.env` files, passwords, tokens, or private keys
- Customer messages, tickets, documents, or conversation histories
- Local databases, uploads, logs, generated media, or backups
- AI models, LoRAs, checkpoints, or embeddings
- Company-confidential instructions or account data

If a secret is committed, treat it as exposed: revoke or rotate it immediately, then remove it from Git history.

## Network boundaries

- Keep Ollama, Open WebUI, and ComfyUI on a trusted private network.
- Do not forward their ports directly through the router.
- Add authentication and TLS before any remote access.
- Restrict CORS and trusted origins before production deployment.

## Reporting

For now, report security concerns privately to the repository owner. Do not open a public issue containing secrets or customer information.
