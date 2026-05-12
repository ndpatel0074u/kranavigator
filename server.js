import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { readdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const clientPath = path.join(__dirname, "dist", "client");

if (!fs.existsSync(clientPath)) {
  console.error(`ERROR: dist/client not found at ${clientPath}`);
  process.exit(1);
}

// Get CSS and JS files from dist/client
function getAssets() {
  const files = readdirSync(clientPath);
  const styles = files.filter(f => f.endsWith('.css'));
  const scripts = files.filter(f => f.endsWith('.js') && !f.startsWith('.'));
  return { styles, scripts };
}

const { styles, scripts } = getAssets();

console.log(`📁 Serving from: ${clientPath}`);
console.log(`📄 Found ${styles.length} CSS files, ${scripts.length} JS files`);

// Serve static assets
app.use(express.static(clientPath, {
  maxAge: "1h",
  etag: false,
  index: false
}));

// Generate HTML with injected script/link tags
function generateHTML() {
  let html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KRA Navigator</title>
`;
  
  // Inject CSS links
  styles.forEach(style => {
    html += `    <link rel="stylesheet" href="/${style}" />\n`;
  });
  
  html += `  </head>
  <body>
    <div id="app"></div>
`;
  
  // Inject script tags in order
  scripts.forEach(script => {
    html += `    <script type="module" src="/${script}"></script>\n`;
  });
  
  html += `  </body>
</html>`;
  return html;
}

// SPA routing - send index.html for all non-file requests
app.get("*", (req, res) => {
  // Check if it's requesting a file (has extension)
  if (path.extname(req.path)) {
    res.status(404).send("Not found");
    return;
  }
  
  res.type("html").send(generateHTML());
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).send("Internal Server Error");
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`✅ KRA Navigator listening on port ${port}`);
  console.log(`🌐 Open: http://localhost:${port}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received - shutting down...");
  server.close();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});




