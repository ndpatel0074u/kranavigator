import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const clientPath = path.join(__dirname, "dist", "client");

console.log("[SERVER] Starting...");
console.log(`[SERVER] __dirname: ${__dirname}`);
console.log(`[SERVER] clientPath: ${clientPath}`);
console.log(`[SERVER] PORT: ${port}`);

// Verify dist/client exists
if (!fs.existsSync(clientPath)) {
  console.error(`[ERROR] dist/client directory not found at ${clientPath}`);
  console.error(`[ERROR] Current working directory: ${process.cwd()}`);
  console.error(`[ERROR] Contents of ${__dirname}:`);
  try {
    const contents = fs.readdirSync(__dirname);
    console.error(contents);
  } catch (e) {
    console.error(e);
  }
  process.exit(1);
}

console.log(`[SERVER] ✅ dist/client verified`);

// Log what files are in dist/client
try {
  const clientFiles = fs.readdirSync(clientPath);
  console.log(`[SERVER] dist/client contains: ${clientFiles.join(", ")}`);
} catch (e) {
  console.error(`[ERROR] Failed to read dist/client: ${e.message}`);
}

// Serve all static files
app.use(express.static(clientPath, {
  maxAge: "1h",
  etag: false,
  dotfiles: "ignore"
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// SPA catch-all: serve index.html for all other routes
app.get("*", (req, res) => {
  const indexPath = path.join(clientPath, "index.html");
  console.log(`[REQUEST] GET ${req.path} -> serving ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[ERROR] Failed to send ${indexPath}: ${err.message}`);
      res.status(404).send("Not found");
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] Express error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`[SERVER] ✅ Server listening on port ${port}`);
  console.log(`[SERVER] Ready to serve requests`);
});

process.on("SIGTERM", () => {
  console.log("[SERVER] SIGTERM received - shutting down gracefully...");
  server.close(() => {
    console.log("[SERVER] Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[SERVER] SIGINT received - shutting down gracefully...");
  server.close(() => {
    console.log("[SERVER] Server closed");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  console.error(`[FATAL] Uncaught exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(`[FATAL] Unhandled rejection at: ${promise}, reason: ${reason}`);
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




