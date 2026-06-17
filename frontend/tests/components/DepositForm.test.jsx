/**
 * SOUS-CATEGORIE : components/DepositForm
 * Tests du formulaire de dépôt
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DepositForm from "../../src/components/DepositForm";

vi.mock("../../src/api", () => ({
  depot: vi.fn(),
}));

import { depot } from "../../src/api";

beforeEach(() => vi.clearAllMocks());

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("DepositForm — rendu", () => {
  it("affiche le titre Dépôt", () => {
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    expect(screen.getByText(/Dépôt/i)).toBeInTheDocument();
  });

  it("affiche le champ montant", () => {
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    expect(screen.getByPlaceholderText(/Montant/i)).toBeInTheDocument();
  });

  it("affiche le bouton Déposer", () => {
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    expect(screen.getByRole("button", { name: /Déposer/i })).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------
describe("DepositForm — validation", () => {
  it("affiche une erreur si le montant est vide", async () => {
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Montant invalide/i)).toBeInTheDocument()
    );
  });

  it("affiche une erreur si le montant est invalide (zéro ou négatif)", async () => {
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    // jsdom traite les valeurs hors min sur input[type=number] comme chaîne vide → NaN → invalide
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Montant invalide/i)).toBeInTheDocument()
    );
  });

  it("n'appelle pas l'API si le montant est invalide", async () => {
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() => expect(depot).not.toHaveBeenCalled());
  });
});

// -------------------------------------------------------------------
// Dépôt réussi
// -------------------------------------------------------------------
describe("DepositForm — dépôt réussi", () => {
  it("appelle depot avec le bon id et montant", async () => {
    depot.mockResolvedValue({ succes: true, message: "Dépôt effectué." });
    const onSuccess = vi.fn();
    render(<DepositForm id="acc-1" onSuccess={onSuccess} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "5000");
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() => expect(depot).toHaveBeenCalledWith("acc-1", 5000));
  });

  it("affiche le message de succès", async () => {
    depot.mockResolvedValue({ succes: true, message: "Dépôt effectué." });
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "1000");
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Dépôt effectué/i)).toBeInTheDocument()
    );
  });

  it("appelle onSuccess après un dépôt réussi", async () => {
    depot.mockResolvedValue({ succes: true, message: "Dépôt effectué." });
    const onSuccess = vi.fn();
    render(<DepositForm id="acc-1" onSuccess={onSuccess} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "2000");
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("réinitialise le champ montant après succès", async () => {
    depot.mockResolvedValue({ succes: true, message: "OK" });
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText(/Montant/i);
    await userEvent.type(input, "3000");
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() => expect(input.value).toBe(""));
  });
});

// -------------------------------------------------------------------
// Dépôt échoué
// -------------------------------------------------------------------
describe("DepositForm — dépôt échoué", () => {
  it("affiche une erreur si l'API retourne succes:false", async () => {
    depot.mockResolvedValue({ succes: false, message: "Solde insuffisant." });
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "1000");
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Solde insuffisant/i)).toBeInTheDocument()
    );
  });

  it("affiche une erreur réseau si l'API lève une exception", async () => {
    depot.mockRejectedValue(new Error("Network error"));
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "1000");
    fireEvent.click(screen.getByRole("button", { name: /Déposer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Erreur réseau/i)).toBeInTheDocument()
    );
  });

  it("désactive le bouton pendant le chargement", async () => {
    let resolve;
    depot.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<DepositForm id="acc-1" onSuccess={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "1000");
    const btn = screen.getByRole("button", { name: /Déposer/i });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    resolve({ succes: true, message: "OK" });
  });
});
