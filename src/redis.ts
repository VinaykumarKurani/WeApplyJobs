import IORedis from "ioredis";
import "dotenv/config";

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => console.log("[redis] connected"));
connection.on("error", (err) => console.error("[redis] connection error", err));
