// src/pages/LoginPage.jsx
export default function LoginPage({ onSignIn }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #1aaae0 0%, #0d6e9a 100%)",
      fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: 24
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "40px 32px",
        width: "100%", maxWidth: 360, textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
      }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🛒</div>
        <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#1a1a2e" }}>
          FoodList
        </h1>
        <p style={{ margin: "0 0 32px", color: "#888", fontSize: 14 }}>
          Your shared grocery & meal planner
        </p>

        <button
          onClick={onSignIn}
          style={{
            width: "100%", padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            background: "#fff", border: "1.5px solid #e0e0e0",
            borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 600,
            color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "box-shadow 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.14)"}
          onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ marginTop: 20, fontSize: 12, color: "#bbb" }}>
          Sign in with the same Google account on both phones to share the list instantly.
        </p>
      </div>
    </div>
  );
}
