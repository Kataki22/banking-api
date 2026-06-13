/**
 * SOUS-CATEGORIE : components/ConfirmDelete
 * Tests de la modale de confirmation de suppression
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmDelete from "../../src/components/ConfirmDelete";

const mockCompte = {
  id: "uuid-del",
  prenom: "Alice",
  nom: "Martin",
  solde: "500.00 FCFA",
};

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("ConfirmDelete — rendu", () => {
  it("affiche le nom du compte à supprimer", () => {
    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/Alice Martin/)).toBeInTheDocument();
  });

  it("affiche le solde du compte", () => {
    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/500\.00 FCFA/)).toBeInTheDocument();
  });

  it("affiche le bouton Annuler", () => {
    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Annuler")).toBeInTheDocument();
  });

  it("affiche le bouton de confirmation de suppression", () => {
    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("button", { name: /oui, supprimer/i })).toBeInTheDocument();
  });

  it("affiche un avertissement d'irréversibilité", () => {
    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/irréversible/i)).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Interactions
// -------------------------------------------------------------------
describe("ConfirmDelete — interactions", () => {
  it("appelle onCancel lors d'un clic sur Annuler", () => {
    const onCancel = vi.fn();
    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Annuler"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("appelle onCancel lors d'un clic sur le fond (overlay)", () => {
    const onCancel = vi.fn();
    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={onCancel} />);
    const overlay = document.querySelector('[class*="overlay"]');
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("ne propage pas le clic depuis la modale vers l'overlay", () => {
    const onCancel = vi.fn();
    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={onCancel} />);
    const modal = document.querySelector('[class*="modal"]');
    fireEvent.click(modal);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------
// Appel API de suppression
// -------------------------------------------------------------------
describe("ConfirmDelete — suppression", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("appelle l'API DELETE et déclenche onConfirm en cas de succès", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: true, message: "Compte supprimé." }),
      status: 200,
    });

    const onConfirm = vi.fn();
    render(<ConfirmDelete compte={mockCompte} onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByText(/Oui, supprimer/i));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("uuid-del"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("affiche une erreur si l'API retourne un échec", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ succes: false, message: "Erreur de suppression." }),
      status: 500,
    });

    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByText(/Oui, supprimer/i));

    await waitFor(() => expect(screen.getByText(/Erreur de suppression/i)).toBeInTheDocument());
  });

  it("désactive les boutons pendant le chargement", async () => {
    let resolve;
    global.fetch = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));

    render(<ConfirmDelete compte={mockCompte} onConfirm={() => {}} onCancel={() => {}} />);
    const btn = screen.getByText(/Oui, supprimer/i);
    fireEvent.click(btn);

    await waitFor(() => expect(btn).toBeDisabled());
    resolve({ json: () => Promise.resolve({ succes: true }), status: 200 });
  });
});
