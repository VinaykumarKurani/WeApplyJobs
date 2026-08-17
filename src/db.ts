import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

export const db: Database.Database = new Database(
  path.join(dataDir, "applications.db"),
);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId TEXT NOT NULL,
    candidateId TEXT NOT NULL,
    recruiterId TEXT NOT NULL,
    coverLetter TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export const insertApplication: Database.Statement = db.prepare(`
  INSERT INTO applications (jobId, candidateId, recruiterId, coverLetter)
  VALUES (@jobId, @candidateId, @recruiterId, @coverLetter)
`);
