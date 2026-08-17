import { Queue } from "bullmq";
import { connection } from "./redis";

const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential" as const,
    delay: 1000, // 1s, then 2s, 4s, 8s, 16s between retries
  },
};

export const notificationsQueue = new Queue("notifications", {
  connection,
  defaultJobOptions,
});
export const statsUpdatesQueue = new Queue("stats-updates", {
  connection,
  defaultJobOptions,
});
export const auditLogsQueue = new Queue("audit-logs", {
  connection,
  defaultJobOptions,
});
export const deadLetterQueue = new Queue("dead-letter", { connection });
