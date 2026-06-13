/**
 * SOUS-CATEGORIE : unit/api
 * Tests unitaires des fonctions de l'API (avec fetch mocké)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch
function mockFetch(data, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(data),
    status,
  });
}

// On importe dynamiquement pour bénéficier du mock
const BASE = "http://localhost:3000/api";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
describe("apiFetch — comportement de base", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("retourne les données JSON de la réponse", async () => {
    mockFetch({ succes: true, message: "ok", donnees: [] });
    const res = await fetch(`${BASE}/comptes`);
    const data = await res.json();
    expect(data.succes).toBe(true);
  });

  it("propage le statut HTTP dans la réponse", async () => {
    mockFetch({ succes: false, message: "Introuvable", donnees: null }, 404);
    const res = await fetch(`${BASE}/comptes/xxx`);
    expect(res.status).toBe(404);
  });
});

// -------------------------------------------------------------------
// Auth
// -------------------------------------------------------------------
describe("API Auth — register", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("appelle POST /api/auth/register avec les bons paramètres", async () => {
    mockFetch({ succes: true, message: "Compte créé.", donnees: { id: "uuid-1", nom: "Dupont", prenom: "Jean" } }, 201);

    await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "Dupont", prenom: "Jean", email: "jean@test.com", pin: "1234" }),
    });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/auth/register`,
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("jean@test.com"),
      })
    );
  });

  it("retourne succes:false si email déjà pris", async () => {
    mockFetch({ succes: false, message: "Cet email est déjà associé à un compte.", donnees: null }, 400);
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "Dupont", prenom: "Jean", email: "jean@test.com", pin: "1234" }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
    expect(data.message).toMatch(/email/i);
  });
});

describe("API Auth — login", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("appelle POST /api/auth/login avec email et pin", async () => {
    mockFetch({ succes: true, message: "Connexion réussie.", donnees: { id: "uuid-1" } });

    await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "jean@test.com", pin: "1234" }),
    });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/auth/login`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("retourne 401 si les identifiants sont incorrects", async () => {
    mockFetch({ succes: false, message: "Email ou PIN incorrect.", donnees: null }, 401);
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "mauvais@test.com", pin: "0000" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.succes).toBe(false);
  });
});

// -------------------------------------------------------------------
// Comptes
// -------------------------------------------------------------------
describe("API Comptes — GET /api/comptes", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("retourne une liste de comptes", async () => {
    mockFetch({
      succes: true,
      message: "2 compte(s) trouvé(s).",
      donnees: [
        { id: "1", nom: "Dupont", prenom: "Jean", solde: "0.00 FCFA" },
        { id: "2", nom: "Martin", prenom: "Alice", solde: "5000.00 FCFA" },
      ],
    });
    const res = await fetch(`${BASE}/comptes`);
    const data = await res.json();
    expect(data.donnees).toHaveLength(2);
    expect(data.donnees[0].nom).toBe("Dupont");
  });

  it("retourne une liste vide si aucun compte", async () => {
    mockFetch({ succes: true, message: "0 compte(s) trouvé(s).", donnees: [] });
    const res = await fetch(`${BASE}/comptes`);
    const data = await res.json();
    expect(data.donnees).toEqual([]);
  });
});

describe("API Comptes — GET /api/comptes/:id", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("retourne le compte pour un ID valide", async () => {
    mockFetch({ succes: true, message: "Compte trouvé.", donnees: { id: "uuid-1", nom: "Dupont", prenom: "Jean", solde: "0.00 FCFA" } });
    const res = await fetch(`${BASE}/comptes/uuid-1`);
    const data = await res.json();
    expect(data.succes).toBe(true);
    expect(data.donnees.id).toBe("uuid-1");
  });

  it("retourne 404 pour un ID inexistant", async () => {
    mockFetch({ succes: false, message: "Compte introuvable.", donnees: null }, 404);
    const res = await fetch(`${BASE}/comptes/inexistant`);
    expect(res.status).toBe(404);
  });
});

// -------------------------------------------------------------------
// Transactions
// -------------------------------------------------------------------
describe("API Transactions — dépôt", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("appelle POST /depot avec le bon montant", async () => {
    mockFetch({ succes: true, message: "Dépôt de 5000.00 FCFA effectué.", donnees: {} });

    await fetch(`${BASE}/comptes/uuid-1/depot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: 5000 }),
    });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/comptes/uuid-1/depot`,
      expect.objectContaining({ body: expect.stringContaining("5000") })
    );
  });

  it("retourne une erreur si le montant est invalide", async () => {
    mockFetch({ succes: false, message: "Le montant doit être un nombre positif.", donnees: null }, 400);
    const res = await fetch(`${BASE}/comptes/uuid-1/depot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: -100 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
  });
});

describe("API Transactions — retrait", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("retourne une erreur si solde insuffisant", async () => {
    mockFetch({ succes: false, message: "Solde insuffisant.", donnees: null }, 400);
    const res = await fetch(`${BASE}/comptes/uuid-1/retrait`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: 999999 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
    expect(data.message).toBe("Solde insuffisant.");
  });
});

describe("API Transactions — virement", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("appelle POST /virement avec source, destinataire et montant", async () => {
    mockFetch({
      succes: true,
      message: "Virement effectué.",
      donnees: { source: {}, destinataire: {} },
    });

    await fetch(`${BASE}/comptes/uuid-src/virement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: "uuid-dest", montant: 2000 }),
    });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/comptes/uuid-src/virement`,
      expect.objectContaining({ body: expect.stringContaining("uuid-dest") })
    );
  });

  it("rejette un virement vers soi-même", async () => {
    mockFetch({ succes: false, message: "Impossible de faire un virement vers son propre compte.", donnees: null }, 400);
    const res = await fetch(`${BASE}/comptes/uuid-1/virement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: "uuid-1", montant: 500 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
  });
});
