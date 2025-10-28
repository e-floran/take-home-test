import { UrlStore } from "./UrlStore.js";
import { UrlEntry } from "../models/UrlEntry.js";
import { validateUrl } from "../utils/validation.js";
import { encodeBase62 } from "../utils/base62.js";

export class UrlService {
  private store: UrlStore;

  constructor(store: UrlStore) {
    this.store = store;
  }

  createShortUrl(originalUrl: string): UrlEntry {
    // Validation (lance une exception si invalide)
    const validatedUrl = validateUrl(originalUrl);

    // Générer le code court
    const nextId = this.store.getNextId();
    const shortCode = encodeBase62(nextId);

    // Sauvegarder
    return this.store.save(shortCode, validatedUrl);
  }

  getUrlInfo(shortCode: string): UrlEntry | undefined {
    return this.store.find(shortCode);
  }

  incrementClicks(shortCode: string): void {
    this.store.incrementClicks(shortCode);
  }
}
