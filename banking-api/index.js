const express = require("express");
const crypto = require("crypto");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(express.json());

// --- Configuration Swagger ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NYAJ - Banking API",
      version: "1.0.0",
      description: "API simple de gestion de comptes bancaires (dépôt, retrait, historique). © NYAJ",
    },
    components: {
      schemas: {
        Compte: {
          type: "object",
          properties: {
            id: { type: "string", example: "f0a1b2c3-d4e5-6789-abcd-ef0123456789" },
            nom: { type: "string", example: "Dupont" },
            prenom: { type: "string", example: "Jean" },
            solde: { type: "string", example: "10000.00 FCFA" },
            dateCreation: { type: "string", example: "19 avril 2026 à 10:30" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string" },
            compteId: { type: "string" },
            type: { type: "string", enum: ["depot", "retrait"] },
            montant: { type: "string", example: "5000.00 FCFA" },
            date: { type: "string" },
          },
        },
        Reponse: {
          type: "object",
          properties: {
            succes: { type: "boolean" },
            message: { type: "string" },
            donnees: { type: "object" },
          },
        },
      },
    },
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Stockage en memoire ---
const comptes = [];
const transactions = [];

// --- Formatage ---
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
    solde: formaterMontant(compte.solde),
    dateCreation: formaterDate(compte.dateCreation),
  };
}

function formaterTransaction(transaction) {
  return {
    id: transaction.id,
    compteId: transaction.compteId,
    type: transaction.type,
    montant: formaterMontant(transaction.montant),
    date: formaterDate(transaction.date),
  };
}

function reponse(res, status, message, donnees) {
  return res.status(status).json({
    succes: status >= 200 && status < 300,
    message,
    donnees,
  });
}

// --- ROUTES ---

/**
 * @openapi
 * /:
 *   get:
 *     summary: Page d'accueil de l'API
 *     tags: [Général]
 *     responses:
 *       200:
 *         description: Informations sur l'API
 */
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API Bancaire",
    documentation: "/api-docs",
  });
});

/**
 * @openapi
 * /api/comptes:
 *   post:
 *     summary: Créer un nouveau compte bancaire
 *     tags: [Comptes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prenom]
 *             properties:
 *               nom: { type: string, example: "Dupont" }
 *               prenom: { type: string, example: "Jean" }
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

  comptes.push(compte);
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
  reponse(res, 200, `${comptes.length} compte(s) trouvé(s).`, comptes.map(formaterCompte));
});

/**
 * @openapi
 * /api/comptes/{id}:
 *   get:
 *     summary: Consulter un compte par son ID
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
  const compte = comptes.find((c) => c.id === req.params.id);
  if (!compte) {
    return reponse(res, 404, "Compte introuvable.", null);
  }
  reponse(res, 200, "Compte trouvé.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes/{id}/depot:
 *   post:
 *     summary: Effectuer un dépôt sur un compte
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
 *               montant: { type: number, example: 5000 }
 *     responses:
 *       200:
 *         description: Dépôt effectué
 *       400:
 *         description: Montant invalide
 *       404:
 *         description: Compte introuvable
 */
app.post("/api/comptes/:id/depot", (req, res) => {
  const compte = comptes.find((c) => c.id === req.params.id);
  if (!compte) {
    return reponse(res, 404, "Compte introuvable.", null);
  }

  const { montant } = req.body;
  if (!montant || typeof montant !== "number" || montant <= 0) {
    return reponse(res, 400, "Le montant doit être un nombre positif.", null);
  }

  compte.solde += montant;

  const transaction = {
    id: crypto.randomUUID(),
    compteId: compte.id,
    type: "depot",
    montant,
    date: new Date().toISOString(),
  };
  transactions.push(transaction);

  reponse(res, 200, `Dépôt de ${formaterMontant(montant)} effectué.`, formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes/{id}/retrait:
 *   post:
 *     summary: Effectuer un retrait sur un compte
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
 *               montant: { type: number, example: 2000 }
 *     responses:
 *       200:
 *         description: Retrait effectué
 *       400:
 *         description: Montant invalide ou solde insuffisant
 *       404:
 *         description: Compte introuvable
 */
app.post("/api/comptes/:id/retrait", (req, res) => {
  const compte = comptes.find((c) => c.id === req.params.id);
  if (!compte) {
    return reponse(res, 404, "Compte introuvable.", null);
  }

  const { montant } = req.body;
  if (!montant || typeof montant !== "number" || montant <= 0) {
    return reponse(res, 400, "Le montant doit être un nombre positif.", null);
  }

  if (montant > compte.solde) {
    return reponse(res, 400, "Solde insuffisant.", null);
  }

  compte.solde -= montant;

  const transaction = {
    id: crypto.randomUUID(),
    compteId: compte.id,
    type: "retrait",
    montant,
    date: new Date().toISOString(),
  };
  transactions.push(transaction);

  reponse(res, 200, `Retrait de ${formaterMontant(montant)} effectué.`, formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes/{id}/transactions:
 *   get:
 *     summary: Récupérer l'historique des transactions d'un compte
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Historique des transactions
 *       404:
 *         description: Compte introuvable
 */
app.get("/api/comptes/:id/transactions", (req, res) => {
  const compte = comptes.find((c) => c.id === req.params.id);
  if (!compte) {
    return reponse(res, 404, "Compte introuvable.", null);
  }

  const historique = transactions.filter((t) => t.compteId === compte.id);
  reponse(res, 200, `${historique.length} transaction(s) trouvée(s).`, historique.map(formaterTransaction));
});

// --- Demarrage ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API bancaire demarree sur le port ${PORT}`);
  console.log(`Documentation Swagger : /api-docs`);
});
