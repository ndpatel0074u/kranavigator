import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging helper
const log = (msg, isError = false) => {
  const timestamp = new Date().toISOString();
  const prefix = isError ? "[ERROR]" : "[INFO]";
  const output = `${timestamp} ${prefix} ${msg}`;
  console.log(output);
  
  // Also write to logs directory if running on App Service
  try {
    const logsDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.appendFileSync(path.join(logsDir, "server.log"), output + "\n");
  } catch (e) {
    // Silent fail if we can't write logs
  }
};

try {
  log("=== KRA Navigator Server Starting ===");
  log(`Current working directory: ${process.cwd()}`);
  log(`Script directory: ${__dirname}`);
  log(`Node version: ${process.version}`);
  log(`Node environment: ${process.env.NODE_ENV || "not set"}`);

  const app = express();
  
  // Determine port
  const port = process.env.PORT || 8080;
  const host = process.env.HOST || "127.0.0.1";
  
  log(`Target host: ${host}`);
  log(`Target port: ${port}`);

  // Try multiple possible locations for the dist folder
  let distClientPath;
  const possiblePaths = [
    path.join(__dirname, "dist", "client"),
    path.join(__dirname, "..", "dist", "client"),
    path.join(process.cwd(), "dist", "client"),
    "/home/site/wwwroot/dist/client"
  ];

  for (const checkPath of possiblePaths) {
    if (fs.existsSync(checkPath)) {
      distClientPath = checkPath;
      log(`Found dist/client at: ${distClientPath}`);
      break;
    }
  }

  if (!distClientPath) {
    log(`ERROR: dist/client not found in any location:`, true);
    possiblePaths.forEach(p => log(`  - ${p} (exists: ${fs.existsSync(p)})`));
    
    log("Available directories in __dirname:", true);
    try {
      const files = fs.readdirSync(__dirname);
      files.forEach(f => log(`  - ${f}`));
    } catch (e) {
      log(`  Could not list directory: ${e.message}`, true);
    }
    
    // Serve error page
    app.get("*", (req, res) => {
      res.status(500).send(
        "<h1>Application Error</h1>" +
        "<p>dist/client directory not found. Please rebuild the application.</p>" +
        "<pre>" + possiblePaths.join("\n") + "</pre>"
      );
    });
  } else {
    log(`Serving static files from: ${distClientPath}`);
    
    // Verify index.html exists
    const indexPath = path.join(distClientPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      log(`WARNING: index.html not found at ${indexPath}`, true);
    } else {
      log(`✓ index.html found`);
    }

    // Serve static files
    app.use(express.static(distClientPath, {
      maxAge: "1h",
      etag: false,
      index: ["index.html"]
    }));

    // SPA routing - fallback to index.html
    app.get("*", (req, res) => {
      const file = path.join(distClientPath, "index.html");
      if (fs.existsSync(file)) {
        res.sendFile(file);
      } else {
        res.status(404).send("index.html not found");
      }
    });
  }

  const server = app.listen(port, host, () => {
    log(`🚀 Server listening on ${host}:${port}`);
    log("=== Server Ready ===");
  });

  // Error handling
  server.on("error", (err) => {
    log(`Server error: ${err.message}`, true);
    log(err.stack, true);
    process.exit(1);
  });

  process.on("uncaughtException", (err) => {
    log(`Uncaught exception: ${err.message}`, true);
    log(err.stack, true);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    log(`Unhandled rejection at ${promise}: ${reason}`, true);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    log("SIGTERM received - shutting down gracefully...");
    server.close(() => {
      log("Server closed");
      process.exit(0);
    });
  });

} catch (err) {
  console.error("Fatal error during startup:", err);
  process.exit(1);
}



