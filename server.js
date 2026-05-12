import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const clientPath = path.join(__dirname, "dist", "client");

// Verify dist/client exists
if (!fs.existsSync(clientPath)) {
  console.error(`ERROR: dist/client directory not found at ${clientPath}`);
  process.exit(1);
}

console.log(`✅ Starting server on port ${port}`);
console.log(`📁 Serving from: ${clientPath}`);

// Serve all static files (CSS, JS, etc)
app.use(express.static(clientPath, {
  maxAge: "1h",
  etag: false
}));

// SPA catch-all: serve index.html for all routes without file extensions
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).send("Internal Server Error");
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 KRA Navigator is ready!`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received - shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Fatal error:", err);
  process.exit(1);
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




