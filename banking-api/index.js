const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const db = require("./db");

const app = express();

// CORS : autorise localhost (dev), le domaine Render, et CORS_ORIGIN si défini
const ALLOWED_ORIGINS = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/.*\.onrender\.com$/,
];
if (process.env.CORS_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin(origin, cb) {
    // Requêtes same-origin (pas d'en-tête Origin) → autorisé
    if (!origin) return cb(null, true);
    const ok = ALLOWED_ORIGINS.some((o) =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    cb(null, ok);
  },
}));
app.use(express.json());

// --- Configuration Swagger ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NYAJ - Banking API",
      version: "2.0.0",
      description: `
API REST pour la gestion de comptes bancaires avec authentification.

## Fonctionnalités
- Inscription / Connexion (email + PIN 4 chiffres)
- Création et consultation de comptes
- Dépôts, retraits et virements
- Historique des transactions

## Règles métier
- Le solde initial d'un compte est de 0 FCFA
- Tout montant doit être un nombre strictement positif
- Un retrait/virement ne peut pas rendre le solde négatif
- Les IDs sont des UUID v4 générés côté serveur

© NYAJ - Cours ICT304 (Software Testing & Quality Assurance)
      `,
      contact: { name: "Équipe NYAJ", email: "ngayendea@gmail.com" },
      license: { name: "Académique - ICT4D" },
    },
    servers: [{ url: "http://localhost:3000", description: "Serveur local" }],
    tags: [
      { name: "Auth", description: "Inscription et connexion" },
      { name: "Comptes", description: "Gestion des comptes bancaires" },
      { name: "Transactions", description: "Dépôts, retraits, virements" },
    ],
    components: {
      schemas: {
        Compte: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            nom: { type: "string", example: "Dupont" },
            prenom: { type: "string", example: "Jean" },
            email: { type: "string", example: "jean.dupont@mail.com" },
            solde: { type: "string", example: "10000.00 FCFA" },
            dateCreation: { type: "string", example: "19 avril 2026 à 10:30" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            compteId: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["depot", "retrait", "virement_envoi", "virement_reception"] },
            montant: { type: "string", example: "5000.00 FCFA" },
            description: { type: "string", example: "Virement vers Jean Dupont" },
            date: { type: "string", example: "19 avril 2026 à 10:35" },
          },
        },
        Reponse: {
          type: "object",
          properties: {
            succes: { type: "boolean" },
            message: { type: "string" },
            donnees: { nullable: true },
          },
        },
      },
    },
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Utilitaires ---
function formaterMontant(montant) {
  return `${montant.toFixed(2)} FCFA`;
}

function formaterDate(dateISO) {
  return new Date(dateISO).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formaterCompte(compte) {
  return {
    id: compte.id,
    nom: compte.nom,
    prenom: compte.prenom,
    email: compte.email || null,
    solde: formaterMontant(compte.solde),
    soldeRaw: compte.solde,
    dateCreation: formaterDate(compte.dateCreation),
  };
}

function formaterTransaction(transaction) {
  return {
    id: transaction.id,
    compteId: transaction.compteId,
    type: transaction.type,
    montant: formaterMontant(transaction.montant),
    montantRaw: transaction.montant,
    description: transaction.description || null,
    date: formaterDate(transaction.date),
  };
}

function reponse(res, status, message, donnees) {
  return res.status(status).json({ succes: status >= 200 && status < 300, message, donnees });
}

function hashPin(pin) {
  return crypto.createHash("sha256").update(pin + "nyaj_salt_2024").digest("hex");
}

// --- ROUTES ---

app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API Bancaire NYAJ v2", documentation: "/api-docs" });
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Créer un compte avec email et PIN
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prenom, email, pin]
 *             properties:
 *               nom: { type: string }
 *               prenom: { type: string }
 *               email: { type: string, format: email }
 *               pin: { type: string, minLength: 4, maxLength: 4, description: "PIN à 4 chiffres" }
 *     responses:
 *       201:
 *         description: Compte créé
 *       400:
 *         description: Données invalides ou email déjà utilisé
 */
app.post("/api/auth/register", (req, res) => {
  const { nom, prenom, email, pin } = req.body;

  if (!nom?.trim() || !prenom?.trim()) {
    return reponse(res, 400, "Le nom et le prénom sont requis.", null);
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reponse(res, 400, "Un email valide est requis.", null);
  }
  if (!pin || !/^\d{4}$/.test(String(pin))) {
    return reponse(res, 400, "Le PIN doit être composé de 4 chiffres.", null);
  }

  const existing = db.getAccountByEmail(email.toLowerCase());
  if (existing) {
    return reponse(res, 400, "Cet email est déjà associé à un compte.", null);
  }

  const compte = {
    id: crypto.randomUUID(),
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: email.toLowerCase().trim(),
    pin: hashPin(String(pin)),
    solde: 0,
    dateCreation: new Date().toISOString(),
  };

  db.createAccount(compte.id, compte.nom, compte.prenom, compte.solde, compte.dateCreation, compte.email, compte.pin);
  reponse(res, 201, "Compte créé avec succès.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Se connecter avec email et PIN
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, pin]
 *             properties:
 *               email: { type: string }
 *               pin: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Email ou PIN incorrect
 */
app.post("/api/auth/login", (req, res) => {
  const { email, pin } = req.body;

  if (!email || !pin) {
    return reponse(res, 400, "Email et PIN requis.", null);
  }

  const compte = db.getAccountByEmail(email.toLowerCase().trim());
  if (!compte) {
    return reponse(res, 401, "Email ou PIN incorrect.", null);
  }

  if (compte.pin !== hashPin(String(pin))) {
    return reponse(res, 401, "Email ou PIN incorrect.", null);
  }

  reponse(res, 200, "Connexion réussie.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes:
 *   post:
 *     summary: Créer un compte (sans auth — rétrocompatibilité)
 *     tags: [Comptes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prenom]
 *             properties:
 *               nom: { type: string }
 *               prenom: { type: string }
 *     responses:
 *       201:
 *         description: Compte créé
 *       400:
 *         description: Champs manquants
 */
app.post("/api/comptes", (req, res) => {
  const { nom, prenom } = req.body;
  if (!nom || !prenom) {
    return res.status(400).json({ erreur: "Les champs 'nom' et 'prenom' sont requis." });
  }
  const compte = {
    id: crypto.randomUUID(),
    nom,
    prenom,
    solde: 0,
    dateCreation: new Date().toISOString(),
  };
  db.createAccount(compte.id, compte.nom, compte.prenom, compte.solde, compte.dateCreation);
  reponse(res, 201, "Compte créé avec succès.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes:
 *   get:
 *     summary: Lister tous les comptes
 *     tags: [Comptes]
 *     responses:
 *       200:
 *         description: Liste des comptes
 */
app.get("/api/comptes", (req, res) => {
  const comptes = db.getAllAccounts();
  reponse(res, 200, `${comptes.length} compte(s) trouvé(s).`, comptes.map(formaterCompte));
});

/**
 * @openapi
 * /api/comptes/{id}:
 *   get:
 *     summary: Consulter un compte par ID
 *     tags: [Comptes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Compte trouvé
 *       404:
 *         description: Compte introuvable
 */
app.get("/api/comptes/:id", (req, res) => {
  const compte = db.getAccountById(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);
  reponse(res, 200, "Compte trouvé.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes/{id}/depot:
 *   post:
 *     summary: Effectuer un dépôt
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [montant]
 *             properties:
 *               montant: { type: number }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Dépôt effectué
 *       400:
 *         description: Montant invalide
 *       404:
 *         description: Compte introuvable
 */
app.post("/api/comptes/:id/depot", (req, res) => {
  const compte = db.getAccountById(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);

  const { montant, description } = req.body;
  if (!montant || typeof montant !== "number" || montant <= 0) {
    return reponse(res, 400, "Le montant doit être un nombre positif.", null);
  }

  const nouveauSolde = compte.solde + montant;
  db.updateBalance(compte.id, nouveauSolde);
  db.createTransaction(crypto.randomUUID(), compte.id, "depot", montant, new Date().toISOString(), description || null);

  reponse(res, 200, `Dépôt de ${formaterMontant(montant)} effectué.`, formaterCompte({ ...compte, solde: nouveauSolde }));
});

/**
 * @openapi
 * /api/comptes/{id}/retrait:
 *   post:
 *     summary: Effectuer un retrait
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [montant]
 *             properties:
 *               montant: { type: number }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Retrait effectué
 *       400:
 *         description: Montant invalide ou solde insuffisant
 *       404:
 *         description: Compte introuvable
 */
app.post("/api/comptes/:id/retrait", (req, res) => {
  const compte = db.getAccountById(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);

  const { montant, description } = req.body;
  if (!montant || typeof montant !== "number" || montant <= 0) {
    return reponse(res, 400, "Le montant doit être un nombre positif.", null);
  }
  if (montant > compte.solde) {
    return reponse(res, 400, "Solde insuffisant.", null);
  }

  const nouveauSolde = compte.solde - montant;
  db.updateBalance(compte.id, nouveauSolde);
  db.createTransaction(crypto.randomUUID(), compte.id, "retrait", montant, new Date().toISOString(), description || null);

  reponse(res, 200, `Retrait de ${formaterMontant(montant)} effectué.`, formaterCompte({ ...compte, solde: nouveauSolde }));
});

/**
 * @openapi
 * /api/comptes/{id}/virement:
 *   post:
 *     summary: Effectuer un virement vers un autre compte
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destinataireId, montant]
 *             properties:
 *               destinataireId: { type: string }
 *               montant: { type: number }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Virement effectué
 *       400:
 *         description: Montant invalide, solde insuffisant ou virement vers soi-même
 *       404:
 *         description: Compte source ou destinataire introuvable
 */
app.post("/api/comptes/:id/virement", (req, res) => {
  const source = db.getAccountById(req.params.id);
  if (!source) return reponse(res, 404, "Compte source introuvable.", null);

  const { destinataireId, montant, description } = req.body;

  if (destinataireId === req.params.id) {
    return reponse(res, 400, "Impossible de faire un virement vers son propre compte.", null);
  }

  const destinataire = db.getAccountById(destinataireId);
  if (!destinataire) return reponse(res, 404, "Compte destinataire introuvable.", null);

  if (!montant || typeof montant !== "number" || montant <= 0) {
    return reponse(res, 400, "Le montant doit être un nombre positif.", null);
  }
  if (montant > source.solde) {
    return reponse(res, 400, "Solde insuffisant.", null);
  }

  const now = new Date().toISOString();
  const descEnvoi = description || `Virement vers ${destinataire.prenom} ${destinataire.nom}`;
  const descReception = description || `Virement de ${source.prenom} ${source.nom}`;

  db.updateBalance(source.id, source.solde - montant);
  db.updateBalance(destinataire.id, destinataire.solde + montant);
  db.createTransaction(crypto.randomUUID(), source.id, "virement_envoi", montant, now, descEnvoi);
  db.createTransaction(crypto.randomUUID(), destinataire.id, "virement_reception", montant, now, descReception);

  reponse(res, 200, `Virement de ${formaterMontant(montant)} effectué vers ${destinataire.prenom} ${destinataire.nom}.`, {
    source: formaterCompte({ ...source, solde: source.solde - montant }),
    destinataire: formaterCompte({ ...destinataire, solde: destinataire.solde + montant }),
  });
});

/**
 * @openapi
 * /api/comptes/{id}/transactions:
 *   get:
 *     summary: Historique des transactions
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des transactions
 *       404:
 *         description: Compte introuvable
 */
app.get("/api/comptes/:id/transactions", (req, res) => {
  const compte = db.getAccountById(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);

  const historique = db.getTransactionsByAccount(compte.id);
  reponse(res, 200, `${historique.length} transaction(s) trouvée(s).`, historique.map(formaterTransaction));
});

/**
 * @openapi
 * /api/comptes/{id}:
 *   delete:
 *     summary: Supprimer un compte
 *     tags: [Comptes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Compte supprimé
 *       404:
 *         description: Compte introuvable
 */
app.delete("/api/comptes/:id", (req, res) => {
  const compte = db.getAccountById(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);

  const transactionsSupprimees = db.countTransactionsByAccount(compte.id);
  db.deleteAccount(compte.id);

  reponse(res, 200, "Compte supprimé avec succès.", {
    compteSupprime: compte.id,
    transactionsSupprimees,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API bancaire NYAJ v2 démarrée sur le port ${PORT}`);
  console.log(`Documentation : http://localhost:${PORT}/api-docs`);
});
