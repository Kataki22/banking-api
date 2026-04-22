/**
 * Exécute les 46 cas de tests contre l'API déployée sur Render,
 * produit un rapport JSON et met à jour les statuts dans CAHIER_DES_CHARGES.md.
 */
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.API_URL || "https://banking-api-rdlr.onrender.com";
const ROOT = path.resolve(__dirname, "..");
const MD_PATH = path.join(ROOT, "CAHIER_DES_CHARGES.md");
const REPORT_PATH = path.join(ROOT, "TEST_REPORT.json");

const results = {};

async function http(method, urlPath, body, headersOverride) {
  const opts = {
    method,
    headers: headersOverride || { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${urlPath}`, opts);
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function tc(id, fn) {
  try {
    const ok = await fn();
    results[id] = ok === true || ok === undefined ? "Pass" : `Fail (${ok})`;
  } catch (err) {
    results[id] = `Fail (${err.message})`;
  }
  console.log(`  ${id}: ${results[id]}`);
}

async function warmup() {
  console.log("Réveil du service Render (peut prendre jusqu'à 60s)...");
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(BASE_URL, { signal: AbortSignal.timeout(30000) });
      if (r.ok) {
        console.log("Service actif.\n");
        return;
      }
    } catch {}
    console.log(`  tentative ${i + 1}/5 échouée, nouvelle tentative...`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log("Service toujours pas prêt — on continue quand même.\n");
}

async function creerCompte(nom = "Test", prenom = "User") {
  const r = await http("POST", "/api/comptes", { nom, prenom });
  if (r.status !== 201) throw new Error(`création compte échouée (status ${r.status})`);
  return r.data.donnees.id;
}

async function run() {
  await warmup();
  console.log("Exécution des 46 cas de tests :\n");

  // --- 8.2 Général ---
  await tc("TC-001", async () => {
    const r = await http("GET", "/");
    return (r.status === 200 && r.data && r.data.message && r.data.documentation === "/api-docs")
      || `status=${r.status}`;
  });

  await tc("TC-002", async () => {
    const r = await fetch(`${BASE_URL}/api-docs/`);
    const txt = await r.text();
    return (r.status === 200 && /swagger/i.test(txt)) || `status=${r.status}`;
  });

  // --- 8.3 Création de compte ---
  await tc("TC-003", async () => {
    const r = await http("POST", "/api/comptes", { nom: "Dupont", prenom: "Jean" });
    return (r.status === 201 && r.data.succes === true && r.data.donnees.id && r.data.donnees.solde === "0.00 FCFA")
      || `status=${r.status}`;
  });

  await tc("TC-004", async () => {
    const r = await http("POST", "/api/comptes", { prenom: "Jean" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-005", async () => {
    const r = await http("POST", "/api/comptes", { nom: "Dupont" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-006", async () => {
    const r = await http("POST", "/api/comptes", {});
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-007", async () => {
    const r = await http("POST", "/api/comptes", { nom: "", prenom: "Jean" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-008", async () => {
    const r = await http("POST", "/api/comptes", { nom: "Dupont", prenom: "" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-009", async () => {
    const id1 = await creerCompte("A", "A");
    const id2 = await creerCompte("B", "B");
    return id1 !== id2 || "ids identiques";
  });

  await tc("TC-010", async () => {
    const r = await http("POST", "/api/comptes", "nom=Dupont&prenom=Jean", {
      "Content-Type": "application/x-www-form-urlencoded",
    });
    return (r.status === 400 || r.status === 500) || `status=${r.status}`;
  });

  // --- 8.4 Listing ---
  await tc("TC-011", async () => {
    // Comme des comptes ont été créés plus tôt, on vérifie juste que la liste est bien un array valide
    const r = await http("GET", "/api/comptes");
    return (r.status === 200 && Array.isArray(r.data.donnees))
      || `status=${r.status}`;
  });

  await tc("TC-012", async () => {
    // Créer 3 comptes supplémentaires et vérifier qu'ils apparaissent dans la liste
    const avant = (await http("GET", "/api/comptes")).data.donnees.length;
    await creerCompte("A1", "B1");
    await creerCompte("A2", "B2");
    await creerCompte("A3", "B3");
    const apres = (await http("GET", "/api/comptes")).data.donnees.length;
    return (apres === avant + 3) || `avant=${avant} apres=${apres}`;
  });

  await tc("TC-013", async () => {
    const r = await http("GET", "/api/comptes");
    const ok = r.data.donnees.every((c) => /^\d+\.\d{2} FCFA$/.test(c.solde));
    return ok || "format solde incorrect";
  });

  // --- 8.5 Consultation ---
  await tc("TC-014", async () => {
    const id = await creerCompte("Consult", "Test");
    const r = await http("GET", `/api/comptes/${id}`);
    return (r.status === 200 && r.data.donnees.id === id) || `status=${r.status}`;
  });

  await tc("TC-015", async () => {
    const r = await http("GET", "/api/comptes/00000000-0000-0000-0000-000000000000");
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-016", async () => {
    const r = await http("GET", "/api/comptes/abc");
    return r.status === 404 || `status=${r.status}`;
  });

  // --- 8.6 Dépôt ---
  await tc("TC-018", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    return (r.status === 200 && r.data.donnees.solde === "5000.00 FCFA") || `status=${r.status}`;
  });

  await tc("TC-019", async () => {
    const r = await http("POST", "/api/comptes/00000000-0000-0000-0000-000000000000/depot", { montant: 5000 });
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-020", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: -100 });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-021", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 0 });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-022", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: "5000" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-023", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, {});
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-024", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: null });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-025", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 1000 });
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 2000 });
    return (r.data.donnees.solde === "3000.00 FCFA") || `solde=${r.data.donnees.solde}`;
  });

  await tc("TC-026", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 1000000000 });
    return r.status === 200 || `status=${r.status}`;
  });

  await tc("TC-027", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 1234.56 });
    return (r.status === 200 && r.data.donnees.solde === "1234.56 FCFA") || `solde=${r.data.donnees?.solde}`;
  });

  // --- 8.7 Retrait ---
  await tc("TC-028", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 10000 });
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 3000 });
    return (r.status === 200 && r.data.donnees.solde === "7000.00 FCFA") || `solde=${r.data.donnees?.solde}`;
  });

  await tc("TC-029", async () => {
    const r = await http("POST", "/api/comptes/00000000-0000-0000-0000-000000000000/retrait", { montant: 1000 });
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-030", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 1000 });
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 5000 });
    return (r.status === 400 && /insuffisant/i.test(r.data.message)) || `status=${r.status}`;
  });

  await tc("TC-031", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 5000 });
    return (r.status === 200 && r.data.donnees.solde === "0.00 FCFA") || `solde=${r.data.donnees?.solde}`;
  });

  await tc("TC-032", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: -500 });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-033", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 0 });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-034", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, {});
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-035", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: "abc" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-036", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 1000 });
    await http("POST", `/api/comptes/${id}/retrait`, { montant: 500 });
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 500 });
    return (r.data.donnees.solde === "0.00 FCFA") || `solde=${r.data.donnees?.solde}`;
  });

  await tc("TC-037", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 100 });
    return (r.status === 400 && /insuffisant/i.test(r.data.message)) || `status=${r.status}`;
  });

  // --- 8.8 Historique ---
  await tc("TC-038", async () => {
    const id = await creerCompte();
    const r = await http("GET", `/api/comptes/${id}/transactions`);
    return (r.status === 200 && Array.isArray(r.data.donnees) && r.data.donnees.length === 0)
      || `len=${r.data.donnees?.length}`;
  });

  await tc("TC-039", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    const r = await http("GET", `/api/comptes/${id}/transactions`);
    return (r.data.donnees.length === 1 && r.data.donnees[0].type === "depot") || `len=${r.data.donnees?.length}`;
  });

  await tc("TC-040", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    await http("POST", `/api/comptes/${id}/retrait`, { montant: 1000 });
    const r = await http("GET", `/api/comptes/${id}/transactions`);
    const types = r.data.donnees.map((t) => t.type);
    return (r.data.donnees.length === 2 && types.includes("depot") && types.includes("retrait"))
      || `types=${types}`;
  });

  await tc("TC-041", async () => {
    const r = await http("GET", "/api/comptes/00000000-0000-0000-0000-000000000000/transactions");
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-042", async () => {
    const idA = await creerCompte("A", "A");
    const idB = await creerCompte("B", "B");
    await http("POST", `/api/comptes/${idA}/depot`, { montant: 5000 });
    const r = await http("GET", `/api/comptes/${idB}/transactions`);
    return (r.data.donnees.length === 0) || `B.len=${r.data.donnees?.length}`;
  });

  await tc("TC-043", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 1500 });
    const r = await http("GET", `/api/comptes/${id}/transactions`);
    const t = r.data.donnees[0];
    return (/^\d+\.\d{2} FCFA$/.test(t.montant) && typeof t.date === "string" && t.date.length > 0)
      || `montant=${t?.montant}`;
  });

  // --- 8.9 Suppression ---
  await tc("TC-047", async () => {
    const id = await creerCompte("Del", "Test");
    const r = await http("DELETE", `/api/comptes/${id}`);
    return (r.status === 200 && r.data.succes === true && r.data.donnees.compteSupprime === id)
      || `status=${r.status}`;
  });

  await tc("TC-048", async () => {
    const r = await http("DELETE", "/api/comptes/00000000-0000-0000-0000-000000000000");
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-049", async () => {
    const id = await creerCompte("Del", "List");
    await http("DELETE", `/api/comptes/${id}`);
    const r = await http("GET", `/api/comptes/${id}`);
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-050", async () => {
    const id = await creerCompte("Del", "Cascade");
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    await http("POST", `/api/comptes/${id}/retrait`, { montant: 1000 });
    const r = await http("DELETE", `/api/comptes/${id}`);
    return (r.status === 200 && r.data.donnees.transactionsSupprimees === 2)
      || `supprimees=${r.data.donnees?.transactionsSupprimees}`;
  });

  // --- 8.10 Bout-en-bout ---
  await tc("TC-044", async () => {
    const id = await creerCompte("E2E", "Test");
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    await http("POST", `/api/comptes/${id}/retrait`, { montant: 2000 });
    const compte = await http("GET", `/api/comptes/${id}`);
    const hist = await http("GET", `/api/comptes/${id}/transactions`);
    return (compte.data.donnees.solde === "3000.00 FCFA" && hist.data.donnees.length === 2)
      || `solde=${compte.data.donnees?.solde} hist=${hist.data.donnees?.length}`;
  });

  await tc("TC-045", async () => {
    const proms = Array.from({ length: 5 }, (_, i) =>
      http("POST", "/api/comptes", { nom: `P${i}`, prenom: `P${i}` })
    );
    const rs = await Promise.all(proms);
    const ids = rs.map((r) => r.data.donnees?.id);
    const uniques = new Set(ids).size === 5;
    return (rs.every((r) => r.status === 201) && uniques) || "ids non uniques ou erreur";
  });

  await tc("TC-046", async () => {
    const id = await creerCompte();
    await Promise.all([
      http("POST", `/api/comptes/${id}/depot`, { montant: 1000 }),
      http("POST", `/api/comptes/${id}/depot`, { montant: 1000 }),
    ]);
    const r = await http("GET", `/api/comptes/${id}`);
    return (r.data.donnees.solde === "2000.00 FCFA") || `solde=${r.data.donnees?.solde}`;
  });

  // --- Rapport ---
  const nbPass = Object.values(results).filter((s) => s === "Pass").length;
  const nbFail = Object.keys(results).length - nbPass;
  console.log(`\nTotal : ${nbPass} Pass / ${nbFail} Fail sur ${Object.keys(results).length} tests exécutés.`);

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE_URL, results, summary: { pass: nbPass, fail: nbFail } }, null, 2)
  );
  console.log(`Rapport JSON : ${REPORT_PATH}`);

  // --- Mise à jour du cahier des charges ---
  let md = fs.readFileSync(MD_PATH, "utf-8");
  for (const [id, status] of Object.entries(results)) {
    const short = status === "Pass" ? "Pass" : "Fail";
    // Remplace la dernière cellule (Not Executed / Pass / Fail) sur la ligne contenant | TC-XXX |
    const re = new RegExp(`(\\|\\s*${id}\\s*\\|[^\\n]*\\|\\s*)(Not Executed|Pass|Fail)(\\s*\\|)`, "g");
    md = md.replace(re, `$1${short}$3`);
  }

  // Mise à jour de la synthèse
  const synth = `- **Nombre total de cas de tests** : 46\n- **Exécutés** : ${Object.keys(results).length} / 46\n- **Pass** : ${nbPass}\n- **Fail** : ${nbFail}\n- **API testée** : ${BASE_URL}\n- **Date d'exécution** : ${new Date().toLocaleString("fr-FR")}\n- **Couverture** : defensive (normale + anormale), limites, integration`;
  md = md.replace(
    /- \*\*Nombre total de cas de tests\*\* : 46\s*\n- \*\*Couverture\*\*[^\n]*\n- \*\*Types d'erreurs testees\*\*[^\n]*/,
    synth + "\n- **Types d'erreurs testees** : syntaxiques, logiques, semantiques, limites"
  );

  fs.writeFileSync(MD_PATH, md, "utf-8");
  console.log(`Cahier des charges mis à jour : ${MD_PATH}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
