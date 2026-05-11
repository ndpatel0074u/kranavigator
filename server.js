import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve client files
const clientPath = join(__dirname, "dist/client");
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
    res.status(404).send("Application not found. Please rebuild.");
  }
});

app.listen(port, () => {
  console.log(`🚀 KRA Navigator running at http://localhost:${port}`);
  console.log(`Serving from: ${clientPath}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});


