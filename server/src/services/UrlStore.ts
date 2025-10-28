import { UrlEntry } from "../models/UrlEntry.js";

export class UrlStore {
  private urls: Map<string, UrlEntry> = new Map();
  private counter: number = 0;

  save(shortCode: string, originalUrl: string): UrlEntry {
    const entry: UrlEntry = {
      originalUrl,
      shortCode,
      createdAt: new Date(),
      clicks: 0,
    };
    this.urls.set(shortCode, entry);
    return entry;
  }

  find(shortCode: string): UrlEntry | undefined {
    return this.urls.get(shortCode);
  }

  incrementClicks(shortCode: string): void {
    const entry = this.urls.get(shortCode);
    if (entry) {
      entry.clicks++;
    }
  }

  getNextId(): number {
    return ++this.counter;
  }

  // Utile pour debug
  getCount(): number {
    return this.urls.size;
  }
}
