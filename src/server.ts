import Fastify from "fastify";
import "dotenv/config";
import { db } from "./db";
import { createApplicationSchema } from "./schemas";
import { insertApplication } from "./db";
import "./workers";
import {
  notificationsQueue,
  statsUpdatesQueue,
  auditLogsQueue,
} from "./queues";
import { connection } from "./redis";

const app = Fastify({
  logger: true,
});

app.get("/health", async (request, reply) => {
  let dbStatus: "connected" | "disconnected" = "connected";
  try {
    db.prepare("SELECT 1").get();
  } catch {
    dbStatus = "disconnected";
  }

  const redisStatus: "connected" | "disconnected" =
    connection.status === "ready" ? "connected" : "disconnected";

  const emptyCounts = { waiting: 0, active: 0, failed: 0 };
  let queueCounts = {
    notifications: emptyCounts,
    "stats-updates": emptyCounts,
    "audit-logs": emptyCounts,
  };

  if (redisStatus === "connected") {
    const [notifCounts, statsCounts, auditCounts] = await Promise.all([
      notificationsQueue.getJobCounts("waiting", "active", "failed"),
      statsUpdatesQueue.getJobCounts("waiting", "active", "failed"),
      auditLogsQueue.getJobCounts("waiting", "active", "failed"),
    ]);
    queueCounts = {
      notifications: notifCounts,
      "stats-updates": statsCounts,
      "audit-logs": auditCounts,
    } as typeof queueCounts;
  }

  const isHealthy = dbStatus === "connected" && redisStatus === "connected";

  return reply.status(isHealthy ? 200 : 503).send({
    status: isHealthy ? "ok" : "degraded",
    db: dbStatus,
    redis: redisStatus,
    queues: queueCounts,
    uptime: Math.floor(process.uptime()),
  });
});

app.post("/api/applications", async (request, reply) => {
  const parsed = createApplicationSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { jobId, candidateId, recruiterId, coverLetter } = parsed.data;

  const result = insertApplication.run(
    jobId,
    candidateId,
    recruiterId,
    coverLetter,
  );

  const created = {
    id: result.lastInsertRowid,
    jobId,
    candidateId,
    recruiterId,
    coverLetter,
  };

  await Promise.all([
    notificationsQueue.add("send-notification", {
      applicationId: created.id,
      candidateId,
    }),
    statsUpdatesQueue.add("update-stats", {
      applicationId: created.id,
      recruiterId,
    }),
    auditLogsQueue.add("log-audit", {
      applicationId: created.id,
      jobId,
      recruiterId,
    }),
  ]);

  console.log(
    `[${new Date().toISOString()}] [route] response sent for application ${created.id}`,
  );

  return reply.status(201).send(created);
});

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
