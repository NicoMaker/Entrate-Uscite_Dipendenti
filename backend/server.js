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
    // Tabella Dipendenti
    db.run(`
      CREATE TABLE IF NOT EXISTS Dipendenti (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Nome TEXT NOT NULL,
        Cognome TEXT NOT NULL,
        Matricola TEXT UNIQUE NOT NULL,
        Ruolo TEXT NOT NULL,
        DataAssunzione TEXT NOT NULL,
        Email TEXT UNIQUE NOT NULL,
        Telefono TEXT,
        Reparto TEXT,
        Attivo INTEGER DEFAULT 1
      );
    `);

    // Tabella Presenze
    db.run(`
      CREATE TABLE IF NOT EXISTS Presenze (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Dipendente INTEGER NOT NULL,
        Data TEXT NOT NULL,
        OraEntrata TEXT,
        OraUscita TEXT,
        Tipologia TEXT DEFAULT 'Presenza',
        Note TEXT,
        Stato TEXT DEFAULT 'Approvata',
        FOREIGN KEY (ID_Dipendente) REFERENCES Dipendenti(ID)
      );
    `);

    // Tabella Turni
    db.run(`
      CREATE TABLE IF NOT EXISTS Turni (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Dipendente INTEGER NOT NULL,
        Data TEXT NOT NULL,
        OraInizio TEXT NOT NULL,
        OraFine TEXT NOT NULL,
        TipoTurno TEXT DEFAULT 'Standard',
        Note TEXT,
        FOREIGN KEY (ID_Dipendente) REFERENCES Dipendenti(ID)
      );
    `);

    // Tabella Utenti
    db.run(`
      CREATE TABLE IF NOT EXISTS Utenti (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Dipendente INTEGER,
        Username TEXT UNIQUE NOT NULL,
        Password TEXT NOT NULL,
        LivelloAccesso TEXT NOT NULL,
        UltimoAccesso TEXT,
        FOREIGN KEY (ID_Dipendente) REFERENCES Dipendenti(ID)
      );
    `);

    // Tabella Richieste
    db.run(`
      CREATE TABLE IF NOT EXISTS Richieste (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Dipendente INTEGER NOT NULL,
        TipoRichiesta TEXT NOT NULL,
        DataInizio TEXT NOT NULL,
        DataFine TEXT NOT NULL,
        Motivo TEXT,
        Stato TEXT DEFAULT 'In attesa',
        DataRichiesta TEXT NOT NULL,
        FOREIGN KEY (ID_Dipendente) REFERENCES Dipendenti(ID)
      );
    `);

    // Creazione utente admin di default
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
                  `✅ Default admin user created with ID: ${this.lastID}`,
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

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username e password sono richiesti" });
  }

  db.get(
    `
    SELECT u.*, d.Nome, d.Cognome, d.Matricola, d.Ruolo as RuoloDipendente
    FROM Utenti u
    LEFT JOIN Dipendenti d ON u.ID_Dipendente = d.ID
    WHERE u.Username = ?
  `,
    [username],
    (err, user) => {
      if (err) return res.status(500).json({ error: "Errore del server" });
      if (!user)
        return res.status(401).json({ error: "Credenziali non valide" });

      bcrypt.compare(password, user.Password, (err, result) => {
        if (err) return res.status(500).json({ error: "Errore del server" });
        if (result) {
          // Aggiorna ultimo accesso
          db.run("UPDATE Utenti SET UltimoAccesso = ? WHERE ID = ?", [
            new Date().toISOString(),
            user.ID,
          ]);

          res.json({
            success: true,
            user: {
              id: user.ID,
              username: user.Username,
              ruolo: user.LivelloAccesso,
              nome: user.Nome,
              cognome: user.Cognome,
              matricola: user.Matricola,
              ruoloDipendente: user.RuoloDipendente,
            },
          });
        } else {
          res.status(401).json({ error: "Credenziali non valide" });
        }
      });
    },
  );
});

// Gestione utenti (Admin)
app.post("/api/users", (req, res) => {
  const { username, password, ruolo, idDipendente } = req.body;

  if (!username || !password || !ruolo) {
    return res.status(400).json({ error: "Tutti i campi sono richiesti" });
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Errore nella cifratura della password" });

    db.run(
      `INSERT INTO Utenti (Username, Password, LivelloAccesso, ID_Dipendente) VALUES (?, ?, ?, ?)`,
      [username, hash, ruolo, idDipendente || null],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(400).json({ error: "Username già esistente" });
          }
          return res
            .status(500)
            .json({ error: "Errore nella creazione dell'utente" });
        }
        res.status(201).json({
          message: "Utente creato con successo",
          userId: this.lastID,
        });
      },
    );
  });
});

app.get("/api/users", (req, res) => {
  db.all(
    `
    SELECT u.ID, u.Username, u.LivelloAccesso, u.UltimoAccesso,
           d.Nome, d.Cognome, d.Matricola
    FROM Utenti u
    LEFT JOIN Dipendenti d ON u.ID_Dipendente = d.ID
    ORDER BY u.ID DESC
  `,
    [],
    (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella lettura degli utenti" });
      res.json(rows);
    },
  );
});

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, ruolo, idDipendente, password } = req.body;

  let query = `UPDATE Utenti SET Username = ?, LivelloAccesso = ?, ID_Dipendente = ?`;
  let params = [username, ruolo, idDipendente || null];

  if (password) {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella cifratura della password" });

      query += `, Password = ?`;
      params.push(hash);
      params.push(id);

      db.run(query, params, function (err) {
        if (err)
          return res
            .status(500)
            .json({ error: "Errore nell'aggiornamento dell'utente" });
        if (this.changes === 0) {
          return res.status(404).json({ error: "Utente non trovato" });
        }
        res.json({ message: "Utente aggiornato con successo" });
      });
    });
  } else {
    params.push(id);
    db.run(query, params, function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nell'aggiornamento dell'utente" });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
      res.json({ message: "Utente aggiornato con successo" });
    });
  }
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Utenti WHERE ID = ?", [id], function (err) {
    if (err)
      return res
        .status(500)
        .json({ error: "Errore nella cancellazione dell'utente" });
    if (this.changes === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    res.json({ message: "Utente cancellato con successo" });
  });
});

// Gestione dipendenti
app.post("/api/dipendenti", (req, res) => {
  const {
    nome,
    cognome,
    matricola,
    ruolo,
    dataAssunzione,
    email,
    telefono,
    reparto,
  } = req.body;

  if (!nome || !cognome || !matricola || !ruolo || !dataAssunzione || !email) {
    return res
      .status(400)
      .json({ error: "Tutti i campi obbligatori sono richiesti" });
  }

  db.run(
    `
    INSERT INTO Dipendenti (Nome, Cognome, Matricola, Ruolo, DataAssunzione, Email, Telefono, Reparto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      nome,
      cognome,
      matricola,
      ruolo,
      dataAssunzione,
      email,
      telefono || null,
      reparto || null,
    ],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res
            .status(400)
            .json({ error: "Matricola o email già esistente" });
        }
        return res
          .status(500)
          .json({ error: "Errore nella creazione del dipendente" });
      }
      res.status(201).json({
        message: "Dipendente creato con successo",
        dipendenteId: this.lastID,
      });
    },
  );
});

app.get("/api/dipendenti", (req, res) => {
  db.all(
    `
    SELECT ID, Nome, Cognome, Matricola, Ruolo, DataAssunzione, Email, Telefono, Reparto, Attivo
    FROM Dipendenti
    ORDER BY Nome, Cognome
  `,
    [],
    (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella lettura dei dipendenti" });
      res.json(rows);
    },
  );
});

app.put("/api/dipendenti/:id", (req, res) => {
  const { id } = req.params;
  const {
    nome,
    cognome,
    matricola,
    ruolo,
    dataAssunzione,
    email,
    telefono,
    reparto,
    attivo,
  } = req.body;

  db.run(
    `
    UPDATE Dipendenti 
    SET Nome = ?, Cognome = ?, Matricola = ?, Ruolo = ?, DataAssunzione = ?, 
        Email = ?, Telefono = ?, Reparto = ?, Attivo = ?
    WHERE ID = ?
  `,
    [
      nome,
      cognome,
      matricola,
      ruolo,
      dataAssunzione,
      email,
      telefono || null,
      reparto || null,
      attivo,
      id,
    ],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nell'aggiornamento del dipendente" });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Dipendente non trovato" });
      }
      res.json({ message: "Dipendente aggiornato con successo" });
    },
  );
});

app.delete("/api/dipendenti/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Dipendenti WHERE ID = ?", [id], function (err) {
    if (err)
      return res
        .status(500)
        .json({ error: "Errore nella cancellazione del dipendente" });
    if (this.changes === 0) {
      return res.status(404).json({ error: "Dipendente non trovato" });
    }
    res.json({ message: "Dipendente cancellato con successo" });
  });
});

// Gestione presenze
app.post("/api/presenze/entrata", (req, res) => {
  const { id_dipendente } = req.body;
  const data = new Date().toISOString().split("T")[0];
  const oraEntrata = new Date().toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Verifica se esiste già una presenza per oggi
  db.get(
    "SELECT ID FROM Presenze WHERE ID_Dipendente = ? AND Data = ? AND Tipologia = 'Presenza'",
    [id_dipendente, data],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Errore del server" });
      if (row)
        return res
          .status(400)
          .json({ error: "Presenza già registrata per oggi" });

      db.run(
        `INSERT INTO Presenze (ID_Dipendente, Data, OraEntrata, Tipologia) VALUES (?, ?, ?, 'Presenza')`,
        [id_dipendente, data, oraEntrata],
        function (err) {
          if (err)
            return res
              .status(500)
              .json({ error: "Errore nella registrazione dell'entrata" });
          res.status(201).json({
            message: "Entrata registrata con successo",
            presenzaId: this.lastID,
            oraEntrata,
          });
        },
      );
    },
  );
});

app.post("/api/presenze/uscita", (req, res) => {
  const { id_dipendente } = req.body;
  const oraUscita = new Date().toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  db.run(
    `UPDATE Presenze SET OraUscita = ? WHERE ID_Dipendente = ? AND Data = ? AND OraUscita IS NULL AND Tipologia = 'Presenza'`,
    [oraUscita, id_dipendente, new Date().toISOString().split("T")[0]],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella registrazione dell'uscita" });
      if (this.changes === 0) {
        return res
          .status(400)
          .json({ error: "Nessuna entrata registrata per oggi" });
      }
      res.json({
        message: "Uscita registrata con successo",
        oraUscita,
      });
    },
  );
});

app.get("/api/presenze/oggi", (req, res) => {
  const data = new Date().toISOString().split("T")[0];
  db.all(
    `
    SELECT d.Nome, d.Cognome, d.Matricola, p.OraEntrata, p.OraUscita, p.Tipologia
    FROM Presenze p
    JOIN Dipendenti d ON p.ID_Dipendente = d.ID
    WHERE p.Data = ?
    ORDER BY p.OraEntrata DESC
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

app.get("/api/presenze/dipendente/:id", (req, res) => {
  const { id } = req.params;
  const { mese, anno } = req.query;

  let query = `
    SELECT Data, OraEntrata, OraUscita, Tipologia, Note
    FROM Presenze
    WHERE ID_Dipendente = ?
  `;
  let params = [id];

  if (mese && anno) {
    query += ` AND Data LIKE '${anno}-${mese.padStart(2, "0")}-%'`;
  }

  query += ` ORDER BY Data DESC, OraEntrata DESC`;

  db.all(query, params, (err, rows) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Errore nella lettura delle presenze" });
    res.json(rows);
  });
});

// Gestione richieste
app.post("/api/richieste", (req, res) => {
  const { id_dipendente, tipoRichiesta, dataInizio, dataFine, motivo } =
    req.body;
  const dataRichiesta = new Date().toISOString().split("T")[0];

  if (!id_dipendente || !tipoRichiesta || !dataInizio || !dataFine) {
    return res
      .status(400)
      .json({ error: "Tutti i campi obbligatori sono richiesti" });
  }

  db.run(
    `
    INSERT INTO Richieste (ID_Dipendente, TipoRichiesta, DataInizio, DataFine, Motivo, DataRichiesta)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      id_dipendente,
      tipoRichiesta,
      dataInizio,
      dataFine,
      motivo || null,
      dataRichiesta,
    ],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nell'invio della richiesta" });
      res.status(201).json({
        message: "Richiesta inviata con successo",
        richiestaId: this.lastID,
      });
    },
  );
});

app.get("/api/richieste", (req, res) => {
  const { stato } = req.query;

  let query = `
    SELECT r.*, d.Nome, d.Cognome, d.Matricola
    FROM Richieste r
    JOIN Dipendenti d ON r.ID_Dipendente = d.ID
  `;
  let params = [];

  if (stato) {
    query += ` WHERE r.Stato = ?`;
    params.push(stato);
  }

  query += ` ORDER BY r.DataRichiesta DESC`;

  db.all(query, params, (err, rows) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Errore nella lettura delle richieste" });
    res.json(rows);
  });
});

app.put("/api/richieste/:id", (req, res) => {
  const { id } = req.params;
  const { stato } = req.body;

  db.run(
    `UPDATE Richieste SET Stato = ? WHERE ID = ?`,
    [stato, id],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nell'aggiornamento della richiesta" });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Richiesta non trovata" });
      }
      res.json({ message: "Stato richiesta aggiornato con successo" });
    },
  );
});

// Gestione turni
app.post("/api/turni", (req, res) => {
  const { id_dipendente, data, oraInizio, oraFine, tipoTurno, note } = req.body;

  if (!id_dipendente || !data || !oraInizio || !oraFine) {
    return res
      .status(400)
      .json({ error: "Tutti i campi obbligatori sono richiesti" });
  }

  db.run(
    `
    INSERT INTO Turni (ID_Dipendente, Data, OraInizio, OraFine, TipoTurno, Note)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      id_dipendente,
      data,
      oraInizio,
      oraFine,
      tipoTurno || "Standard",
      note || null,
    ],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella creazione del turno" });
      res.status(201).json({
        message: "Turno creato con successo",
        turnoId: this.lastID,
      });
    },
  );
});

app.get("/api/turni", (req, res) => {
  const { data, id_dipendente } = req.query;

  let query = `
    SELECT t.*, d.Nome, d.Cognome, d.Matricola
    FROM Turni t
    JOIN Dipendenti d ON t.ID_Dipendente = d.ID
  `;
  let params = [];

  if (data) {
    query += ` WHERE t.Data = ?`;
    params.push(data);
  } else if (id_dipendente) {
    query += ` WHERE t.ID_Dipendente = ?`;
    params.push(id_dipendente);
  }

  query += ` ORDER BY t.Data DESC, t.OraInizio`;

  db.all(query, params, (err, rows) => {
    if (err)
      return res.status(500).json({ error: "Errore nella lettura dei turni" });
    res.json(rows);
  });
});

// Statistiche
app.get("/api/presenze/statistiche", (req, res) => {
  const { mese, anno } = req.query;
  const dataInizio =
    mese && anno
      ? `${anno}-${mese.padStart(2, "0")}-01`
      : new Date().toISOString().split("T")[0].substring(0, 7) + "-01";
  const dataFine =
    mese && anno
      ? `${anno}-${mese.padStart(2, "0")}-31`
      : new Date().toISOString().split("T")[0];

  db.all(
    `
    SELECT 
      d.ID,
      d.Nome, 
      d.Cognome, 
      d.Matricola,
      COUNT(CASE WHEN p.Tipologia = 'Presenza' THEN 1 END) as giorni_presenza,
      COUNT(CASE WHEN p.Tipologia != 'Presenza' THEN 1 END) as giorni_assenza,
      AVG(CASE WHEN p.OraEntrata IS NOT NULL AND p.OraUscita IS NOT NULL 
           THEN (julianday(p.OraUscita) - julianday(p.OraEntrata)) * 24 END) as media_ore_giorno
    FROM Dipendenti d
    LEFT JOIN Presenze p ON d.ID = p.ID_Dipendente 
      AND p.Data >= ? AND p.Data <= ?
    WHERE d.Attivo = 1
    GROUP BY d.ID
    ORDER BY d.Nome, d.Cognome
  `,
    [dataInizio, dataFine],
    (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Errore nella lettura delle statistiche" });
      res.json(rows);
    },
  );
});

app.get("/api/dashboard/stats", (req, res) => {
  const oggi = new Date().toISOString().split("T")[0];

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM Presenze WHERE Data = ? AND Tipologia = 'Presenza'",
        [oggi],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        },
      );
    }),
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM Dipendenti WHERE Attivo = 1",
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        },
      );
    }),
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM Richieste WHERE Stato = 'In attesa'",
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        },
      );
    }),
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM Presenze WHERE Data = ? AND Tipologia = 'Presenza' AND OraUscita IS NULL",
        [oggi],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        },
      );
    }),
  ])
    .then(
      ([presenzeOggi, totaleDipendenti, richiesteInAttesa, ancoraPresenti]) => {
        res.json({
          presenzeOggi,
          totaleDipendenti,
          richiesteInAttesa,
          ancoraPresenti,
        });
      },
    )
    .catch((err) => {
      res.status(500).json({ error: "Errore nel calcolo delle statistiche" });
    });
});

app.post("/api/dipendenti", (req, res) => {
  const {
    nome,
    cognome,
    matricola,
    ruolo,
    dataAssunzione,
    email,
    telefono,
    reparto,
  } = req.body;

  if (!nome || !cognome || !matricola || !ruolo || !dataAssunzione || !email) {
    return res
      .status(400)
      .json({ error: "Tutti i campi obbligatori sono richiesti" });
  }

  db.run(
    `
        INSERT INTO Dipendenti (Nome, Cognome, Matricola, Ruolo, DataAssunzione, Email, Telefono, Reparto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      nome,
      cognome,
      matricola,
      ruolo,
      dataAssunzione,
      email,
      telefono || null,
      reparto || null,
    ],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res
            .status(400)
            .json({ error: "Matricola o email già esistente" });
        }
        return res
          .status(500)
          .json({ error: "Errore nella creazione del dipendente" });
      }

      const dipendenteId = this.lastID;
      const username = matricola; // O un'altra logica, ad esempio "nome.cognome"
      const passwordIniziale = "Password123"; // Password temporanea

      bcrypt.hash(passwordIniziale, saltRounds, (err, hash) => {
        if (err) {
          return res
            .status(500)
            .json({
              error:
                "Errore nella cifratura della password per il nuovo utente",
            });
        }

        db.run(
          `INSERT INTO Utenti (ID_Dipendente, Username, Password, LivelloAccesso) VALUES (?, ?, ?, ?)`,
          [dipendenteId, username, hash, "Employee"], // Ruolo di default "Employee"
          function (err) {
            if (err) {
              console.error(
                "Errore nella creazione dell'utente associato:",
                err.message,
              );
              // Potresti voler gestire l'errore per pulire il dipendente appena creato
              return res
                .status(500)
                .json({
                  error:
                    "Dipendente creato, ma errore nella creazione dell'utente associato.",
                });
            }
            res.status(201).json({
              message: "Dipendente e utente creati con successo",
              dipendenteId: dipendenteId,
              userId: this.lastID,
            });
          },
        );
      });
    },
  );
});

// Avvio server
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/frontend/index.html`);
  console.log(`🔐 Login: http://localhost:${PORT}/frontend/login.html`);
  console.log(`👤 Admin: username: admin, password: Admin123`);
});
