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
  const { lists, acceptInvite } = useLists(user);
  const [activeListId, setActiveListId] = useState(null);
  const [inviteError, setInviteError] = useState(null);

  useEffect(() => {
    if (!activeListId && lists.length > 0) setActiveListId(lists[0].id);
  }, [lists, activeListId]);

  // Handle ?invite=CODE in the URL — stash it if not yet signed in
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (!code) return;
    // Clean URL immediately so it doesn't persist on refresh
    window.history.replaceState({}, "", window.location.pathname);
    if (!user) {
      sessionStorage.setItem("pendingInvite", code);
    }
  }, []); // eslint-disable-line

  // Accept invite once the user is signed in
  useEffect(() => {
    if (!user) return;
    const code = sessionStorage.getItem("pendingInvite");
    if (!code) return;
    sessionStorage.removeItem("pendingInvite");

    acceptInvite(code)
      .then((listId) => {
        setActiveListId(listId);
        setPage("lists");
      })
      .catch((err) => {
        setInviteError(err.message || "Could not accept invite.");
      });
  }, [user]); // eslint-disable-line

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

  return (
    <ErrorBoundary>
      {inviteError && (
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,
          background:"#c0392b",color:"#fff",padding:"12px 16px",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          fontSize:14,fontWeight:600}}>
          <span>Invite error: {inviteError}</span>
          <button onClick={() => setInviteError(null)}
            style={{background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",padding:0}}>
            ✕
          </button>
        </div>
      )}
      {page === "recipes" && (
        <RecipesPage user={user} onNavigate={setPage} activePage={page} activeListId={activeListId} />
      )}
      {page === "meal plan" && (
        <MealPlanPage user={user} onNavigate={setPage} activePage={page} />
      )}
      {page !== "recipes" && page !== "meal plan" && (
        <GroceryListPage user={user} onLogOut={logOut} onNavigate={setPage} activePage={page}
          activeListId={activeListId} onListChange={setActiveListId} />
      )}
    </ErrorBoundary>
  );
}
