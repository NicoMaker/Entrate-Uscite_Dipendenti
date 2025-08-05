import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";

const DBSOURCE = "./backend/database/db.sqlite";
const saltRounds = 10;

export function initDB() {
  const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) console.error("Errore apertura DB", err.message);
    else console.log("📦 DB connesso");
  });

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS utenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      ruolo TEXT,
      id_dipendente INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS dipendenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      cognome TEXT,
      matricola TEXT,
      ruolo_lavorativo TEXT,
      data_assunzione TEXT,
      email TEXT,
      attivo INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS presenze (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_dipendente INTEGER,
      data TEXT,
      oraEntrata TEXT,
      oraUscita TEXT,
      tipologia TEXT,
      note TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS turni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_dipendente INTEGER,
      data TEXT,
      oraInizio TEXT,
      oraFine TEXT,
      tipoTurno TEXT
    )`);

    db.get(
      "SELECT * FROM utenti WHERE username = 'admin'",
      async (err, row) => {
        if (!row) {
          const hash = await bcrypt.hash("Admin123", saltRounds);
          db.run(
            "INSERT INTO utenti (username, password, ruolo) VALUES (?,?,?)",
            ["admin", hash, "Admin"],
          );
          console.log("👑 Utente Admin creato (Admin / Admin123)");
        }
      },
    );
  });

  return db;
}
