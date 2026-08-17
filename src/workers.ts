import { Worker, Job } from "bullmq";
import { connection } from "./redis";
import { deadLetterQueue } from "./queues";

function makeWorker(queueName: string) {
  const worker = new Worker(
    queueName,
    async (job: Job) => {
      console.log(
        `[${new Date().toISOString()}] [${queueName}] processing job ${job.id}`,
        job.data,
      );
      // stubbed — real implementation (send email, update stats, write audit row) goes here later
    },
    { connection },
  );

  worker.on("error", (err) =>
    console.error(`[${queueName}] worker error`, err),
  );
  worker.on("ready", () => console.log(`[${queueName}] worker ready`));

  worker.on("failed", async (job, err) => {
    console.log(
      `[${new Date().toISOString()}] [${queueName}] job ${job?.id} failed (attempt ${job?.attemptsMade})`,
      err.message,
    );

    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      console.log(
        `[${queueName}] job ${job.id} exhausted retries → moving to dead-letter`,
      );
      await deadLetterQueue.add("dead", {
        originalQueue: queueName,
        data: job.data,
        error: err.message,
      });
    }
  });

  return worker;
}

export const notificationsWorker = makeWorker("notifications");
export const statsUpdatesWorker = makeWorker("stats-updates");
export const auditLogsWorker = makeWorker("audit-logs");
