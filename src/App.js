// src/App.js
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import GroceryListPage from "./pages/GroceryListPage";
import RecipesPage from "./pages/RecipesPage";

export default function App() {
  const { user, signIn, logOut } = useAuth();
  const [page, setPage] = useState("lists");

  if (user === undefined) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #1aaae0 0%, #0d6e9a 100%)"
      }}>
        <div style={{ fontSize: 48 }}>🛒</div>
      </div>
    );
  }

  if (!user) return <LoginPage onSignIn={signIn} />;

  if (page === "recipes") {
    return <RecipesPage user={user} onNavigate={setPage} activePage={page} />;
  }

  return <GroceryListPage user={user} onLogOut={logOut} onNavigate={setPage} activePage={page} />;
}
