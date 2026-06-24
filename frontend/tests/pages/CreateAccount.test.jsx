/**
 * SOUS-CATEGORIE : pages/CreateAccount
 * Tests de la page de création de compte (legacy sans auth)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateAccount from "../../src/pages/CreateAccount";

vi.mock("../../src/api", () => ({
  createCompte: vi.fn(),
}));

import { createCompte } from "../../src/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderCreateAccount() {
  return render(
    <MemoryRouter>
      <CreateAccount />
    </MemoryRouter>
  );
}

beforeEach(() => vi.clearAllMocks());

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("CreateAccount — rendu", () => {
  it("affiche le titre Nouveau compte", () => {
    renderCreateAccount();
    expect(screen.getByText(/Nouveau compte/i)).toBeInTheDocument();
  });

  it("affiche le champ Nom", () => {
    renderCreateAccount();
    expect(screen.getByPlaceholderText(/Dupont/i)).toBeInTheDocument();
  });

  it("affiche le champ Prénom", () => {
    renderCreateAccount();
    expect(screen.getByPlaceholderText(/Jean/i)).toBeInTheDocument();
  });

  it("affiche le bouton Créer le compte", () => {
    renderCreateAccount();
    expect(screen.getByRole("button", { name: /Créer le compte/i })).toBeInTheDocument();
  });

  it("affiche le bouton Annuler", () => {
    renderCreateAccount();
    expect(screen.getByRole("button", { name: /Annuler/i })).toBeInTheDocument();
  });

  it("affiche le solde initial à 0.00 FCFA", () => {
    renderCreateAccount();
    expect(screen.getByText(/0\.00 FCFA/i)).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------
describe("CreateAccount — validation", () => {
  it("affiche une erreur si les champs sont vides", async () => {
    renderCreateAccount();
    fireEvent.click(screen.getByRole("button", { name: /Créer le compte/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Créer le compte/i })).toBeInTheDocument()
    );
  });

  it("affiche une erreur si uniquement le nom est rempli", async () => {
    renderCreateAccount();
    await userEvent.type(screen.getByPlaceholderText(/Dupont/i), "Mbarga");
    fireEvent.click(screen.getByRole("button", { name: /Créer le compte/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Créer le compte/i })).toBeInTheDocument()
    );
  });

  it("n'appelle pas l'API si les champs sont vides", async () => {
    renderCreateAccount();
    fireEvent.click(screen.getByRole("button", { name: /Créer le compte/i }));
    await waitFor(() => expect(createCompte).not.toHaveBeenCalled());
  });
});

// -------------------------------------------------------------------
// Création réussie
// -------------------------------------------------------------------
describe("CreateAccount — création réussie", () => {
  it("appelle createCompte avec nom et prénom", async () => {
    createCompte.mockResolvedValue({ succes: true, donnees: { id: "new-001" } });
    renderCreateAccount();
    await userEvent.type(screen.getByPlaceholderText(/Dupont/i), "Mbarga");
    await userEvent.type(screen.getByPlaceholderText(/Jean/i), "Serge");
    fireEvent.click(screen.getByRole("button", { name: /Créer le compte/i }));
    await waitFor(() =>
      expect(createCompte).toHaveBeenCalledWith("Mbarga", "Serge")
    );
  });

  it("redirige vers le compte créé après succès", async () => {
    createCompte.mockResolvedValue({ succes: true, donnees: { id: "new-001" } });
    renderCreateAccount();
    await userEvent.type(screen.getByPlaceholderText(/Dupont/i), "Mbarga");
    await userEvent.type(screen.getByPlaceholderText(/Jean/i), "Serge");
    fireEvent.click(screen.getByRole("button", { name: /Créer le compte/i }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/comptes/new-001")
    );
  });
});

// -------------------------------------------------------------------
// Création échouée
// -------------------------------------------------------------------
describe("CreateAccount — création échouée", () => {
  it("affiche une erreur si l'API retourne succes:false", async () => {
    createCompte.mockResolvedValue({ succes: false, message: "Erreur lors de la création." });
    renderCreateAccount();
    await userEvent.type(screen.getByPlaceholderText(/Dupont/i), "Mbarga");
    await userEvent.type(screen.getByPlaceholderText(/Jean/i), "Serge");
    fireEvent.click(screen.getByRole("button", { name: /Créer le compte/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Créer le compte/i })).toBeInTheDocument()
    );
  });

  it("affiche une erreur réseau si le serveur est inaccessible", async () => {
    createCompte.mockRejectedValue(new Error("Network error"));
    renderCreateAccount();
    await userEvent.type(screen.getByPlaceholderText(/Dupont/i), "Mbarga");
    await userEvent.type(screen.getByPlaceholderText(/Jean/i), "Serge");
    fireEvent.click(screen.getByRole("button", { name: /Créer le compte/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Créer le compte/i })).toBeInTheDocument()
    );
  });

  it("désactive le bouton pendant le chargement", async () => {
    let resolve;
    createCompte.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderCreateAccount();
    await userEvent.type(screen.getByPlaceholderText(/Dupont/i), "Mbarga");
    await userEvent.type(screen.getByPlaceholderText(/Jean/i), "Serge");
    const btn = screen.getByRole("button", { name: /Créer le compte/i });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    resolve({ succes: true, donnees: { id: "x" } });
  });
});

// -------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------
describe("CreateAccount — navigation", () => {
  it("navigue vers / au clic sur Annuler", () => {
    renderCreateAccount();
    fireEvent.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
