/**
 * SOUS-CATEGORIE : unit/utils
 * Tests unitaires des fonctions utilitaires (validation, formatage)
 */

import { describe, it, expect } from "vitest";

// --- Fonctions utilitaires à tester ---

function validerEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validerPin(pin) {
  return /^\d{4}$/.test(String(pin));
}

function validerMontant(val) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return typeof n === "number" && !isNaN(n) && n > 0 && isFinite(n);
}

function formaterMontantFCFA(montant) {
  return `${Number(montant).toFixed(2)} FCFA`;
}

function calculerSoldeApresVirement(soldeActuel, montant) {
  if (montant > soldeActuel) return null;
  return parseFloat((soldeActuel - montant).toFixed(2));
}

// -------------------------------------------------------------------
// Validation email
// -------------------------------------------------------------------
describe("validerEmail", () => {
  it("accepte un email valide", () => {
    expect(validerEmail("jean.dupont@gmail.com")).toBe(true);
  });

  it("accepte un email avec sous-domaine", () => {
    expect(validerEmail("user@mail.example.com")).toBe(true);
  });

  it("rejette un email sans @", () => {
    expect(validerEmail("jeandupont.com")).toBe(false);
  });

  it("rejette un email sans domaine", () => {
    expect(validerEmail("jean@")).toBe(false);
  });

  it("rejette une chaîne vide", () => {
    expect(validerEmail("")).toBe(false);
  });

  it("rejette une valeur non-string", () => {
    expect(validerEmail(null)).toBe(false);
    expect(validerEmail(undefined)).toBe(false);
    expect(validerEmail(123)).toBe(false);
  });

  it("accepte un email avec espaces en bord (trim)", () => {
    expect(validerEmail("  user@test.com  ")).toBe(true);
  });
});

// -------------------------------------------------------------------
// Validation PIN
// -------------------------------------------------------------------
describe("validerPin", () => {
  it("accepte un PIN à 4 chiffres", () => {
    expect(validerPin("1234")).toBe(true);
    expect(validerPin("0000")).toBe(true);
    expect(validerPin("9999")).toBe(true);
  });

  it("rejette un PIN trop court", () => {
    expect(validerPin("123")).toBe(false);
  });

  it("rejette un PIN trop long", () => {
    expect(validerPin("12345")).toBe(false);
  });

  it("rejette un PIN avec lettres", () => {
    expect(validerPin("12ab")).toBe(false);
  });

  it("rejette un PIN vide", () => {
    expect(validerPin("")).toBe(false);
  });

  it("accepte un nombre à 4 chiffres (converti en string)", () => {
    expect(validerPin(1234)).toBe(true);
  });
});

// -------------------------------------------------------------------
// Validation montant
// -------------------------------------------------------------------
describe("validerMontant", () => {
  it("accepte un montant positif entier", () => {
    expect(validerMontant(5000)).toBe(true);
  });

  it("accepte un montant positif décimal", () => {
    expect(validerMontant(0.01)).toBe(true);
    expect(validerMontant(123.45)).toBe(true);
  });

  it("rejette un montant nul", () => {
    expect(validerMontant(0)).toBe(false);
  });

  it("rejette un montant négatif", () => {
    expect(validerMontant(-100)).toBe(false);
  });

  it("rejette NaN", () => {
    expect(validerMontant(NaN)).toBe(false);
  });

  it("rejette Infinity", () => {
    expect(validerMontant(Infinity)).toBe(false);
  });

  it("accepte une chaîne numérique positive", () => {
    expect(validerMontant("1000")).toBe(true);
  });

  it("rejette une chaîne non numérique", () => {
    expect(validerMontant("abc")).toBe(false);
  });
});

// -------------------------------------------------------------------
// Formatage montant
// -------------------------------------------------------------------
describe("formaterMontantFCFA", () => {
  it("formate un entier avec 2 décimales", () => {
    expect(formaterMontantFCFA(5000)).toBe("5000.00 FCFA");
  });

  it("formate un décimal à 2 chiffres", () => {
    expect(formaterMontantFCFA(1234.5)).toBe("1234.50 FCFA");
  });

  it("formate zéro correctement", () => {
    expect(formaterMontantFCFA(0)).toBe("0.00 FCFA");
  });

  it("arrondit à 2 décimales", () => {
    expect(formaterMontantFCFA(10.999)).toBe("11.00 FCFA");
  });
});

// -------------------------------------------------------------------
// Calcul solde après virement
// -------------------------------------------------------------------
describe("calculerSoldeApresVirement", () => {
  it("soustrait le montant du solde", () => {
    expect(calculerSoldeApresVirement(10000, 3000)).toBe(7000);
  });

  it("retourne 0 si on vire tout", () => {
    expect(calculerSoldeApresVirement(5000, 5000)).toBe(0);
  });

  it("retourne null si montant > solde", () => {
    expect(calculerSoldeApresVirement(1000, 5000)).toBeNull();
  });

  it("gère les nombres décimaux correctement", () => {
    expect(calculerSoldeApresVirement(1000.50, 100.25)).toBe(900.25);
  });
});
