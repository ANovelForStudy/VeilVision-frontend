# Frontend

## Setup

Install dependencies:

```bash
pnpm install
```

Create local environment variables:

```bash
cp .env.example .env
```

Available runtime variables:

```bash
NUXT_PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8000
NUXT_PUBLIC_BACKEND_API_PREFIX=/api
NUXT_PUBLIC_MEDIAMTX_BASE_URL=http://127.0.0.1:8889
NUXT_PUBLIC_MEDIAMTX_CONTROL_API_URL=http://127.0.0.1:9997/v3
```

## Development

```bash
pnpm dev
```

## Production build

```bash
pnpm build
pnpm preview
```

## API integration

The frontend now includes:

- a shared HTTP client with timeout, bearer token injection and normalized API errors
- backend service modules for auth and cameras
- MediaMTX helpers for browser, WHEP and WHIP URLs
- MediaMTX Control API access through `/v3/paths/list`

MediaMTX references used for the integration:

- WebRTC browser page: `http://host:8889/<streamPath>`
- WHEP endpoint: `http://host:8889/<streamPath>/whep`
- Control API list paths: `http://host:9997/v3/paths/list`
