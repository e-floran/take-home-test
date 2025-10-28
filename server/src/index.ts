import express from "express";
import cors from "cors";
import { UrlStore } from "./services/UrlStore.js";
import { UrlService } from "./services/UrlService.js";
import { createUrlRoutes } from "./routes/urls.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const urlStore = new UrlStore();
const urlService = new UrlService(urlStore);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// API routes
app.use("/api", createUrlRoutes(urlService));

// Redirection route (IMPORTANT : doit être après /api mais avant tout catch-all)
app.get("/:shortCode", (req, res) => {
  const { shortCode } = req.params;
  const entry = urlService.getUrlInfo(shortCode);

  if (!entry) {
    return res.status(404).send("Short URL not found");
  }

  // Incrémenter les clics
  urlService.incrementClicks(shortCode);

  // 302 = temporaire, plus flexible pour le développement
  res.redirect(302, entry.originalUrl);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
