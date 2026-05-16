import Database from '@tauri-apps/plugin-sql';

export const getDb = async () => {
  return await Database.load('sqlite:zenstick.db');
};

export const initDb = async () => {
  try {
    const db = await getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        color TEXT,
        is_pinned INTEGER DEFAULT 0,
        snapshots TEXT, -- YEH LINE ADD KI HAI
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database Initialized! ✅");
  } catch (error) {
    console.error("Database Init Error:", error);
  }
};