/**
 * SOUS-CATEGORIE : pages/AccountDetail
 * Tests de la page détail d'un compte
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AccountDetail from "../../src/pages/AccountDetail";
import { AuthContext } from "../../src/context/AuthContext";

vi.mock("../../src/api", () => ({
  getCompte:      vi.fn(),
  getTransactions: vi.fn(),
  depot:          vi.fn(),
  retrait:        vi.fn(),
  deleteCompte:   vi.fn(),
}));

import { getCompte, getTransactions, depot, retrait, deleteCompte } from "../../src/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUser = {
  id: "acc-001",
  prenom: "Serge",
  nom: "Mbarga",
  email: "serge.mbarga@email.com",
  solde: "5000.00 FCFA",
};

const mockTransactions = [
  { id: "tx-1", type: "depot",   montant: "3000.00 FCFA", montantRaw: 3000, description: "Salaire", date: "17 juin 2026" },
  { id: "tx-2", type: "retrait", montant: "500.00 FCFA",  montantRaw: 500,  description: "Courses", date: "17 juin 2026" },
];

function renderAccountDetail(id = "acc-001", user = mockUser) {
  return render(
    <AuthContext.Provider value={{ user, updateUser: vi.fn() }}>
      <MemoryRouter initialEntries={[`/comptes/${id}`]}>
        <Routes>
          <Route path="/comptes/:id" element={<AccountDetail />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getCompte.mockResolvedValue({ succes: true, donnees: mockUser });
  getTransactions.mockResolvedValue({ succes: true, donnees: mockTransactions });
});

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("AccountDetail — rendu", () => {
  it("affiche le nom du titulaire", async () => {
    renderAccountDetail();
    await waitFor(() =>
      expect(screen.getByText(/Serge Mbarga/i)).toBeInTheDocument()
    );
  });

  it("affiche le solde du compte", async () => {
    renderAccountDetail();
    await waitFor(() =>
      expect(screen.getByText(/5000\.00 FCFA/i)).toBeInTheDocument()
    );
  });

  it("affiche l'email du compte", async () => {
    renderAccountDetail();
    await waitFor(() =>
      expect(screen.getByText(/serge\.mbarga@email\.com/i)).toBeInTheDocument()
    );
  });

  it("affiche les onglets Opérations et Historique", async () => {
    renderAccountDetail();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Opérations/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Historique/i })).toBeInTheDocument();
    });
  });

  it("affiche le bouton Retour", async () => {
    renderAccountDetail();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /← Retour/i })).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Onglets
// -------------------------------------------------------------------
describe("AccountDetail — onglets", () => {
  it("affiche les formulaires de dépôt et retrait par défaut", async () => {
    renderAccountDetail();
    await waitFor(() => {
      expect(screen.getByText(/Effectuer un dépôt/i)).toBeInTheDocument();
      expect(screen.getByText(/Effectuer un retrait/i)).toBeInTheDocument();
    });
  });

  it("affiche l'historique après clic sur l'onglet Historique", async () => {
    renderAccountDetail();
    await waitFor(() => screen.getByRole("button", { name: /Historique/i }));
    fireEvent.click(screen.getByRole("button", { name: /Historique/i }));
    await waitFor(() =>
      expect(screen.getByText(/Salaire/i)).toBeInTheDocument()
    );
  });

  it("revient aux opérations après clic sur l'onglet Opérations", async () => {
    renderAccountDetail();
    await waitFor(() => screen.getByRole("button", { name: /Historique/i }));
    fireEvent.click(screen.getByRole("button", { name: /Historique/i }));
    fireEvent.click(screen.getByRole("button", { name: /Opérations/i }));
    await waitFor(() =>
      expect(screen.getByText(/Effectuer un dépôt/i)).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Zone de danger (compte propre)
// -------------------------------------------------------------------
describe("AccountDetail — zone de danger", () => {
  it("affiche le bouton Supprimer pour le compte connecté", async () => {
    renderAccountDetail("acc-001", mockUser);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Supprimer le compte/i })).toBeInTheDocument()
    );
  });

  it("n'affiche pas le bouton Supprimer pour un autre compte", async () => {
    const autreUser = { ...mockUser, id: "acc-999" };
    renderAccountDetail("acc-001", autreUser);
    await waitFor(() => screen.getByText(/Opérations/i));
    expect(screen.queryByRole("button", { name: /Supprimer le compte/i })).not.toBeInTheDocument();
  });

  it("ouvre la modale de confirmation au clic sur Supprimer", async () => {
    renderAccountDetail("acc-001", mockUser);
    await waitFor(() => screen.getByRole("button", { name: /Supprimer le compte/i }));
    fireEvent.click(screen.getByRole("button", { name: /Supprimer le compte/i }));
    await waitFor(() => {
      // La modale ConfirmDelete contient "irréversible" — on cherche dans l'overlay
      const overlay = document.querySelector('[class*="overlay"]');
      expect(overlay).toBeInTheDocument();
    });
  });
});

// -------------------------------------------------------------------
// Dépôt depuis AccountDetail
// -------------------------------------------------------------------
describe("AccountDetail — dépôt", () => {
  it("appelle depot et rafraîchit le compte après succès", async () => {
    depot.mockResolvedValue({ succes: true, message: "Dépôt effectué." });
    renderAccountDetail();
    await waitFor(() => screen.getAllByPlaceholderText(/Ex : 5000/i));
    const inputs = screen.getAllByPlaceholderText(/Ex : 5000/i);
    await userEvent.type(inputs[0], "2000");
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() => expect(depot).toHaveBeenCalledWith("acc-001", 2000, undefined));
  });
});

// -------------------------------------------------------------------
// Erreur chargement
// -------------------------------------------------------------------
describe("AccountDetail — erreur", () => {
  it("affiche une erreur si le compte est introuvable", async () => {
    getCompte.mockResolvedValue({ succes: false, message: "Compte introuvable." });
    renderAccountDetail();
    await waitFor(() =>
      expect(screen.getByText(/Compte introuvable/i)).toBeInTheDocument()
    );
  });

  it("affiche une erreur réseau si le serveur est inaccessible", async () => {
    getCompte.mockRejectedValue(new Error("Network error"));
    renderAccountDetail();
    await waitFor(() =>
      expect(screen.getByText(/Impossible de contacter/i)).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------
describe("AccountDetail — navigation", () => {
  it("navigue vers / au clic sur Retour", async () => {
    renderAccountDetail();
    await waitFor(() => screen.getByRole("button", { name: /← Retour/i }));
    fireEvent.click(screen.getByRole("button", { name: /← Retour/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
