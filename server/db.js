const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'flow_intel.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const initDb = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS flow_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        house_id TEXT NOT NULL,
        flow_rate REAL NOT NULL,
        pressure REAL NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS current_status (
        house_id TEXT PRIMARY KEY,
        flow_rate REAL NOT NULL,
        pressure REAL NOT NULL,
        status TEXT NOT NULL,
        last_updated TEXT NOT NULL
      )
    `);

    // Wipe out the old dummy data so the demo starts totally fresh!
    db.run(`DELETE FROM flow_data`);
    db.run(`DELETE FROM current_status`);
  });
};

const storeReading = (reading) => {
  const { house_id, flow_rate, pressure, status, timestamp } = reading;

  db.serialize(() => {
    db.run(
      `INSERT INTO flow_data (house_id, flow_rate, pressure, status, timestamp) VALUES (?, ?, ?, ?, ?)`,
      [house_id, flow_rate, pressure, status, timestamp],
    );

    db.run(
      `INSERT OR REPLACE INTO current_status (house_id, flow_rate, pressure, status, last_updated) VALUES (?, ?, ?, ?, ?)`,
      [house_id, flow_rate, pressure, status, timestamp],
    );
  });
};

const getLatestReadings = (cb) => {
  db.all(
    `SELECT house_id, flow_rate, pressure, status, last_updated AS timestamp FROM current_status`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        cb([]);
      } else {
        cb(rows);
      }
    },
  );
};

const getReadingHistory = ({ houseId, limit = 24 }, cb) => {
  db.all(
    `
      SELECT house_id, flow_rate, pressure, status, timestamp
      FROM flow_data
      WHERE house_id = ?
      ORDER BY datetime(timestamp) DESC
      LIMIT ?
    `,
    [houseId, limit],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        cb([]);
      } else {
        cb(rows);
      }
    },
  );
};

module.exports = { initDb, storeReading, getLatestReadings, getReadingHistory };
