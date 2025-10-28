import express from "express";
import { UrlService } from "../services/UrlService.js";
import { ValidationError } from "../utils/validation.js";

export function createUrlRoutes(urlService: UrlService) {
  const router = express.Router();

  // Créer une URL raccourcie
  router.post("/urls", (req, res) => {
    try {
      const { url } = req.body;

      // Validation
      if (!url) {
        return res.status(400).json({
          error: "URL is required",
        });
      }

      const entry = urlService.createShortUrl(url);

      // Construire l'URL complète
      const protocol = req.protocol;
      const host = req.get("host");
      const shortUrl = `${protocol}://${host}/${entry.shortCode}`;

      res.status(201).json({
        shortCode: entry.shortCode,
        shortUrl,
        originalUrl: entry.originalUrl,
        createdAt: entry.createdAt,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error creating short URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Récupérer les infos d'une URL (optionnel, pour stats)
  router.get("/urls/:shortCode", (req, res) => {
    const { shortCode } = req.params;
    const entry = urlService.getUrlInfo(shortCode);

    if (!entry) {
      return res.status(404).json({
        error: "Short URL not found",
      });
    }

    res.json({
      shortCode: entry.shortCode,
      originalUrl: entry.originalUrl,
      createdAt: entry.createdAt,
      clicks: entry.clicks,
    });
  });

  return router;
}
