/**
 * SOUS-CATEGORIE : pages/Dashboard
 * Tests du tableau de bord principal
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../../src/pages/Dashboard";
import { AuthContext } from "../../src/context/AuthContext";

vi.mock("../../src/api", () => ({
  getCompte: vi.fn(),
  getTransactions: vi.fn(),
}));

import { getCompte, getTransactions } from "../../src/api";

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
  { id: "tx-3", type: "virement_envoi", montant: "1000.00 FCFA", montantRaw: 1000, description: "Loyer", date: "17 juin 2026" },
];

function renderDashboard(user = mockUser, updateUser = vi.fn()) {
  return render(
    <AuthContext.Provider value={{ user, updateUser }}>
      <MemoryRouter>
        <Dashboard />
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
describe("Dashboard — rendu", () => {
  it("affiche le nom de l'utilisateur", async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getAllByText(/Serge Mbarga/i).length).toBeGreaterThan(0)
    );
  });

  it("affiche le solde disponible", async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/5000\.00 FCFA/i)).toBeInTheDocument()
    );
  });

  it("affiche la section Transactions récentes", async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/Transactions récentes/i)).toBeInTheDocument()
    );
  });

  it("affiche les stats dépôts et débits", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Total dépôts/i)).toBeInTheDocument();
      expect(screen.getByText(/Total débits/i)).toBeInTheDocument();
    });
  });

  it("affiche le badge Actif", async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Actif")).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Actions rapides
// -------------------------------------------------------------------
describe("Dashboard — actions rapides", () => {
  it("affiche les 4 boutons d'action rapide", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Dépôt/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retrait/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Virement/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Mon compte/i })).toBeInTheDocument();
    });
  });

  it("navigue vers /virement au clic sur Virement", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("button", { name: /Virement/i }));
    fireEvent.click(screen.getByRole("button", { name: /Virement/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/virement");
  });

  it("navigue vers le compte au clic sur Mon compte", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("button", { name: /Mon compte/i }));
    fireEvent.click(screen.getByRole("button", { name: /Mon compte/i }));
    expect(mockNavigate).toHaveBeenCalledWith(`/comptes/${mockUser.id}`);
  });
});

// -------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------
describe("Dashboard — statistiques", () => {
  it("calcule correctement le total des dépôts", async () => {
    renderDashboard();
    await waitFor(() => {
      const el = screen.getByText(/Total dépôts/i).closest('[class*="statCard"]');
      expect(el.textContent).toMatch(/3000/);
    });
  });

  it("calcule correctement le total des débits", async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/-1500\.00 FCFA/i)).toBeInTheDocument()
    );
  });

  it("affiche le nombre total de transactions", async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("3")).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Erreur réseau
// -------------------------------------------------------------------
describe("Dashboard — erreur réseau", () => {
  it("affiche une erreur si le serveur est inaccessible", async () => {
    getCompte.mockRejectedValue(new Error("Network error"));
    getTransactions.mockRejectedValue(new Error("Network error"));
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/Impossible de contacter/i)).toBeInTheDocument()
    );
  });
});
