import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const db = new sqlite3.Database("presenze.db");
const saltRounds = 10;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve file statici da /frontend
app.use("/frontend", express.static(path.join(__dirname, "../frontend")));

// Redirect dalla root ("/") a login.html
app.get("/", (req, res) => {
  res.redirect("/frontend/login.html");
});

// Inizializza il database
const initDB = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Dipendenti (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Nome TEXT,
        Cognome TEXT,
        Matricola TEXT,
        Ruolo TEXT,
        DataAssunzione TEXT,
        Email TEXT,
        Attivo INTEGER
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS Presenze (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Dipendente INTEGER,
        Data TEXT,
        OraEntrata TEXT,
        OraUscita TEXT,
        Tipologia TEXT,
        Note TEXT
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS Turni (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Dipendente INTEGER,
        Data TEXT,
        OraInizio TEXT,
        OraFine TEXT,
        TipoTurno TEXT
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS Utenti (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Dipendente INTEGER,
        Username TEXT,
        Password TEXT,
        LivelloAccesso TEXT
      );
    `);

    const adminUsername = "admin";
    const adminPassword = "Admin123";

    db.get(
      "SELECT ID FROM Utenti WHERE Username = ?",
      [adminUsername],
      (err, row) => {
        if (err) return console.error(err.message);
        if (!row) {
          bcrypt.hash(adminPassword, saltRounds, (err, hash) => {
            if (err) return console.error(err.message);
            db.run(
              `INSERT INTO Utenti (Username, Password, LivelloAccesso) VALUES (?, ?, ?)`,
              [adminUsername, hash, "Admin"],
              function (err) {
                if (err) return console.error(err.message);
                console.log(
                  `Default admin user created with ID: ${this.lastID}`,
                );
              },
            );
          });
        }
      },
    );
  });
};

initDB();

// ROTTE API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM Utenti WHERE Username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: "Errore del server" });
    if (!user) return res.status(401).json({ error: "Credenziali non valide" });

    bcrypt.compare(password, user.Password, (err, result) => {
      if (err) return res.status(500).json({ error: "Errore del server" });
      if (result) {
        res.json({
          success: true,
          user: {
            id: user.ID,
            username: user.Username,
            ruolo: user.LivelloAccesso,
          },
        });
      } else {
        res.status(401).json({ error: "Credenziali non valide" });
      }
    });
  });
});

app.post("/api/users", (req, res) => {
  const { username, password, ruolo } = req.body;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Errore nella cifratura della password" });
    db.run(
      `INSERT INTO Utenti (Username, Password, LivelloAccesso) VALUES (?, ?, ?)`,
      [username, hash, ruolo],
      function (err) {
        if (err)
          return res
            .status(500)
            .json({ error: "Errore nella creazione dell'utente" });
        res
          .status(201)
          .json({ message: "Utente creato con successo", userId: this.lastID });
      },
    );
  });
});

app.get("/api/users", (req, res) => {
  db.all("SELECT ID, Username, LivelloAccesso FROM Utenti", [], (err, rows) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Errore nella lettura degli utenti" });
    res.json(rows);
  });
});

app.post("/api/presenze/entrata", (req, res) => {
  const { id_dipendente } = req.body;
  const data = new Date().toISOString().split("T")[0];
  const oraEntrata = new Date().toLocaleTimeString("it-IT");
  db.run(
    `INSERT INTO Presenze (ID_Dipendente, Data, OraEntrata) VALUES (?, ?, ?)`,
    [id_dipendente, data, oraEntrata],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella registrazione dell'entrata" });
      res
        .status(201)
        .json({
          message: "Entrata registrata con successo",
          presenzaId: this.lastID,
        });
    },
  );
});

app.post("/api/presenze/uscita", (req, res) => {
  const { id_dipendente } = req.body;
  const oraUscita = new Date().toLocaleTimeString("it-IT");
  db.run(
    `UPDATE Presenze SET OraUscita = ? WHERE ID_Dipendente = ? AND OraUscita IS NULL ORDER BY ID DESC LIMIT 1`,
    [oraUscita, id_dipendente],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella registrazione dell'uscita" });
      res.json({ message: "Uscita registrata con successo" });
    },
  );
});

app.post("/api/richieste", (req, res) => {
  const { id_dipendente, tipoRichiesta } = req.body;
  const data = new Date().toISOString().split("T")[0];
  db.run(
    `INSERT INTO Presenze (ID_Dipendente, Data, Tipologia) VALUES (?, ?, ?)`,
    [id_dipendente, data, tipoRichiesta],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nell'invio della richiesta" });
      res
        .status(201)
        .json({
          message: "Richiesta inviata con successo",
          richiestaId: this.lastID,
        });
    },
  );
});

app.post("/api/turni", (req, res) => {
  const { id_dipendente, data, oraInizio, oraFine, tipoTurno } = req.body;
  db.run(
    `INSERT INTO Turni (ID_Dipendente, Data, OraInizio, OraFine, TipoTurno) VALUES (?, ?, ?, ?, ?)`,
    [id_dipendente, data, oraInizio, oraFine, tipoTurno],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella creazione del turno" });
      res
        .status(201)
        .json({ message: "Turno creato con successo", turnoId: this.lastID });
    },
  );
});

app.get("/api/presenze/oggi", (req, res) => {
  const data = new Date().toISOString().split("T")[0];
  db.all(
    `
    SELECT d.Nome, d.Cognome, p.OraEntrata, p.OraUscita
    FROM Presenze p
    JOIN Dipendenti d ON p.ID_Dipendente = d.ID
    WHERE p.Data = ?
  `,
    [data],
    (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella lettura delle presenze" });
      res.json(rows);
    },
  );
});

app.get("/api/presenze/statistiche", (req, res) => {
  const dataInizioMese =
    new Date().toISOString().split("T")[0].substring(0, 7) + "-01";
  db.all(
    `
    SELECT d.Nome, d.Cognome, COUNT(p.ID) as giorni_presenza
    FROM Presenze p
    JOIN Dipendenti d ON p.ID_Dipendente = d.ID
    WHERE p.Data >= ?
    GROUP BY d.ID
  `,
    [dataInizioMese],
    (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella lettura delle statistiche" });
      res.json(rows);
    },
  );
});

// Avvio server
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});
