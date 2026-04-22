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
      description: `
API REST simple pour la gestion de comptes bancaires.

## Fonctionnalités
- Création et consultation de comptes
- Dépôts et retraits
- Historique des transactions
- Validation stricte des entrées (defensive testing)

## Règles métier
- Le solde initial d'un compte est de 0 FCFA
- Tout montant doit être un nombre strictement positif
- Un retrait ne peut pas rendre le solde négatif (BNF04)
- Les IDs sont des UUID v4 générés côté serveur

## Format des réponses
Toutes les réponses suivent le schéma \`Reponse\` : \`{ succes, message, donnees }\`.

© NYAJ - Cours ICT304 (Software Testing & Quality Assurance)
      `,
      contact: {
        name: "Équipe NYAJ",
        email: "ngayendea@gmail.com",
      },
      license: {
        name: "Académique - ICT4D",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur de développement local",
      },
    ],
    tags: [
      { name: "Général", description: "Informations générales sur l'API" },
      { name: "Comptes", description: "Gestion des comptes bancaires" },
      { name: "Transactions", description: "Dépôts, retraits et historique" },
    ],
    components: {
      schemas: {
        Compte: {
          type: "object",
          required: ["id", "nom", "prenom", "solde", "dateCreation"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Identifiant unique du compte (UUID v4)",
              example: "f0a1b2c3-d4e5-6789-abcd-ef0123456789",
            },
            nom: { type: "string", example: "Dupont" },
            prenom: { type: "string", example: "Jean" },
            solde: {
              type: "string",
              description: "Solde formaté en FCFA (2 décimales)",
              example: "10000.00 FCFA",
            },
            dateCreation: {
              type: "string",
              description: "Date de création formatée (locale fr-FR)",
              example: "19 avril 2026 à 10:30",
            },
          },
        },
        Transaction: {
          type: "object",
          required: ["id", "compteId", "type", "montant", "date"],
          properties: {
            id: { type: "string", format: "uuid", example: "a1b2c3d4-e5f6-7890-abcd-1234567890ef" },
            compteId: { type: "string", format: "uuid", example: "f0a1b2c3-d4e5-6789-abcd-ef0123456789" },
            type: { type: "string", enum: ["depot", "retrait"], example: "depot" },
            montant: { type: "string", example: "5000.00 FCFA" },
            date: { type: "string", example: "19 avril 2026 à 10:35" },
          },
        },
        Reponse: {
          type: "object",
          required: ["succes", "message"],
          properties: {
            succes: { type: "boolean", example: true },
            message: { type: "string", example: "Opération effectuée avec succès." },
            donnees: {
              description: "Charge utile de la réponse (objet, tableau ou null)",
              nullable: true,
            },
          },
        },
        Erreur: {
          type: "object",
          properties: {
            erreur: { type: "string", example: "Les champs 'nom' et 'prenom' sont requis." },
          },
        },
        CreerCompteRequete: {
          type: "object",
          required: ["nom", "prenom"],
          properties: {
            nom: { type: "string", example: "Dupont", minLength: 1 },
            prenom: { type: "string", example: "Jean", minLength: 1 },
          },
        },
        MontantRequete: {
          type: "object",
          required: ["montant"],
          properties: {
            montant: {
              type: "number",
              format: "double",
              minimum: 0.01,
              example: 5000,
              description: "Montant positif strictement supérieur à 0",
            },
          },
        },
      },
      responses: {
        CompteIntrouvable: {
          description: "Compte introuvable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Reponse" },
              example: { succes: false, message: "Compte introuvable.", donnees: null },
            },
          },
        },
        MontantInvalide: {
          description: "Montant invalide (non numérique, nul ou négatif)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Reponse" },
              example: { succes: false, message: "Le montant doit être un nombre positif.", donnees: null },
            },
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
 *     description: Retourne un message de bienvenue et l'URL de la documentation Swagger.
 *     tags: [Général]
 *     responses:
 *       200:
 *         description: Informations sur l'API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Bienvenue sur l'API Bancaire" }
 *                 documentation: { type: string, example: "/api-docs" }
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
 *     description: |
 *       Crée un compte bancaire avec un solde initial de 0 FCFA.
 *       Un UUID v4 est généré automatiquement côté serveur.
 *       **Validation** : les champs `nom` et `prenom` sont requis et non vides (BNF02).
 *     tags: [Comptes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreerCompteRequete'
 *           examples:
 *             valide:
 *               summary: Requête valide
 *               value: { nom: "Dupont", prenom: "Jean" }
 *             manquant:
 *               summary: Champ manquant
 *               value: { nom: "Dupont" }
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees: { $ref: '#/components/schemas/Compte' }
 *             example:
 *               succes: true
 *               message: "Compte créé avec succès."
 *               donnees:
 *                 id: "f0a1b2c3-d4e5-6789-abcd-ef0123456789"
 *                 nom: "Dupont"
 *                 prenom: "Jean"
 *                 solde: "0.00 FCFA"
 *                 dateCreation: "19 avril 2026 à 10:30"
 *       400:
 *         description: Champs `nom` ou `prenom` manquants/vides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erreur' }
 *             example:
 *               erreur: "Les champs 'nom' et 'prenom' sont requis."
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
 *     description: Retourne la liste complète des comptes enregistrés en mémoire.
 *     tags: [Comptes]
 *     responses:
 *       200:
 *         description: Liste des comptes (peut être vide)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Compte' }
 *             example:
 *               succes: true
 *               message: "2 compte(s) trouvé(s)."
 *               donnees:
 *                 - id: "f0a1b2c3-d4e5-6789-abcd-ef0123456789"
 *                   nom: "Dupont"
 *                   prenom: "Jean"
 *                   solde: "10000.00 FCFA"
 *                   dateCreation: "19 avril 2026 à 10:30"
 *                 - id: "1a2b3c4d-5e6f-7890-abcd-ef0987654321"
 *                   nom: "Martin"
 *                   prenom: "Alice"
 *                   solde: "0.00 FCFA"
 *                   dateCreation: "19 avril 2026 à 11:00"
 */
app.get("/api/comptes", (req, res) => {
  reponse(res, 200, `${comptes.length} compte(s) trouvé(s).`, comptes.map(formaterCompte));
});

/**
 * @openapi
 * /api/comptes/{id}:
 *   get:
 *     summary: Consulter un compte par son ID
 *     description: Retourne le détail d'un compte identifié par son UUID.
 *     tags: [Comptes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID v4 du compte
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "f0a1b2c3-d4e5-6789-abcd-ef0123456789"
 *     responses:
 *       200:
 *         description: Compte trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees: { $ref: '#/components/schemas/Compte' }
 *             example:
 *               succes: true
 *               message: "Compte trouvé."
 *               donnees:
 *                 id: "f0a1b2c3-d4e5-6789-abcd-ef0123456789"
 *                 nom: "Dupont"
 *                 prenom: "Jean"
 *                 solde: "10000.00 FCFA"
 *                 dateCreation: "19 avril 2026 à 10:30"
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
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
 *     description: |
 *       Ajoute un montant au solde du compte et enregistre la transaction.
 *       **Règles** :
 *       - Le montant doit être un nombre (`typeof === "number"`) strictement positif.
 *       - Le compte doit exister.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID v4 du compte
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MontantRequete'
 *           examples:
 *             valide:
 *               summary: Dépôt valide
 *               value: { montant: 5000 }
 *             invalide_negatif:
 *               summary: Montant négatif
 *               value: { montant: -100 }
 *             invalide_chaine:
 *               summary: Montant en chaîne
 *               value: { montant: "5000" }
 *     responses:
 *       200:
 *         description: Dépôt effectué, solde mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees: { $ref: '#/components/schemas/Compte' }
 *             example:
 *               succes: true
 *               message: "Dépôt de 5000.00 FCFA effectué."
 *               donnees:
 *                 id: "f0a1b2c3-d4e5-6789-abcd-ef0123456789"
 *                 nom: "Dupont"
 *                 prenom: "Jean"
 *                 solde: "5000.00 FCFA"
 *                 dateCreation: "19 avril 2026 à 10:30"
 *       400:
 *         $ref: '#/components/responses/MontantInvalide'
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
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
 *     description: |
 *       Soustrait un montant du solde et enregistre la transaction.
 *       **Règles** :
 *       - Le montant doit être un nombre strictement positif.
 *       - Le solde doit être suffisant (le retrait ne peut pas rendre le solde négatif — BNF04).
 *       - Le compte doit exister.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID v4 du compte
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MontantRequete'
 *           examples:
 *             valide:
 *               summary: Retrait valide
 *               value: { montant: 2000 }
 *             solde_insuffisant:
 *               summary: Dépasse le solde
 *               value: { montant: 999999 }
 *     responses:
 *       200:
 *         description: Retrait effectué, solde mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees: { $ref: '#/components/schemas/Compte' }
 *             example:
 *               succes: true
 *               message: "Retrait de 2000.00 FCFA effectué."
 *               donnees:
 *                 id: "f0a1b2c3-d4e5-6789-abcd-ef0123456789"
 *                 nom: "Dupont"
 *                 prenom: "Jean"
 *                 solde: "3000.00 FCFA"
 *                 dateCreation: "19 avril 2026 à 10:30"
 *       400:
 *         description: Montant invalide OU solde insuffisant
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Reponse' }
 *             examples:
 *               montant_invalide:
 *                 value: { succes: false, message: "Le montant doit être un nombre positif.", donnees: null }
 *               solde_insuffisant:
 *                 value: { succes: false, message: "Solde insuffisant.", donnees: null }
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
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
 *     description: |
 *       Retourne toutes les transactions (dépôts et retraits) associées au compte,
 *       dans l'ordre chronologique d'enregistrement.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID v4 du compte
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Historique des transactions (peut être vide)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Transaction' }
 *             example:
 *               succes: true
 *               message: "2 transaction(s) trouvée(s)."
 *               donnees:
 *                 - id: "a1b2c3d4-e5f6-7890-abcd-1234567890ef"
 *                   compteId: "f0a1b2c3-d4e5-6789-abcd-ef0123456789"
 *                   type: "depot"
 *                   montant: "5000.00 FCFA"
 *                   date: "19 avril 2026 à 10:35"
 *                 - id: "b2c3d4e5-f6a7-8901-bcde-234567890abc"
 *                   compteId: "f0a1b2c3-d4e5-6789-abcd-ef0123456789"
 *                   type: "retrait"
 *                   montant: "2000.00 FCFA"
 *                   date: "19 avril 2026 à 11:00"
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
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
