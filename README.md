# Promptly

Promptly is a visual prompt composition tool for AI image and model workflows. It supports multi-workspace editing, prompt fragments, snapshots, presets, folders, search, batch management, import/export, translation configuration, and multi-user data storage.

## Docker Deployment

The current release is Docker-only.

### Quick Start

```bash
docker run -d \
  --name promptly \
  -p 8080:3001 \
  -v promptly-data:/app/data \
  -e NODE_ENV=production \
  -e DATA_DIR=/app/data \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  --restart unless-stopped \
  smkgun/promptly:latest
```

Open `http://localhost:8080` after the container starts.

### Docker Compose

```yaml
version: '3.8'

services:
  promptly:
    image: smkgun/promptly:latest
    container_name: promptly
    ports:
      - "8080:3001"
    volumes:
      - promptly-data:/app/data
    restart: unless-stopped
    environment:
      - PORT=3001
      - DATA_DIR=/app/data
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}

volumes:
  promptly-data:
```

Generate a production secret before deployment:

```bash
openssl rand -base64 32
```

## Environment Variables

| Name | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | HTTP server port inside the container |
| `DATA_DIR` | `/app/data` | Persistent data directory |
| `NODE_ENV` | `production` | Runtime environment |
| `JWT_SECRET` | none | Required for production authentication tokens |

## Data

Promptly stores account data and user workspaces as JSON files under `/app/data`. Mount this directory as a Docker volume or host path before using the app in production.

## Local Build

```bash
docker build -t smkgun/promptly:latest .
docker run --rm -p 8080:3001 -v promptly-data:/app/data -e JWT_SECRET="$(openssl rand -base64 32)" smkgun/promptly:latest
```
