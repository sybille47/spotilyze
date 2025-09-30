import { useState } from "react";

function App() {
  const [status, setStatus] = useState<string>("");
  const [uploadState, setUploadState] = useState();

  const testConnection = async () => {
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setStatus(`✅ ${data.message}`);
    } catch (error) {
      setStatus("❌ Failed to connect to API");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🎵 Spotilyze</h1>
      <p>Upload your Spotify streaming history to get insights!</p>

      <button onClick={testConnection} style={{ padding: "0.5rem 1rem", marginRight: "1rem" }}>
        Test API Connection
      </button>

      {status && <p>{status}</p>}
    </div>
  );
}

export default App;
