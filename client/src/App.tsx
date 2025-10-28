import { useState } from "react";
import "./App.css";

interface ShortenedUrl {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
}

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ShortenedUrl | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError("");
    setResult(null);

    // Validation côté client
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to shorten URL");
      }

      setResult(data);
      setUrl(""); // Clear input on success
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result.shortUrl);
        alert("Copied to clipboard!");
      } catch (err) {
        alert("Failed to copy");
      }
    }
  };

  return (
    <div className="container">
      <h1>URL Shortener</h1>
      <p>Transform your long URLs into short, shareable links.</p>

      <form onSubmit={handleSubmit} className="form">
        <div className="input-group">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your long URL here..."
            className="url-input"
            disabled={loading}
          />
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Shortening..." : "Shorten"}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result-card">
          <h3>✓ URL Shortened Successfully!</h3>

          <div className="result-item">
            <label>Short URL:</label>
            <div className="url-display">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {result.shortUrl}
              </a>
              <button onClick={copyToClipboard} className="copy-btn">
                Copy
              </button>
            </div>
          </div>

          <div className="result-item">
            <label>Original URL:</label>
            <div className="url-text">{result.originalUrl}</div>
          </div>

          <div className="result-item">
            <label>Created:</label>
            <div className="url-text">
              {new Date(result.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
