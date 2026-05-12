import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Find dist/client directory
const clientPath = path.join(__dirname, "dist", "client");

if (!fs.existsSync(clientPath)) {
  console.error(`ERROR: dist/client not found at ${clientPath}`);
  console.error(`Current directory: ${process.cwd()}`);
  console.error(`Script directory: ${__dirname}`);
  process.exit(1);
}

console.log(`Serving static files from: ${clientPath}`);

// Serve static files
app.use(express.static(clientPath, {
  maxAge: "1h",
  etag: false,
  index: ["index.html"]
}));

// SPA routing - send index.html for all non-file requests
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).send("Internal Server Error");
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`✅ KRA Navigator listening on port ${port}`);
  console.log(`📁 Serving from: ${clientPath}`);
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




