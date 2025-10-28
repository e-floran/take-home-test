export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateUrl(urlString: string): string {
  // Vérifier que l'URL n'est pas vide
  if (!urlString || typeof urlString !== "string") {
    throw new ValidationError("URL is required");
  }

  // Trim whitespace
  const trimmedUrl = urlString.trim();

  if (trimmedUrl.length === 0) {
    throw new ValidationError("URL cannot be empty");
  }

  // Vérifier le format avec la classe URL native
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new ValidationError("Invalid URL format");
  }

  // Accepter uniquement http et https
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ValidationError("URL must use http or https protocol");
  }

  // Vérifier qu'il y a bien un hostname
  if (!parsedUrl.hostname) {
    throw new ValidationError("URL must have a valid hostname");
  }

  return trimmedUrl;
}
