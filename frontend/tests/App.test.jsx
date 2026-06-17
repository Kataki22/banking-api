/**
 * SOUS-CATEGORIE : App
 * Tests du routage et de la protection des routes
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

// Mock de toutes les pages pour isoler le routage
vi.mock("../src/pages/LoginPage",    () => ({ default: () => <div>LoginPage</div> }));
vi.mock("../src/pages/RegisterPage", () => ({ default: () => <div>RegisterPage</div> }));
vi.mock("../src/pages/Dashboard",    () => ({ default: () => <div>Dashboard</div> }));
vi.mock("../src/pages/AccountDetail",() => ({ default: () => <div>AccountDetail</div> }));
vi.mock("../src/pages/TransferPage", () => ({ default: () => <div>TransferPage</div> }));
vi.mock("../src/components/Navbar",  () => ({ default: () => <nav>Navbar</nav> }));

// Helper pour injecter un user dans localStorage
function setStoredUser(user) {
  localStorage.setItem("nyaj_user", JSON.stringify(user));
}

const mockUser = {
  id: "acc-001",
  prenom: "Serge",
  nom: "Mbarga",
  email: "serge.mbarga@email.com",
  solde: "5000.00 FCFA",
};

beforeEach(() => localStorage.clear());

// -------------------------------------------------------------------
// Routes publiques (non connecté)
// -------------------------------------------------------------------
describe("App — routes publiques", () => {
  it("affiche LoginPage sur /login quand non connecté", () => {
    window.history.pushState({}, "", "/login");
    render(<App />);
    expect(screen.getByText("LoginPage")).toBeInTheDocument();
  });

  it("affiche RegisterPage sur /register quand non connecté", () => {
    window.history.pushState({}, "", "/register");
    render(<App />);
    expect(screen.getByText("RegisterPage")).toBeInTheDocument();
  });

  it("redirige vers /login si non connecté sur /", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText("LoginPage")).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Routes protégées (connecté)
// -------------------------------------------------------------------
describe("App — routes protégées", () => {
  it("affiche Dashboard sur / quand connecté", () => {
    setStoredUser(mockUser);
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("affiche la Navbar quand connecté", () => {
    setStoredUser(mockUser);
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText("Navbar")).toBeInTheDocument();
  });

  it("redirige vers / si connecté et accède à /login", () => {
    setStoredUser(mockUser);
    window.history.pushState({}, "", "/login");
    render(<App />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("redirige vers / si connecté et accède à /register", () => {
    setStoredUser(mockUser);
    window.history.pushState({}, "", "/register");
    render(<App />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Route 404
// -------------------------------------------------------------------
describe("App — route inconnue", () => {
  it("redirige vers / sur une route inconnue (non connecté → login)", () => {
    window.history.pushState({}, "", "/route-inexistante");
    render(<App />);
    expect(screen.getByText("LoginPage")).toBeInTheDocument();
  });

  it("redirige vers / sur une route inconnue (connecté → dashboard)", () => {
    setStoredUser(mockUser);
    window.history.pushState({}, "", "/route-inexistante");
    render(<App />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
