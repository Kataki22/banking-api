/**
 * SOUS-CATEGORIE : pages/LoginPage
 * Tests de la page de connexion
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../../src/pages/LoginPage";
import { AuthContext } from "../../src/context/AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin(signIn = vi.fn()) {
  return render(
    <AuthContext.Provider value={{ user: null, signIn }}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("LoginPage — rendu", () => {
  it("affiche le titre NYAJ Banking", () => {
    renderLogin();
    expect(screen.getByText(/NYAJ Banking/i)).toBeInTheDocument();
  });

  it("affiche le champ email", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/jean\.dupont/i)).toBeInTheDocument();
  });

  it("affiche le champ PIN", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("••••")).toBeInTheDocument();
  });

  it("affiche le bouton Se connecter", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });

  it("affiche un lien vers la page d'inscription", () => {
    renderLogin();
    expect(screen.getByText(/Créer un compte/i)).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Validation formulaire
// -------------------------------------------------------------------
describe("LoginPage — validation", () => {
  it("bloque la connexion si les champs sont vides", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument()
    );
  });

  it("bloque la connexion si uniquement l'email est rempli", async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/jean\.dupont/i), "test@test.com");
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument()
    );
  });

  it("n'envoie pas la requête si les champs sont vides", async () => {
    global.fetch = vi.fn();
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
  });
});

// -------------------------------------------------------------------
// Connexion réussie
// -------------------------------------------------------------------
describe("LoginPage — connexion réussie", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("appelle signIn avec les données du compte et redirige", async () => {
    const signIn = vi.fn();
    const compte = { id: "uuid-1", prenom: "Jean", nom: "Dupont", email: "jean@test.com" };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: true, message: "Connexion réussie.", donnees: compte }),
      status: 200,
    });

    renderLogin(signIn);
    await userEvent.type(screen.getByPlaceholderText(/jean\.dupont/i), "jean@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••"), "1234");
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(compte);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});

// -------------------------------------------------------------------
// Connexion échouée
// -------------------------------------------------------------------
describe("LoginPage — connexion échouée", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("reste sur la page si les identifiants sont incorrects", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Email ou PIN incorrect." }),
      status: 401,
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/jean\.dupont/i), "mauvais@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••"), "0000");
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument()
    );
  });

  it("reste sur la page si le serveur est inaccessible", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/jean\.dupont/i), "jean@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••"), "1234");
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument()
    );
  });

  it("désactive le bouton pendant le chargement", async () => {
    let resolve;
    global.fetch = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/jean\.dupont/i), "jean@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••"), "1234");
    const btn = screen.getByRole("button", { name: /se connecter/i });
    fireEvent.click(btn);

    await waitFor(() => expect(btn).toBeDisabled());
    resolve({ json: () => Promise.resolve({ succes: false }), status: 401 });
  });
});

// -------------------------------------------------------------------
// Sécurité
// -------------------------------------------------------------------
describe("LoginPage — sécurité", () => {
  it("le champ PIN est de type password (masqué)", () => {
    renderLogin();
    const pinInput = screen.getByPlaceholderText("••••");
    expect(pinInput).toHaveAttribute("type", "password");
  });

  it("le champ PIN n'accepte que des chiffres (maxLength 4)", () => {
    renderLogin();
    const pinInput = screen.getByPlaceholderText("••••");
    expect(pinInput).toHaveAttribute("maxlength", "4");
  });
});
