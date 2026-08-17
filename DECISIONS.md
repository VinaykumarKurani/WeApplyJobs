# DECISIONS.md

- Choose fastify over express to get the alignment with the JD, I gave it a try even though I was not familiar with it (to learn something new)

- Choose better-sqlite3 over prisma as it was lightweight, sufficient enough for the demo and avoid prisma pool exhaustion

- The default sqlite locks whole file for one write, but had to run 20 concurrent requests, so used journal_mode = WAL

- Choose upstash redis instead of local as it would require wsl or docker kept running which is not required for small assessment, and shared the single ioredis across all queues/workers because of connection cap on free tier

- Upstash's default eviction policy (optimistic-volatile) allows Redis to silently drop keys under memory pressure to free up space.So changed the policy to noeviction so Redis rejects writes when its full instead of deleting queued job data.

- BullMQ does not have DLQ, so created a separate queue for dead letter with a guard to avoid duplicate entries per job

- Observed ~600ms response latency under 20 concurrent requests because of redis network, but the sqlite inserts happened under 5ms

- The failed job state stays in redis until its manually cleaned which was a operation gap observed
