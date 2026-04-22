const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const mdPath = path.join(ROOT, "CAHIER_DES_CHARGES.md");
const htmlPath = path.join(ROOT, "CAHIER_DES_CHARGES.html");
const pdfPath = path.join(ROOT, "CAHIER_DES_CHARGES.pdf");

async function main() {
  const { marked } = await import("marked");
  const md = fs.readFileSync(mdPath, "utf-8");
  const bodyHtml = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Cahier des charges - NYAJ Banking API</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Arial, sans-serif;
    color: #1f2937;
    line-height: 1.55;
    font-size: 11pt;
    max-width: 100%;
  }
  h1, h2, h3, h4 { color: #0f3d8a; page-break-after: avoid; }
  h1 { font-size: 22pt; border-bottom: 3px solid #0f3d8a; padding-bottom: 6px; margin-top: 0; }
  h2 { font-size: 16pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 22px; }
  h3 { font-size: 13pt; margin-top: 18px; }
  h4 { font-size: 11.5pt; margin-top: 14px; }
  p { margin: 6px 0; }
  code {
    background: #f1f5f9;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9.5pt;
    color: #0f3d8a;
  }
  pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 10px 12px;
    border-radius: 5px;
    font-size: 9pt;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  pre code { background: transparent; color: inherit; padding: 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0;
    font-size: 9.5pt;
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; background: #0f3d8a; color: #fff; }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 5px 7px;
    text-align: left;
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  hr { border: none; border-top: 1px solid #cbd5e1; margin: 18px 0; }
  ul, ol { margin: 6px 0 6px 20px; }
  li { margin: 2px 0; }
  strong { color: #0f3d8a; }
  .footer {
    text-align: center;
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 30px;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
  }
</style>
</head>
<body>
${bodyHtml}
<div class="footer">
  NYAJ Banking API - Cahier des charges - Genere le ${new Date().toLocaleDateString("fr-FR")}
</div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html, "utf-8");
  console.log(`HTML genere : ${htmlPath}`);

  try {
    execSync(
      `google-chrome --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" --no-pdf-header-footer "file://${htmlPath}"`,
      { stdio: "inherit" }
    );
    console.log(`PDF genere : ${pdfPath}`);
  } catch (err) {
    console.error("Echec generation PDF :", err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
