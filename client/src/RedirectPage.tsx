import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./RedirectPage.css";

function RedirectPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        const response = await fetch(`/api/urls/${shortCode}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Short URL not found");
          } else {
            setError("An error occurred");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();

        // Rediriger vers l'URL originale
        window.location.href = data.originalUrl;
      } catch (err) {
        setError("Failed to load URL");
        setLoading(false);
      }
    };

    if (shortCode) {
      fetchAndRedirect();
    }
  }, [shortCode]);

  if (loading) {
    return (
      <div className="redirect-container">
        <div className="redirect-loading">
          <div className="spinner"></div>
          <h2>Redirecting...</h2>
          <p>Please wait while we redirect you to your destination.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="redirect-container">
        <div className="redirect-error">
          <h1>404</h1>
          <h2>{error}</h2>
          <p>
            The short URL <code>/{shortCode}</code> does not exist or has
            expired.
          </p>
          <button onClick={() => navigate("/")} className="home-btn">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default RedirectPage;
