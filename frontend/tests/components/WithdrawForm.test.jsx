/**
 * SOUS-CATEGORIE : components/WithdrawForm
 * Tests du formulaire de retrait
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WithdrawForm from "../../src/components/WithdrawForm";

vi.mock("../../src/api", () => ({
  retrait: vi.fn(),
}));

import { retrait } from "../../src/api";

beforeEach(() => vi.clearAllMocks());

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("WithdrawForm — rendu", () => {
  it("affiche le titre Retrait", () => {
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    expect(screen.getByText(/Retrait/i)).toBeInTheDocument();
  });

  it("affiche le champ montant", () => {
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    expect(screen.getByPlaceholderText(/Montant/i)).toBeInTheDocument();
  });

  it("affiche le bouton Retirer", () => {
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    expect(screen.getByRole("button", { name: /Retirer/i })).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------
describe("WithdrawForm — validation", () => {
  it("affiche une erreur si le montant est vide", async () => {
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Montant invalide/i)).toBeInTheDocument()
    );
  });

  it("affiche une erreur si le montant est invalide (zéro ou négatif)", async () => {
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    // jsdom traite les valeurs hors min sur input[type=number] comme chaîne vide → NaN → invalide
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Montant invalide/i)).toBeInTheDocument()
    );
  });

  it("n'appelle pas l'API si le montant est invalide", async () => {
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() => expect(retrait).not.toHaveBeenCalled());
  });
});

// -------------------------------------------------------------------
// Retrait réussi
// -------------------------------------------------------------------
describe("WithdrawForm — retrait réussi", () => {
  it("appelle retrait avec le bon id et montant", async () => {
    retrait.mockResolvedValue({ succes: true, message: "Retrait effectué." });
    const onSuccess = vi.fn();
    render(<WithdrawForm id="acc-1" onSuccess={onSuccess} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "2000");
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() => expect(retrait).toHaveBeenCalledWith("acc-1", 2000));
  });

  it("affiche le message de succès", async () => {
    retrait.mockResolvedValue({ succes: true, message: "Retrait effectué." });
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "500");
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Retrait effectué/i)).toBeInTheDocument()
    );
  });

  it("appelle onSuccess après retrait réussi", async () => {
    retrait.mockResolvedValue({ succes: true, message: "OK" });
    const onSuccess = vi.fn();
    render(<WithdrawForm id="acc-1" onSuccess={onSuccess} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "1000");
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("réinitialise le champ montant après succès", async () => {
    retrait.mockResolvedValue({ succes: true, message: "OK" });
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText(/Montant/i);
    await userEvent.type(input, "1500");
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() => expect(input.value).toBe(""));
  });
});

// -------------------------------------------------------------------
// Retrait échoué
// -------------------------------------------------------------------
describe("WithdrawForm — retrait échoué", () => {
  it("affiche une erreur si solde insuffisant", async () => {
    retrait.mockResolvedValue({ succes: false, message: "Solde insuffisant." });
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "99999");
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Solde insuffisant/i)).toBeInTheDocument()
    );
  });

  it("affiche une erreur réseau si l'API lève une exception", async () => {
    retrait.mockRejectedValue(new Error("Network error"));
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "500");
    fireEvent.click(screen.getByRole("button", { name: /Retirer/i }));
    await waitFor(() =>
      expect(screen.getByText(/Erreur réseau/i)).toBeInTheDocument()
    );
  });

  it("désactive le bouton pendant le chargement", async () => {
    let resolve;
    retrait.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<WithdrawForm id="acc-1" onSuccess={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/Montant/i), "500");
    const btn = screen.getByRole("button", { name: /Retirer/i });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    resolve({ succes: true, message: "OK" });
  });
});
