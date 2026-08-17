# RUNBOOK.md

## Prerequisites

- Node v22.21.1
- Upstash Redis (see below)

## Setup

1. Clone the repo
2. Create a `.env` file in the project root — refer to `.env.example` for the required shape. The actual Upstash Redis URL has been shared separately via email (not committed, since it contains credentials).
3. Install dependencies:

```bash
npm i
```

## Running the service

```bash
npm run dev
```

Server runs on `http://localhost:3000`.

## Demo: 20 concurrent requests + queue drain

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npx tsx src/demo.ts
```

Expected output:

```
Fired 20 requests in 384ms — 0 failed
[t+0s] status=ok notifications(w:18 a:1 f:0) stats-updates(w:18 a:1 f:0) audit-logs(w:18 a:1 f:0)
[t+1s] status=ok notifications(w:6 a:1 f:0) stats-updates(w:4 a:1 f:0) audit-logs(w:4 a:1 f:0)
[t+2s] status=ok notifications(w:7 a:1 f:0) stats-updates(w:0 a:0 f:0) audit-logs(w:0 a:0 f:0)
[t+3s] status=ok notifications(w:0 a:0 f:0) stats-updates(w:0 a:0 f:0) audit-logs(w:0 a:0 f:0)
[t+4s] status=ok notifications(w:0 a:1 f:0) stats-updates(w:0 a:0 f:0) audit-logs(w:0 a:0 f:0)
[t+5s] status=ok notifications(w:0 a:0 f:0) stats-updates(w:0 a:0 f:0) audit-logs(w:0 a:0 f:0)
[t+6s] status=ok notifications(w:0 a:0 f:0) stats-updates(w:0 a:0 f:0) audit-logs(w:0 a:0 f:0)
[t+7s] status=ok notifications(w:0 a:0 f:0) stats-updates(w:0 a:0 f:0) audit-logs(w:0 a:0 f:0)
[t+8s] status=ok notifications(w:0 a:1 f:0) stats-updates(w:0 a:0 f:0) audit-logs(w:0 a:0 f:0)
[t+9s] status=ok notifications(w:0 a:0 f:0) stats-updates(w:0 a:0 f:0) audit-logs(w:0 a:0 f:0)
```

Queue depths should trend from nonzero `waiting`/`active` toward `0` across the poll, with `failed` staying at `0` on a clean run.

## Create an application

```bash
curl --location 'http://localhost:3000/api/applications' \
--header 'Content-Type: application/json' \
--data '{
    "jobId": "j1",
    "candidateId": "c1",
    "recruiterId": "r1",
    "coverLetter": "test"
}'
```

Successful response shape:

```json
{
  "id": 30,
  "jobId": "j1",
  "candidateId": "c1",
  "recruiterId": "r1",
  "coverLetter": "test"
}
```

## Health check

```bash
curl --location 'http://localhost:3000/health'
```

Successful response shape:

```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected",
  "queues": {
    "notifications": {
      "waiting": 0,
      "active": 0,
      "failed": 0
    },
    "stats-updates": {
      "waiting": 0,
      "active": 0,
      "failed": 0
    },
    "audit-logs": {
      "waiting": 0,
      "active": 0,
      "failed": 0
    }
  },
  "uptime": 88
}
```

If DB or Redis is unreachable, this returns `503` with the corresponding field set to `"disconnected"`.
