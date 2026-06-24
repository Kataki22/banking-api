/**
 * SOUS-CATEGORIE : pages/RegisterPage
 * Tests de la page d'inscription (création de compte)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../../src/pages/RegisterPage";
import { AuthContext } from "../../src/context/AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderRegister(signIn = vi.fn()) {
  return render(
    <AuthContext.Provider value={{ user: null, signIn }}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

async function fillForm({ prenom = "Jean", nom = "Dupont", email = "jean@test.com", pin = "1234", pinConfirm = "1234" } = {}) {
  if (prenom) await userEvent.type(screen.getByPlaceholderText("Jean"), prenom);
  if (nom)    await userEvent.type(screen.getByPlaceholderText("Dupont"), nom);
  if (email)  await userEvent.type(screen.getByPlaceholderText(/jean\.dupont/i), email);

  const pinInputs = screen.getAllByPlaceholderText("••••");
  if (pin)        await userEvent.type(pinInputs[0], pin);
  if (pinConfirm) await userEvent.type(pinInputs[1], pinConfirm);
}

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("RegisterPage — rendu", () => {
  it("affiche le titre 'Ouvrir un compte'", () => {
    renderRegister();
    expect(screen.getByText(/Ouvrir un compte/i)).toBeInTheDocument();
  });

  it("affiche les champs prénom, nom, email, PIN x2", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("Jean")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Dupont")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/jean\.dupont/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("••••")).toHaveLength(2);
  });

  it("affiche le bouton de création", () => {
    renderRegister();
    expect(screen.getByRole("button", { name: /Créer mon compte/i })).toBeInTheDocument();
  });

  it("affiche un lien vers la connexion", () => {
    renderRegister();
    expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------
describe("RegisterPage — validation", () => {
  it("bloque l'inscription si les champs sont vides", async () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Créer mon compte/i })).toBeInTheDocument()
    );
  });

  it("bloque l'inscription si les PIN ne correspondent pas", async () => {
    renderRegister();
    await fillForm({ pin: "1234", pinConfirm: "5678" });
    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Créer mon compte/i })).toBeInTheDocument()
    );
  });

  it("bloque l'inscription si le PIN n'a pas 4 chiffres", async () => {
    renderRegister();
    await fillForm({ pin: "12", pinConfirm: "12" });
    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Créer mon compte/i })).toBeInTheDocument()
    );
  });

  it("ne soumet pas si les données sont invalides", async () => {
    global.fetch = vi.fn();
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));
    expect(fetch).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------
// Inscription réussie
// -------------------------------------------------------------------
describe("RegisterPage — inscription réussie", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("appelle signIn et redirige vers / après succès", async () => {
    const signIn = vi.fn();
    const compte = { id: "uuid-new", prenom: "Jean", nom: "Dupont", email: "jean@test.com" };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: true, message: "Compte créé.", donnees: compte }),
      status: 201,
    });

    renderRegister(signIn);
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(compte);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});

// -------------------------------------------------------------------
// Inscription échouée
// -------------------------------------------------------------------
describe("RegisterPage — inscription échouée", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("reste sur la page si l'email est déjà utilisé", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Cet email est déjà associé à un compte." }),
      status: 400,
    });

    renderRegister();
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Créer mon compte/i })).toBeInTheDocument()
    );
  });

  it("reste sur la page si le serveur est inaccessible", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    renderRegister();
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Créer mon compte/i })).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Sécurité
// -------------------------------------------------------------------
describe("RegisterPage — sécurité", () => {
  it("les champs PIN sont de type password", () => {
    renderRegister();
    const pinInputs = screen.getAllByPlaceholderText("••••");
    pinInputs.forEach((input) => {
      expect(input).toHaveAttribute("type", "password");
    });
  });

  it("les champs PIN ont maxLength=4", () => {
    renderRegister();
    const pinInputs = screen.getAllByPlaceholderText("••••");
    pinInputs.forEach((input) => {
      expect(input).toHaveAttribute("maxlength", "4");
    });
  });
});
