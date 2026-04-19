# Cahier des Charges - API Bancaire

## 1. Contexte et objectifs

Conception d'une API REST pour un systeme de transactions bancaires permettant
aux clients de gerer leurs comptes, effectuer des depots et des retraits.

---

## 2. Besoins

### 2.1 Besoins fonctionnels

| ID   | Besoin                                | Priorite |
|------|---------------------------------------|----------|
| BF01 | Creer un compte bancaire              | Haute    |
| BF02 | Consulter la liste des comptes        | Haute    |
| BF03 | Consulter un compte par ID            | Haute    |
| BF04 | Effectuer un depot sur un compte      | Haute    |
| BF05 | Effectuer un retrait sur un compte    | Haute    |
| BF06 | Consulter l'historique des transactions | Moyenne |

### 2.2 Besoins non fonctionnels

| ID    | Besoin                                          | Priorite |
|-------|-------------------------------------------------|----------|
| BNF01 | Temps de reponse < 500ms par requete            | Haute    |
| BNF02 | Validation des donnees en entree                | Haute    |
| BNF03 | Gestion des erreurs avec codes HTTP appropries  | Haute    |
| BNF04 | Un retrait ne peut pas rendre le solde negatif  | Haute    |
| BNF05 | API documentee (endpoints clairs et coherents)  | Moyenne  |
| BNF06 | Architecture extensible (ajout futur d'auth, BDD) | Moyenne |

---

## 3. Acteurs

| Acteur           | Description                                              |
|------------------|----------------------------------------------------------|
| Client           | Utilisateur qui cree un compte, depose et retire de l'argent |
| Systeme (API)    | Traite les requetes, valide les donnees, gere les soldes |
| Administrateur   | (Futur) Supervise les comptes et transactions            |

---

## 4. Cas d'utilisation

### CU01 - Creer un compte
- **Acteur** : Client
- **Pre-condition** : Aucune
- **Scenario principal** :
  1. Le client envoie une requete POST /api/comptes avec son nom et prenom
  2. Le systeme valide les donnees
  3. Le systeme cree le compte avec un solde initial de 0
  4. Le systeme retourne le compte cree avec son ID unique
- **Scenario alternatif** : Donnees manquantes -> erreur 400

### CU02 - Lister les comptes
- **Acteur** : Client
- **Pre-condition** : Aucune
- **Scenario principal** :
  1. Le client envoie une requete GET /api/comptes
  2. Le systeme retourne la liste de tous les comptes

### CU03 - Consulter un compte
- **Acteur** : Client
- **Pre-condition** : Le compte existe
- **Scenario principal** :
  1. Le client envoie une requete GET /api/comptes/:id
  2. Le systeme retourne les details du compte
- **Scenario alternatif** : Compte introuvable -> erreur 404

### CU04 - Effectuer un depot
- **Acteur** : Client
- **Pre-condition** : Le compte existe, montant > 0
- **Scenario principal** :
  1. Le client envoie POST /api/comptes/:id/depot avec le montant
  2. Le systeme valide le montant
  3. Le systeme ajoute le montant au solde
  4. Le systeme enregistre la transaction et retourne le compte mis a jour
- **Scenario alternatif** : Montant invalide -> erreur 400

### CU05 - Effectuer un retrait
- **Acteur** : Client
- **Pre-condition** : Le compte existe, montant > 0, solde suffisant
- **Scenario principal** :
  1. Le client envoie POST /api/comptes/:id/retrait avec le montant
  2. Le systeme verifie que le solde est suffisant
  3. Le systeme soustrait le montant du solde
  4. Le systeme enregistre la transaction et retourne le compte mis a jour
- **Scenarios alternatifs** :
  - Montant invalide -> erreur 400
  - Solde insuffisant -> erreur 400

### CU06 - Consulter l'historique des transactions
- **Acteur** : Client
- **Pre-condition** : Le compte existe
- **Scenario principal** :
  1. Le client envoie GET /api/comptes/:id/transactions
  2. Le systeme retourne la liste des transactions du compte

---

## 5. Endpoints de l'API

| Methode | Endpoint                        | Description                  |
|---------|---------------------------------|------------------------------|
| POST    | /api/comptes                    | Creer un compte              |
| GET     | /api/comptes                    | Lister tous les comptes      |
| GET     | /api/comptes/:id                | Consulter un compte          |
| POST    | /api/comptes/:id/depot          | Effectuer un depot           |
| POST    | /api/comptes/:id/retrait        | Effectuer un retrait         |
| GET     | /api/comptes/:id/transactions   | Historique des transactions  |

---

## 6. Modeles de donnees

### Compte
```json
{
  "id": "uuid",
  "nom": "string",
  "prenom": "string",
  "solde": "number",
  "dateCreation": "ISO 8601"
}
```

### Transaction
```json
{
  "id": "uuid",
  "compteId": "uuid",
  "type": "depot | retrait",
  "montant": "number",
  "date": "ISO 8601"
}
```

---

## 7. Stack technique

- **Runtime** : Node.js
- **Framework** : Express.js
- **Stockage** : En memoire (evolutif vers une BDD)
- **Format** : JSON
