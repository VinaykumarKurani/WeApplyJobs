import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

export const db = new DatabaseSync(path.join(dataDir, "applications.db"));

db.exec("PRAGMA journal_mode = WAL");

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

export const insertApplication = db.prepare(`
  INSERT INTO applications (jobId, candidateId, recruiterId, coverLetter)
  VALUES (?, ?, ?, ?)
`);
