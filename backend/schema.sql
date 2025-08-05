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

CREATE TABLE IF NOT EXISTS Presenze (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Dipendente INTEGER,
  Data TEXT,
  OraEntrata TEXT,
  OraUscita TEXT,
  Tipologia TEXT,
  Note TEXT
);

CREATE TABLE IF NOT EXISTS Turni (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Dipendente INTEGER,
  Data TEXT,
  OraInizio TEXT,
  OraFine TEXT,
  TipoTurno TEXT
);

CREATE TABLE IF NOT EXISTS Utenti (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Dipendente INTEGER,
  Username TEXT,
  Password TEXT,
  LivelloAccesso TEXT
);
