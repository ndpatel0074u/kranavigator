import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("=== KRA Navigator Server Starting ===");
console.log(`Current directory: ${process.cwd()}`);
console.log(`Script directory: ${__dirname}`);

const app = express();
const port = process.env.PORT || 8080;

// Serve client files
const clientPath = join(__dirname, "dist/client");
console.log(`Looking for client files at: ${clientPath}`);

// Check if dist/client exists
if (!fs.existsSync(clientPath)) {
  console.error(`ERROR: dist/client not found at ${clientPath}`);
  console.error("Available directories:");
  try {
    const files = fs.readdirSync(__dirname);
    files.forEach(f => console.error(`  - ${f}`));
  } catch (e) {
    console.error(`  - Could not list directory: ${e.message}`);
  }
}

app.use(express.static(clientPath, {
  maxAge: "1h",
  etag: false
}));

// SPA routing - fallback to index.html for non-existent routes
app.get("*", (req, res) => {
  const indexPath = join(clientPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`index.html not found at ${indexPath}`);
    res.status(404).send("Application not found. Please rebuild.");
  }
});

app.listen(port, () => {
  console.log(`🚀 KRA Navigator running at http://localhost:${port}`);
  console.log(`Serving from: ${clientPath}`);
  console.log("=== Server Ready ===");
});

// Error handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});


