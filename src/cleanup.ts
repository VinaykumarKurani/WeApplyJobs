import { notificationsQueue } from "./queues";

async function main() {
  const failed = await notificationsQueue.getJobs(["failed"]);
  console.log(`Clearing ${failed.length} old failed jobs`);
  await notificationsQueue.clean(0, 1000, "failed");
  process.exit(0);
}

main();
