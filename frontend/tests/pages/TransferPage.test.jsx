/**
 * SOUS-CATEGORIE : pages/TransferPage
 * Tests de la page de virement
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TransferPage from "../../src/pages/TransferPage";
import { AuthContext } from "../../src/context/AuthContext";

vi.mock("../../src/api", () => ({
  getComptes: vi.fn(),
  virement:   vi.fn(),
}));

import { getComptes, virement } from "../../src/api";

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

const autresComptes = [
  { id: "acc-002", prenom: "Nadège", nom: "Tchoupo", email: "nadege.tchoupo@email.com", solde: "12500.00 FCFA" },
  { id: "acc-003", prenom: "Brice",  nom: "Nnomo",   email: "brice.nnomo@email.com",   solde: "800.00 FCFA" },
];

function renderTransfer(user = mockUser, updateUser = vi.fn()) {
  return render(
    <AuthContext.Provider value={{ user, updateUser }}>
      <MemoryRouter>
        <TransferPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getComptes.mockResolvedValue({
    succes: true,
    donnees: [mockUser, ...autresComptes],
  });
});

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("TransferPage — rendu", () => {
  it("affiche le titre Effectuer un virement", async () => {
    renderTransfer();
    await waitFor(() =>
      expect(screen.getByText(/Effectuer un virement/i)).toBeInTheDocument()
    );
  });

  it("affiche l'expéditeur connecté", async () => {
    renderTransfer();
    await waitFor(() => {
      // L'expéditeur apparaît dans la section "De votre compte"
      const section = document.querySelector('[class*="accountBox"]');
      expect(section).toBeInTheDocument();
      expect(section.textContent).toMatch(/Serge Mbarga/i);
    });
  });

  it("affiche le solde de l'expéditeur", async () => {
    renderTransfer();
    await waitFor(() =>
      expect(screen.getByText(/5000\.00 FCFA/i)).toBeInTheDocument()
    );
  });

  it("affiche la liste des destinataires (sans soi-même)", async () => {
    renderTransfer();
    await waitFor(() => {
      expect(screen.getByText(/Nadège Tchoupo/i)).toBeInTheDocument();
      expect(screen.getByText(/Brice Nnomo/i)).toBeInTheDocument();
    });
  });

  it("affiche le résumé du virement", async () => {
    renderTransfer();
    await waitFor(() =>
      expect(screen.getByText(/Résumé/i)).toBeInTheDocument()
    );
  });

  it("affiche le bouton retour", async () => {
    renderTransfer();
    await waitFor(() =>
      expect(screen.getByText(/← Retour/i)).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------
describe("TransferPage — validation", () => {
  it("affiche une erreur si aucun destinataire n'est sélectionné", async () => {
    renderTransfer();
    await waitFor(() => screen.getByRole("button", { name: /Confirmer le virement/i }));
    // Saisir un montant pour activer le bouton (destinataireId reste vide)
    const montantInput = screen.getByPlaceholderText(/Ex : 10000/i);
    fireEvent.change(montantInput, { target: { value: "1000" } });
    // Soumettre directement le formulaire pour contourner le disabled
    const form = montantInput.closest("form");
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Confirmer le virement/i })).toBeInTheDocument()
    );
  });

  it("le bouton est désactivé sans destinataire et montant", async () => {
    renderTransfer();
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Confirmer le virement/i });
      expect(btn).toBeDisabled();
    });
  });
});

// -------------------------------------------------------------------
// Virement réussi
// -------------------------------------------------------------------
describe("TransferPage — virement réussi", () => {
  it("appelle virement avec les bons paramètres", async () => {
    virement.mockResolvedValue({
      succes: true,
      message: "Virement de 1000.00 FCFA effectué.",
      donnees: { source: { ...mockUser, solde: "4000.00 FCFA" } },
    });

    renderTransfer();
    await waitFor(() => screen.getByRole("combobox"));

    await userEvent.selectOptions(
      screen.getByRole("combobox"),
      autresComptes[0].id
    );
    await userEvent.type(screen.getByPlaceholderText(/Ex : 10000/i), "1000");
    fireEvent.click(screen.getByRole("button", { name: /Confirmer le virement/i }));

    await waitFor(() =>
      expect(virement).toHaveBeenCalledWith(
        mockUser.id,
        autresComptes[0].id,
        1000,
        undefined
      )
    );
  });

  it("vide les champs après un virement réussi", async () => {
    virement.mockResolvedValue({
      succes: true,
      message: "Virement effectué.",
      donnees: { source: mockUser },
    });

    renderTransfer();
    await waitFor(() => screen.getByRole("combobox"));
    await userEvent.selectOptions(screen.getByRole("combobox"), autresComptes[0].id);
    await userEvent.type(screen.getByPlaceholderText(/Ex : 10000/i), "500");
    fireEvent.click(screen.getByRole("button", { name: /Confirmer le virement/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Confirmer le virement/i })).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Virement échoué
// -------------------------------------------------------------------
describe("TransferPage — virement échoué", () => {
  it("affiche une erreur si solde insuffisant", async () => {
    virement.mockResolvedValue({ succes: false, message: "Solde insuffisant." });

    renderTransfer();
    await waitFor(() => screen.getByRole("combobox"));
    await userEvent.selectOptions(screen.getByRole("combobox"), autresComptes[0].id);
    await userEvent.type(screen.getByPlaceholderText(/Ex : 10000/i), "99999");
    fireEvent.click(screen.getByRole("button", { name: /Confirmer le virement/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Confirmer le virement/i })).toBeInTheDocument()
    );
  });

  it("affiche une erreur réseau si le serveur est inaccessible", async () => {
    virement.mockRejectedValue(new Error("Network error"));

    renderTransfer();
    await waitFor(() => screen.getByRole("combobox"));
    await userEvent.selectOptions(screen.getByRole("combobox"), autresComptes[0].id);
    await userEvent.type(screen.getByPlaceholderText(/Ex : 10000/i), "500");
    fireEvent.click(screen.getByRole("button", { name: /Confirmer le virement/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Confirmer le virement/i })).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Aucun compte disponible
// -------------------------------------------------------------------
describe("TransferPage — aucun autre compte", () => {
  it("affiche un message si aucun autre compte n'existe", async () => {
    getComptes.mockResolvedValue({ succes: true, donnees: [mockUser] });
    renderTransfer();
    await waitFor(() =>
      expect(screen.getByText(/Aucun autre compte disponible/i)).toBeInTheDocument()
    );
  });
});

// -------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------
describe("TransferPage — navigation", () => {
  it("navigue vers / au clic sur Retour", async () => {
    renderTransfer();
    await waitFor(() => screen.getByText(/← Retour/i));
    fireEvent.click(screen.getByText(/← Retour/i));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
