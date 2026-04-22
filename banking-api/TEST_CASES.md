# Document de Cas de Tests — NYAJ Banking API

**Projet :** API Bancaire (NYAJ)
**Cours :** ICT304 - Software Testing and Quality Assurance
**Template utilisé :** Test Case Format (Template 1) — ICT304

---

## Légende

- **Test Case ID** : Identifiant unique du cas de test
- **Test Case Description** : Description de l'objectif du test
- **Test Input (Test Case Value)** : Données d'entrée utilisées
- **Expected Results** : Résultat attendu (code HTTP + message/données)
- **Test Case Status** : État du test (Not Executed / Pass / Fail)

Les tests suivent le principe du **Defensive Testing** : couverture des conditions normales (entrées valides) et anormales (entrées invalides).

---

## 1. Module : Général

| Test Case ID | Test Case Description | Test Input (Test Case Value) | Expected Results | Test Case Status |
|--------------|-----------------------|------------------------------|------------------|------------------|
| TC-001 | Vérifier la page d'accueil de l'API | `GET /` | HTTP 200 + `{message: "Bienvenue sur l'API Bancaire", documentation: "/api-docs"}` | Not Executed |
| TC-002 | Vérifier l'accès à la documentation Swagger | `GET /api-docs` | HTTP 200 + page Swagger UI chargée | Not Executed |

---

## 2. Module : Création de compte (`POST /api/comptes`)

| Test Case ID | Test Case Description | Test Input (Test Case Value) | Expected Results | Test Case Status |
|--------------|-----------------------|------------------------------|------------------|------------------|
| TC-003 | Créer un compte avec nom et prénom valides | `{nom: "Dupont", prenom: "Jean"}` | HTTP 201 + `succes: true` + compte avec id (UUID), solde "0.00 FCFA", dateCreation formatée | Not Executed |
| TC-004 | Créer un compte sans le champ `nom` | `{prenom: "Jean"}` | HTTP 400 + `{erreur: "Les champs 'nom' et 'prenom' sont requis."}` | Not Executed |
| TC-005 | Créer un compte sans le champ `prenom` | `{nom: "Dupont"}` | HTTP 400 + erreur de champs manquants | Not Executed |
| TC-006 | Créer un compte avec corps vide | `{}` | HTTP 400 + erreur de champs manquants | Not Executed |
| TC-007 | Créer un compte avec `nom` vide (chaîne vide) | `{nom: "", prenom: "Jean"}` | HTTP 400 + erreur (falsy check `!nom`) | Not Executed |
| TC-008 | Créer un compte avec `prenom` vide | `{nom: "Dupont", prenom: ""}` | HTTP 400 + erreur | Not Executed |
| TC-009 | Créer deux comptes distincts (IDs uniques) | Deux requêtes successives valides | Deux comptes avec des UUID différents | Not Executed |
| TC-010 | Créer un compte sans Content-Type JSON | Requête sans header `Content-Type: application/json` | HTTP 400 (req.body undefined) | Not Executed |

---

## 3. Module : Lister les comptes (`GET /api/comptes`)

| Test Case ID | Test Case Description | Test Input (Test Case Value) | Expected Results | Test Case Status |
|--------------|-----------------------|------------------------------|------------------|------------------|
| TC-011 | Lister les comptes quand aucun compte n'existe | `GET /api/comptes` (état initial) | HTTP 200 + `message: "0 compte(s) trouvé(s)."` + `donnees: []` | Not Executed |
| TC-012 | Lister les comptes après création de 3 comptes | `GET /api/comptes` | HTTP 200 + `message: "3 compte(s) trouvé(s)."` + tableau de 3 objets | Not Executed |
| TC-013 | Vérifier le formatage du solde dans la liste | `GET /api/comptes` | Chaque compte affiche `solde: "X.XX FCFA"` | Not Executed |

---

## 4. Module : Consulter un compte (`GET /api/comptes/:id`)

| Test Case ID | Test Case Description | Test Input (Test Case Value) | Expected Results | Test Case Status |
|--------------|-----------------------|------------------------------|------------------|------------------|
| TC-014 | Consulter un compte existant avec ID valide | `GET /api/comptes/<UUID-existant>` | HTTP 200 + `message: "Compte trouvé."` + données du compte | Not Executed |
| TC-015 | Consulter un compte avec ID inexistant | `GET /api/comptes/00000000-0000-0000-0000-000000000000` | HTTP 404 + `message: "Compte introuvable."` + `donnees: null` | Not Executed |
| TC-016 | Consulter un compte avec ID malformé | `GET /api/comptes/abc` | HTTP 404 + `message: "Compte introuvable."` | Not Executed |
| TC-017 | Consulter un compte avec ID vide | `GET /api/comptes/` | HTTP 200 (route liste) — pas le même endpoint | Not Executed |

---

## 5. Module : Dépôt (`POST /api/comptes/:id/depot`)

| Test Case ID | Test Case Description | Test Input (Test Case Value) | Expected Results | Test Case Status |
|--------------|-----------------------|------------------------------|------------------|------------------|
| TC-018 | Effectuer un dépôt valide sur un compte existant | id valide + `{montant: 5000}` | HTTP 200 + `message: "Dépôt de 5000.00 FCFA effectué."` + solde mis à jour | Not Executed |
| TC-019 | Dépôt sur un compte inexistant | id inexistant + `{montant: 5000}` | HTTP 404 + `message: "Compte introuvable."` | Not Executed |
| TC-020 | Dépôt avec montant négatif | id valide + `{montant: -100}` | HTTP 400 + `message: "Le montant doit être un nombre positif."` | Not Executed |
| TC-021 | Dépôt avec montant égal à zéro | id valide + `{montant: 0}` | HTTP 400 + erreur de montant | Not Executed |
| TC-022 | Dépôt avec montant en chaîne de caractères | id valide + `{montant: "5000"}` | HTTP 400 + erreur (typeof !== "number") | Not Executed |
| TC-023 | Dépôt sans champ `montant` | id valide + `{}` | HTTP 400 + erreur de montant | Not Executed |
| TC-024 | Dépôt avec montant `null` | id valide + `{montant: null}` | HTTP 400 + erreur | Not Executed |
| TC-025 | Dépôts successifs — cumul du solde | 1000 puis 2000 sur même compte | Solde final = 3000.00 FCFA | Not Executed |
| TC-026 | Dépôt très grand (test limite) | id valide + `{montant: 1000000000}` | HTTP 200 + solde correctement mis à jour | Not Executed |
| TC-027 | Dépôt avec montant décimal | id valide + `{montant: 1234.56}` | HTTP 200 + `solde: "1234.56 FCFA"` | Not Executed |

---

## 6. Module : Retrait (`POST /api/comptes/:id/retrait`)

| Test Case ID | Test Case Description | Test Input (Test Case Value) | Expected Results | Test Case Status |
|--------------|-----------------------|------------------------------|------------------|------------------|
| TC-028 | Retrait valide (solde suffisant) | solde=10000, `{montant: 3000}` | HTTP 200 + `message: "Retrait de 3000.00 FCFA effectué."` + solde = 7000.00 FCFA | Not Executed |
| TC-029 | Retrait sur compte inexistant | id inexistant + `{montant: 1000}` | HTTP 404 + `message: "Compte introuvable."` | Not Executed |
| TC-030 | Retrait avec solde insuffisant | solde=1000, `{montant: 5000}` | HTTP 400 + `message: "Solde insuffisant."` | Not Executed |
| TC-031 | Retrait avec montant exactement égal au solde (limite) | solde=5000, `{montant: 5000}` | HTTP 200 + solde = 0.00 FCFA | Not Executed |
| TC-032 | Retrait avec montant négatif | id valide + `{montant: -500}` | HTTP 400 + erreur de montant positif | Not Executed |
| TC-033 | Retrait avec montant nul | id valide + `{montant: 0}` | HTTP 400 + erreur | Not Executed |
| TC-034 | Retrait sans champ `montant` | id valide + `{}` | HTTP 400 + erreur | Not Executed |
| TC-035 | Retrait avec montant non numérique | id valide + `{montant: "abc"}` | HTTP 400 + erreur | Not Executed |
| TC-036 | Retraits successifs jusqu'à épuisement du solde | solde=1000, 2 retraits de 500 | Solde final = 0.00 FCFA | Not Executed |
| TC-037 | Retrait sur un compte jamais alimenté (solde=0) | solde=0, `{montant: 100}` | HTTP 400 + `message: "Solde insuffisant."` | Not Executed |

---

## 7. Module : Historique des transactions (`GET /api/comptes/:id/transactions`)

| Test Case ID | Test Case Description | Test Input (Test Case Value) | Expected Results | Test Case Status |
|--------------|-----------------------|------------------------------|------------------|------------------|
| TC-038 | Historique d'un compte sans transaction | compte nouvellement créé | HTTP 200 + `message: "0 transaction(s) trouvée(s)."` + `donnees: []` | Not Executed |
| TC-039 | Historique après un dépôt | 1 dépôt de 5000 | HTTP 200 + 1 transaction de type "depot" | Not Executed |
| TC-040 | Historique mixte (dépôt + retrait) | 1 dépôt + 1 retrait | HTTP 200 + 2 transactions dans l'ordre chronologique | Not Executed |
| TC-041 | Historique d'un compte inexistant | id inexistant | HTTP 404 + `message: "Compte introuvable."` | Not Executed |
| TC-042 | Isolation des historiques entre 2 comptes | Compte A avec transactions, Compte B vide | Historique de B reste vide malgré les transactions de A | Not Executed |
| TC-043 | Vérifier le formatage du montant et de la date | transaction existante | `montant: "X.XX FCFA"` et `date: "19 avril 2026 à 10:30"` | Not Executed |

---

## 8. Tests de scénarios bout-en-bout (Intégration)

| Test Case ID | Test Case Description | Test Input (Test Case Value) | Expected Results | Test Case Status |
|--------------|-----------------------|------------------------------|------------------|------------------|
| TC-044 | Scénario complet : création → dépôt → retrait → historique | Séquence complète sur un même compte | Tous les appels réussissent, solde cohérent, historique contient les 2 opérations | Not Executed |
| TC-045 | Création de plusieurs comptes simultanément | 5 requêtes POST parallèles | 5 comptes créés avec IDs uniques | Not Executed |
| TC-046 | Transactions concurrentes sur le même compte | 2 dépôts parallèles de 1000 | Solde final = 2000.00 FCFA (test de cohérence) | Not Executed |

---

## Synthèse des types d'erreurs couverts

- **Erreurs syntaxiques** : champs manquants, types incorrects
- **Erreurs logiques** : solde insuffisant, montants négatifs/nuls
- **Erreurs sémantiques** : ID inexistant, ID malformé
- **Tests de limites** : montant = solde, solde = 0, montants très grands
- **Tests de cohérence** : cumul de solde, isolation entre comptes

**Nombre total de cas de tests : 46**

---

## Traçabilité (Requirement Traceability Matrix)

| Exigence | Cas de tests associés |
|----------|------------------------|
| Créer un compte bancaire | TC-003 à TC-010 |
| Consulter les comptes | TC-011 à TC-017 |
| Effectuer un dépôt | TC-018 à TC-027 |
| Effectuer un retrait | TC-028 à TC-037 |
| Consulter l'historique | TC-038 à TC-043 |
| Documentation API | TC-001, TC-002 |
| Scénarios bout-en-bout | TC-044 à TC-046 |
