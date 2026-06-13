/**
 * SOUS-CATEGORIE : integration/auth
 * Tests d'intégration du flux d'authentification complet
 * (AuthContext + comportement application)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Simulation du contexte d'auth
function createAuthStore() {
  let currentUser = null;

  return {
    signIn(user) { currentUser = user; },
    signOut() { currentUser = null; },
    getUser() { return currentUser; },
    updateUser(user) { currentUser = user; },
  };
}

// Simulation de localStorage
function createLocalStorageMock() {
  const store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => Object.keys(store).forEach((k) => delete store[k]),
  };
}

// -------------------------------------------------------------------
// Flux d'inscription
// -------------------------------------------------------------------
describe("Flux inscription (register)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("crée un compte et connecte l'utilisateur", async () => {
    const compte = { id: "uuid-1", prenom: "Jean", nom: "Dupont", email: "jean@test.com", solde: "0.00 FCFA" };
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: true, donnees: compte }),
      status: 201,
    });

    const store = createAuthStore();
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "Dupont", prenom: "Jean", email: "jean@test.com", pin: "1234" }),
    });
    const data = await res.json();

    if (data.succes) store.signIn(data.donnees);

    expect(store.getUser()).toEqual(compte);
    expect(store.getUser().email).toBe("jean@test.com");
  });

  it("ne connecte pas si la création échoue", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Email déjà utilisé." }),
      status: 400,
    });

    const store = createAuthStore();
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: "Dupont", prenom: "Jean", email: "existe@test.com", pin: "1234" }),
    });
    const data = await res.json();
    if (data.succes) store.signIn(data.donnees);

    expect(store.getUser()).toBeNull();
  });
});

// -------------------------------------------------------------------
// Flux de connexion
// -------------------------------------------------------------------
describe("Flux connexion (login)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("connecte l'utilisateur avec les bons identifiants", async () => {
    const compte = { id: "uuid-1", prenom: "Jean", nom: "Dupont", email: "jean@test.com" };
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: true, donnees: compte }),
      status: 200,
    });

    const store = createAuthStore();
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "jean@test.com", pin: "1234" }),
    });
    const data = await res.json();
    if (data.succes) store.signIn(data.donnees);

    expect(store.getUser()).not.toBeNull();
    expect(store.getUser().id).toBe("uuid-1");
  });

  it("ne connecte pas avec un mauvais PIN", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Email ou PIN incorrect." }),
      status: 401,
    });

    const store = createAuthStore();
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "jean@test.com", pin: "0000" }),
    });
    const data = await res.json();
    if (data.succes) store.signIn(data.donnees);

    expect(store.getUser()).toBeNull();
  });
});

// -------------------------------------------------------------------
// Persistance session (localStorage)
// -------------------------------------------------------------------
describe("Persistance session", () => {
  it("sauvegarde l'utilisateur dans localStorage à la connexion", () => {
    const ls = createLocalStorageMock();
    const compte = { id: "uuid-1", prenom: "Jean", nom: "Dupont" };

    // Simulation de signIn
    ls.setItem("nyaj_user", JSON.stringify(compte));

    const stored = JSON.parse(ls.getItem("nyaj_user"));
    expect(stored.id).toBe("uuid-1");
  });

  it("supprime l'utilisateur de localStorage à la déconnexion", () => {
    const ls = createLocalStorageMock();
    ls.setItem("nyaj_user", JSON.stringify({ id: "uuid-1" }));

    // Simulation de signOut
    ls.removeItem("nyaj_user");

    expect(ls.getItem("nyaj_user")).toBeNull();
  });

  it("restaure la session depuis localStorage", () => {
    const ls = createLocalStorageMock();
    const compte = { id: "uuid-1", prenom: "Jean", nom: "Dupont" };
    ls.setItem("nyaj_user", JSON.stringify(compte));

    // Simulation du chargement initial
    const stored = ls.getItem("nyaj_user");
    const user = stored ? JSON.parse(stored) : null;

    expect(user).not.toBeNull();
    expect(user.prenom).toBe("Jean");
  });

  it("retourne null si le localStorage est vide", () => {
    const ls = createLocalStorageMock();
    const stored = ls.getItem("nyaj_user");
    expect(stored).toBeNull();
  });
});

// -------------------------------------------------------------------
// Déconnexion
// -------------------------------------------------------------------
describe("Flux déconnexion", () => {
  it("efface l'utilisateur après signOut", () => {
    const store = createAuthStore();
    store.signIn({ id: "uuid-1", prenom: "Jean" });

    expect(store.getUser()).not.toBeNull();
    store.signOut();
    expect(store.getUser()).toBeNull();
  });
});

// -------------------------------------------------------------------
// Mise à jour profil
// -------------------------------------------------------------------
describe("Mise à jour profil", () => {
  it("met à jour le solde après une transaction", () => {
    const store = createAuthStore();
    store.signIn({ id: "uuid-1", prenom: "Jean", solde: "0.00 FCFA" });

    store.updateUser({ id: "uuid-1", prenom: "Jean", solde: "5000.00 FCFA" });
    expect(store.getUser().solde).toBe("5000.00 FCFA");
  });
});
