const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "banking.db"));

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS comptes (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE,
    pin TEXT,
    solde REAL NOT NULL DEFAULT 0,
    dateCreation TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    compteId TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('depot', 'retrait', 'virement_envoi', 'virement_reception')),
    montant REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    FOREIGN KEY (compteId) REFERENCES comptes(id) ON DELETE CASCADE
  );
`);

// Migration: ajouter colonnes si elles n'existent pas encore
// SQLite ne supporte pas UNIQUE dans ALTER TABLE → on crée un index séparé
const colonnesComptes = db.prepare("PRAGMA table_info(comptes)").all().map((c) => c.name);

if (!colonnesComptes.includes("email")) {
  db.exec(`ALTER TABLE comptes ADD COLUMN email TEXT`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_comptes_email ON comptes(email)`);
}
if (!colonnesComptes.includes("pin")) {
  db.exec(`ALTER TABLE comptes ADD COLUMN pin TEXT`);
}

// Migration transactions: recréer la table si le CHECK est trop restrictif
{
  const colonnesTransactions = db.prepare("PRAGMA table_info(transactions)").all().map((c) => c.name);
  if (!colonnesTransactions.includes("description")) {
    db.exec(`ALTER TABLE transactions ADD COLUMN description TEXT`);
  }

  // Vérifier si le CHECK autorise les virements (SQLite stocke le SQL de création)
  const tableSQL = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'"
  ).get()?.sql || "";

  if (!tableSQL.includes("virement_envoi")) {
    // Recréer la table avec le bon CHECK (rename → create → copy → drop)
    db.exec(`
      ALTER TABLE transactions RENAME TO transactions_old;

      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        compteId TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('depot','retrait','virement_envoi','virement_reception')),
        montant REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        FOREIGN KEY (compteId) REFERENCES comptes(id) ON DELETE CASCADE
      );

      INSERT INTO transactions (id, compteId, type, montant, description, date)
      SELECT id, compteId, type, montant, description, date FROM transactions_old;

      DROP TABLE transactions_old;
    `);
  }
}

// --- Comptes ---

function createAccount(id, nom, prenom, solde, dateCreation, email = null, pin = null) {
  db.prepare(
    "INSERT INTO comptes (id, nom, prenom, solde, dateCreation, email, pin) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, nom, prenom, solde, dateCreation, email, pin);
}

function getAllAccounts() {
  return db.prepare("SELECT * FROM comptes").all();
}

function getAccountById(id) {
  return db.prepare("SELECT * FROM comptes WHERE id = ?").get(id);
}

function getAccountByEmail(email) {
  return db.prepare("SELECT * FROM comptes WHERE email = ?").get(email);
}

function updateBalance(id, nouveauSolde) {
  db.prepare("UPDATE comptes SET solde = ? WHERE id = ?").run(nouveauSolde, id);
}

function deleteAccount(id) {
  db.prepare("DELETE FROM comptes WHERE id = ?").run(id);
}

// --- Transactions ---

function createTransaction(id, compteId, type, montant, date, description = null) {
  db.prepare(
    "INSERT INTO transactions (id, compteId, type, montant, date, description) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, compteId, type, montant, date, description);
}

function getTransactionsByAccount(compteId) {
  return db.prepare("SELECT * FROM transactions WHERE compteId = ? ORDER BY date DESC").all(compteId);
}

function countTransactionsByAccount(compteId) {
  return db.prepare("SELECT COUNT(*) as count FROM transactions WHERE compteId = ?").get(compteId).count;
}

module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  getAccountByEmail,
  updateBalance,
  deleteAccount,
  createTransaction,
  getTransactionsByAccount,
  countTransactionsByAccount,
};
