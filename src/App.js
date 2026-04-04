// src/App.js
import { useState, useEffect, Component } from "react";
import { useAuth } from "./hooks/useAuth";
import { useLists } from "./hooks/useLists";
import LoginPage from "./pages/LoginPage";
import GroceryListPage from "./pages/GroceryListPage";
import RecipesPage from "./pages/RecipesPage";
import MealPlanPage from "./pages/MealPlanPage";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error?.message || String(this.state.error);
    const stack = this.state.error?.stack || "";
    return (
      <div style={{minHeight:"100vh",background:"#1a1a2e",color:"#fff",
        padding:24,fontFamily:"monospace",fontSize:13,overflowY:"auto"}}>
        <div style={{fontSize:22,marginBottom:12}}>💥 App Error</div>
        <div style={{background:"#c0392b",padding:"10px 14px",borderRadius:8,marginBottom:16,
          fontWeight:700,fontSize:14,lineHeight:1.5}}>
          {msg}
        </div>
        <pre style={{background:"rgba(255,255,255,0.07)",padding:14,borderRadius:8,
          whiteSpace:"pre-wrap",wordBreak:"break-all",fontSize:11,lineHeight:1.6,
          maxHeight:"60vh",overflowY:"auto"}}>
          {stack}
        </pre>
        <button onClick={() => window.location.reload()}
          style={{marginTop:20,padding:"12px 24px",background:"#1aaae0",color:"#fff",
            border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"}}>
          Reload
        </button>
      </div>
    );
  }
}

export default function App() {
  const { user, signIn, logOut } = useAuth();
  const [page, setPage] = useState("lists");
  const { lists } = useLists();
  const [activeListId, setActiveListId] = useState(null);

  useEffect(() => {
    if (!activeListId && lists.length > 0) setActiveListId(lists[0].id);
  }, [lists, activeListId]);

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
    return <RecipesPage user={user} onNavigate={setPage} activePage={page} activeListId={activeListId} />;
  }

  if (page === "meal plan") {
    return <MealPlanPage user={user} onNavigate={setPage} activePage={page} />;
  }

  return (
    <ErrorBoundary>
      <GroceryListPage user={user} onLogOut={logOut} onNavigate={setPage} activePage={page}
        activeListId={activeListId} onListChange={setActiveListId} />
    </ErrorBoundary>
  );
}
