/**
 * SOUS-CATEGORIE : integration/transactions
 * Tests d'intégration des opérations bancaires (dépôt, retrait, virement)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const BASE = "http://localhost:3000/api";

// -------------------------------------------------------------------
// Dépôt
// -------------------------------------------------------------------
describe("Dépôt — cas nominaux", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("retourne le nouveau solde après dépôt réussi", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        succes: true,
        message: "Dépôt de 5000.00 FCFA effectué.",
        donnees: { id: "uuid-1", solde: "5000.00 FCFA", soldeRaw: 5000 },
      }),
      status: 200,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/depot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: 5000 }),
    });
    const data = await res.json();

    expect(data.succes).toBe(true);
    expect(data.donnees.solde).toBe("5000.00 FCFA");
    expect(data.message).toContain("5000.00 FCFA");
  });

  it("cumule plusieurs dépôts successifs", async () => {
    let solde = 0;
    global.fetch = vi.fn().mockImplementation(async (_, opts) => {
      const body = JSON.parse(opts.body);
      solde += body.montant;
      return {
        json: () => Promise.resolve({
          succes: true,
          donnees: { soldeRaw: solde, solde: `${solde.toFixed(2)} FCFA` },
        }),
        status: 200,
      };
    });

    for (const montant of [1000, 2000, 3000]) {
      await fetch(`${BASE}/comptes/uuid-1/depot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant }),
      });
    }

    expect(solde).toBe(6000);
  });
});

describe("Dépôt — cas d'erreur", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("refuse un montant nul", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Le montant doit être un nombre positif." }),
      status: 400,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/depot`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: 0 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
    expect(data.message).toMatch(/positif/i);
  });

  it("refuse un montant négatif", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Le montant doit être un nombre positif." }),
      status: 400,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/depot`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: -500 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
  });

  it("refuse un montant sous forme de chaîne", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Le montant doit être un nombre positif." }),
      status: 400,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/depot`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: "5000" }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
  });
});

// -------------------------------------------------------------------
// Retrait
// -------------------------------------------------------------------
describe("Retrait — cas nominaux", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("soustrait le montant du solde", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        succes: true,
        message: "Retrait de 2000.00 FCFA effectué.",
        donnees: { solde: "3000.00 FCFA", soldeRaw: 3000 },
      }),
      status: 200,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/retrait`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: 2000 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(true);
    expect(data.donnees.soldeRaw).toBe(3000);
  });
});

describe("Retrait — cas d'erreur (BNF04)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("refuse un retrait dépassant le solde (BNF04)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Solde insuffisant." }),
      status: 400,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/retrait`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: 999999 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
    expect(data.message).toBe("Solde insuffisant.");
  });

  it("refuse un retrait égal au solde insuffisant", async () => {
    // Solde = 1000, retrait demandé = 1500
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Solde insuffisant." }),
      status: 400,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/retrait`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: 1500 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
  });
});

// -------------------------------------------------------------------
// Virement
// -------------------------------------------------------------------
describe("Virement — cas nominaux", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("débite la source et crédite le destinataire", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        succes: true,
        message: "Virement de 3000.00 FCFA effectué.",
        donnees: {
          source:       { id: "src",  solde: "2000.00 FCFA", soldeRaw: 2000 },
          destinataire: { id: "dest", solde: "8000.00 FCFA", soldeRaw: 8000 },
        },
      }),
      status: 200,
    });

    const res = await fetch(`${BASE}/comptes/src/virement`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: "dest", montant: 3000 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(true);
    expect(data.donnees.source.soldeRaw).toBe(2000);
    expect(data.donnees.destinataire.soldeRaw).toBe(8000);
  });
});

describe("Virement — cas d'erreur", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("refuse un virement vers soi-même", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Impossible de faire un virement vers son propre compte." }),
      status: 400,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/virement`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: "uuid-1", montant: 500 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
    expect(data.message).toMatch(/propre compte/i);
  });

  it("refuse si compte destinataire inexistant", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Compte destinataire introuvable." }),
      status: 404,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/virement`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: "inexistant", montant: 500 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
  });

  it("refuse si solde insuffisant pour le virement", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Solde insuffisant." }),
      status: 400,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/virement`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: "uuid-2", montant: 1000000 }),
    });
    const data = await res.json();
    expect(data.succes).toBe(false);
    expect(data.message).toBe("Solde insuffisant.");
  });
});

// -------------------------------------------------------------------
// Historique des transactions
// -------------------------------------------------------------------
describe("Historique transactions", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("retourne les transactions dans l'ordre chronologique décroissant", async () => {
    const transactions = [
      { id: "t3", type: "retrait", montant: "500.00 FCFA", date: "12 juin 2026 à 15:00" },
      { id: "t2", type: "depot",   montant: "2000.00 FCFA", date: "12 juin 2026 à 12:00" },
      { id: "t1", type: "depot",   montant: "5000.00 FCFA", date: "12 juin 2026 à 10:00" },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: true, donnees: transactions }),
      status: 200,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/transactions`);
    const data = await res.json();
    expect(data.donnees[0].id).toBe("t3"); // la plus récente en premier
    expect(data.donnees).toHaveLength(3);
  });

  it("retourne une liste vide si aucune transaction", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: true, donnees: [] }),
      status: 200,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/transactions`);
    const data = await res.json();
    expect(data.donnees).toEqual([]);
  });

  it("inclut les virements dans l'historique", async () => {
    const transactions = [
      { id: "t1", type: "virement_envoi",     montant: "1000.00 FCFA", description: "Loyer" },
      { id: "t2", type: "virement_reception", montant: "500.00 FCFA",  description: "Remboursement" },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: true, donnees: transactions }),
      status: 200,
    });

    const res = await fetch(`${BASE}/comptes/uuid-1/transactions`);
    const data = await res.json();
    const types = data.donnees.map((t) => t.type);
    expect(types).toContain("virement_envoi");
    expect(types).toContain("virement_reception");
  });
});
