// src/pages/RecipesPage.jsx
import { useState } from "react";
import { useRecipes } from "../hooks/useRecipes";
import { useGroceryList } from "../hooks/useGroceryList";
import { guessCategory } from "../lib/categories";

// ── URL Import helpers ─────────────────────────────────────

function parseDuration(iso) {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h ` : "";
  const m = match[2] ? `${match[2]} min` : "";
  return (h + m).trim();
}

function findRecipeInJsonLd(data) {
  if (!data) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findRecipeInJsonLd(item);
      if (r) return r;
    }
  }
  const type = data["@type"];
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) return data;
  if (data["@graph"]) return findRecipeInJsonLd(data["@graph"]);
  return null;
}

function flattenInstructions(instructions) {
  const steps = [];
  for (const item of (instructions || [])) {
    if (typeof item === "string") {
      if (item.trim()) steps.push(item.trim());
    } else if (item["@type"] === "HowToStep" || (item.text && !item.itemListElement)) {
      const text = item.text || item.name || "";
      if (text.trim()) steps.push(text.trim());
    } else if (item.itemListElement) {
      // HowToSection — skip the heading, recurse into nested steps
      steps.push(...flattenInstructions(item.itemListElement));
    } else {
      const text = item.text || "";
      if (text.trim()) steps.push(text.trim());
    }
  }
  return steps;
}

function parseRecipeJsonLd(recipe, sourceUrl) {
  const photos = recipe.image;
  const photoUrl = Array.isArray(photos)
    ? (typeof photos[0] === "string" ? photos[0] : photos[0]?.url || "")
    : (typeof photos === "string" ? photos : photos?.url || "");

  const ingredients = (recipe.recipeIngredient || []).map(s => {
    s = s.trim();
    // Parse leading quantity: mixed numbers (2 1/4), fractions (1/2), decimals (1.5), integers (4)
    const m = s.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?(?:\/\d+)?)\s*/);
    if (m) return { qty: m[1].trim(), name: s.slice(m[0].length).trim(), note: "" };
    return { qty: "", name: s, note: "" };
  });

  const steps = flattenInstructions(recipe.recipeInstructions);

  let servings = recipe.recipeYield || "";
  if (Array.isArray(servings)) servings = servings[0];

  return {
    name: recipe.name || "",
    source: sourceUrl,
    photoUrl: photoUrl || "",
    rating: 0,
    prepTime: parseDuration(recipe.prepTime),
    cookTime: parseDuration(recipe.cookTime || recipe.totalTime),
    servings: String(servings),
    ingredients: ingredients.length ? ingredients : [{ qty: "", name: "", note: "" }],
    steps: steps.length ? steps : [""],
    notes: recipe.description || "",
  };
}

// Parse WPRM ingredient HTML, preferring the metric (unit-system-2) container when present.
// WPRM renders both unit systems in the HTML (one hidden); we pick metric first.
// Returns null if no WPRM ingredient elements are found.
function parseWprmIngredients(doc) {
  // WPRM wraps each unit system in a block with a class like
  // "wprm-recipe-block-container-columns-unit-system-2".
  // Prefer that (metric) container; fall back to the unit-system-1 container,
  // then fall back to any ingredient list.  Scoping the query to a specific
  // container also avoids duplicates when both systems are rendered.
  const metricContainer  = doc.querySelector("[class*='unit-system-2']");
  const primaryContainer = doc.querySelector("[class*='unit-system-1']");
  const container = metricContainer ?? primaryContainer ?? doc;

  const items = container.querySelectorAll("li.wprm-recipe-ingredient");
  if (!items.length) return null;

  return Array.from(items).map(li => {
    const amountEl = li.querySelector(".wprm-recipe-ingredient-amount");
    const unitEl   = li.querySelector(".wprm-recipe-ingredient-unit");
    const nameEl   = li.querySelector(".wprm-recipe-ingredient-name");
    const notesEl  = li.querySelector(".wprm-recipe-ingredient-notes, .wprm-recipe-ingredient-comment");

    const qty  = (amountEl?.textContent || "").trim();
    const unit = (unitEl?.textContent   || "").trim();
    const name = (nameEl?.textContent   || "").trim();
    const note = (notesEl?.textContent  || "").trim();

    const fullName = [unit, name].filter(Boolean).join(" ");
    return { qty, name: fullName, note };
  });
}

async function importRecipeFromUrl(url) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Could not fetch page (HTTP ${res.status})`);
  const html = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const recipe = findRecipeInJsonLd(data);
      if (recipe) {
        const parsed = parseRecipeJsonLd(recipe, url);
        // WPRM HTML gives us pre-split amount/unit/name and metric values;
        // prefer it over the combined JSON-LD ingredient strings.
        const wprmIngredients = parseWprmIngredients(doc);
        if (wprmIngredients?.length) parsed.ingredients = wprmIngredients;
        return parsed;
      }
    } catch {}
  }
  throw new Error("No recipe data found on this page. Try copying the details manually.");
}

// ── Shared styles ──────────────────────────────────────────

const fieldStyle = {
  width: "100%", padding: "10px 14px", fontSize: 15, border: "1.5px solid #e8e8e8",
  borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1,
};

// ── Star Rating ────────────────────────────────────────────

function StarRating({ value, onChange, size = 20 }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n}
          onClick={onChange ? () => onChange(n === value ? 0 : n) : undefined}
          style={{ fontSize: size, cursor: onChange ? "pointer" : "default",
            color: n <= value ? "#f5b100" : "#ddd", userSelect: "none" }}>★</span>
      ))}
    </div>
  );
}

// ── Recipe Card (grid) ─────────────────────────────────────

function RecipeCard({ recipe, onClick }) {
  const hostname = (() => {
    try { return new URL(recipe.source).hostname.replace("www.", ""); } catch { return recipe.source; }
  })();
  return (
    <div onClick={() => onClick(recipe)}
      style={{ background: "#fff", borderRadius: 12, overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.07)", cursor: "pointer" }}>
      <div style={{ height: 130, background: "#e8f4fb", display: "flex",
        alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {recipe.photoUrl
          ? <img src={recipe.photoUrl} alt={recipe.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 48 }}>🍽️</span>}
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 3,
          lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {recipe.name}
        </div>
        {recipe.source && (
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {hostname}
          </div>
        )}
        {recipe.rating > 0 && <StarRating value={recipe.rating} size={12} />}
      </div>
    </div>
  );
}

// ── Recipe Detail ──────────────────────────────────────────

function RecipeDetail({ recipe, onEdit, onDelete, onAddToList }) {
  const [tab, setTab] = useState("ingredients");

  const tabBtn = (t, label) => (
    <button onClick={() => setTab(t)} style={{ flex: 1, padding: "11px 4px", background: "none",
      border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
      color: tab === t ? "#1aaae0" : "#888",
      borderBottom: tab === t ? "2px solid #1aaae0" : "2px solid transparent" }}>
      {label}
    </button>
  );

  const hostname = (() => {
    try { return new URL(recipe.source).hostname.replace("www.", ""); } catch { return recipe.source; }
  })();

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {/* Photo */}
      {recipe.photoUrl
        ? <div style={{ height: 220, overflow: "hidden" }}>
            <img src={recipe.photoUrl} alt={recipe.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        : <div style={{ height: 100, background: "linear-gradient(135deg,#e8f4fb,#c8e8f5)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>🍽️</div>
      }

      <div style={{ background: "#fff", padding: "16px 20px 0" }}>
        {/* Title */}
        <div style={{ fontSize: 21, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.3, marginBottom: 4 }}>
          {recipe.name}
        </div>
        {recipe.source && (
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10 }}>
            {recipe.source.startsWith("http")
              ? <a href={recipe.source} target="_blank" rel="noreferrer"
                  style={{ color: "#1aaae0" }}>{hostname}</a>
              : recipe.source}
          </div>
        )}
        {recipe.rating > 0 && <div style={{ marginBottom: 12 }}><StarRating value={recipe.rating} size={20} /></div>}

        {/* Meta */}
        {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
          <div style={{ display: "flex", borderTop: "1px solid #f0f0f0",
            borderBottom: "1px solid #f0f0f0", padding: "10px 0", marginBottom: 0 }}>
            {[["PREP", recipe.prepTime], ["COOK", recipe.cookTime], ["SERVES", recipe.servings]]
              .filter(([, v]) => v)
              .map(([label, val]) => (
                <div key={label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontSize: 14, color: "#333", marginTop: 3 }}>{val}</div>
                </div>
              ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, padding: "10px 0" }}>
          <button onClick={onEdit}
            style={{ flex: 1, padding: "9px", background: "none", border: "1.5px solid #1aaae0",
              color: "#1aaae0", borderRadius: 10, fontWeight: 700, fontSize: 13,
              cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
          <button onClick={() => { if (window.confirm(`Delete "${recipe.name}"?`)) onDelete(recipe.id); }}
            style={{ flex: 1, padding: "9px", background: "none", border: "1.5px solid #e53935",
              color: "#e53935", borderRadius: 10, fontWeight: 700, fontSize: 13,
              cursor: "pointer", fontFamily: "inherit" }}>🗑️ Delete</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", marginTop: 4 }}>
          {tabBtn("ingredients", "Ingredients")}
          {tabBtn("steps", "Steps")}
          {tabBtn("notes", "Notes")}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ background: "#fff", padding: "16px 20px", minHeight: 160 }}>
        {tab === "ingredients" && (
          <>
            {(recipe.ingredients || []).map((ing, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f5f5f5",
                display: "flex", gap: 14, alignItems: "baseline" }}>
                <div style={{ width: 40, textAlign: "right", fontSize: 14, fontWeight: 700,
                  color: "#333", flexShrink: 0 }}>{ing.qty || "–"}</div>
                <div>
                  <div style={{ fontSize: 15, color: "#1a1a2e" }}>{ing.name}</div>
                  {ing.note && <div style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>{ing.note}</div>}
                </div>
              </div>
            ))}
            {(recipe.ingredients || []).length > 0 && (
              <button onClick={() => onAddToList(recipe)}
                style={{ width: "100%", marginTop: 16, padding: "12px", background: "#e8f6fd",
                  color: "#1aaae0", border: "none", borderRadius: 10, fontWeight: 700,
                  fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                + Add all ingredients to grocery list
              </button>
            )}
          </>
        )}

        {tab === "steps" && (
          (recipe.steps || []).length === 0
            ? <div style={{ color: "#ccc" }}>No steps added.</div>
            : (recipe.steps || []).map((step, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e", marginBottom: 6 }}>
                    Step {i + 1}
                  </div>
                  <div style={{ fontSize: 15, color: "#333", lineHeight: 1.6 }}>{step}</div>
                </div>
              ))
        )}

        {tab === "notes" && (
          <div style={{ fontSize: 15, color: "#333", lineHeight: 1.7 }}>
            {recipe.notes || <span style={{ color: "#ccc" }}>No notes.</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recipe Form ────────────────────────────────────────────

const DEFAULT_FORM = {
  name: "", source: "", photoUrl: "", rating: 0,
  prepTime: "", cookTime: "", servings: "",
  ingredients: [{ qty: "", name: "", note: "" }],
  steps: [""],
  notes: "",
};

function RecipeForm({ initial, onSave, user }) {
  const [form, setForm] = useState(initial || DEFAULT_FORM);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const setIngredient = (i, field, val) =>
    setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, j) => j === i ? { ...ing, [field]: val } : ing) }));
  const addIngredient = () =>
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { qty: "", name: "", note: "" }] }));
  const removeIngredient = i =>
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }));

  const setStep = (i, val) =>
    setForm(f => ({ ...f, steps: f.steps.map((s, j) => j === i ? val : s) }));
  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, ""] }));
  const removeStep = i => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }));

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const data = await importRecipeFromUrl(importUrl.trim());
      setForm(data);
      setShowImport(false);
      setImportUrl("");
    } catch (e) {
      setImportError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ background: "#fff", padding: "16px 20px" }}>

        {/* Import */}
        <button onClick={() => setShowImport(s => !s)}
          style={{ width: "100%", padding: "11px", background: "#e8f6fd", color: "#1aaae0",
            border: "1.5px dashed #1aaae0", borderRadius: 10, fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>
          🔗 Import from website URL
        </button>

        {showImport && (
          <div style={{ background: "#f8fcfe", border: "1.5px solid #c8e8f5", borderRadius: 12,
            padding: "14px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8, lineHeight: 1.5 }}>
              Paste a recipe URL — works with RecipeTinEats, Taste, AllRecipes, and most recipe sites that use schema.org markup.
            </div>
            <input value={importUrl} onChange={e => setImportUrl(e.target.value)}
              placeholder="https://www.recipetineats.com/..."
              onKeyDown={e => e.key === "Enter" && handleImport()}
              style={{ ...fieldStyle, marginBottom: 8 }} />
            {importError && (
              <div style={{ fontSize: 12, color: "#e53935", marginBottom: 8, lineHeight: 1.4 }}>{importError}</div>
            )}
            <button onClick={handleImport} disabled={importing || !importUrl.trim()}
              style={{ width: "100%", padding: "10px", background: importing ? "#c8e8f5" : "#1aaae0",
                color: "#fff", border: "none", borderRadius: 10, fontWeight: 700,
                fontSize: 14, cursor: importing ? "default" : "pointer", fontFamily: "inherit" }}>
              {importing ? "Importing…" : "Import Recipe"}
            </button>
          </div>
        )}

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Recipe Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="e.g. Cast Iron Skillet Salmon"
            style={{ ...fieldStyle, marginTop: 5 }} />
        </div>

        {/* Source */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Source / URL</label>
          <input value={form.source} onChange={e => set("source", e.target.value)}
            placeholder="e.g. RecipeTinEats or https://..."
            style={{ ...fieldStyle, marginTop: 5 }} />
        </div>

        {/* Photo URL */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Photo URL</label>
          <input value={form.photoUrl} onChange={e => set("photoUrl", e.target.value)}
            placeholder="https://..."
            style={{ ...fieldStyle, marginTop: 5 }} />
          {form.photoUrl && (
            <img src={form.photoUrl} alt="" onError={e => { e.target.style.display = "none"; }}
              style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginTop: 8 }} />
          )}
        </div>

        {/* Rating */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Rating</label>
          <div style={{ marginTop: 8 }}>
            <StarRating value={form.rating} onChange={v => set("rating", v)} size={28} />
          </div>
        </div>

        {/* Timing + Servings */}
        <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
          {[["Prep Time", "prepTime", "20 mins"], ["Cook Time", "cookTime", "30 mins"], ["Servings", "servings", "4"]].map(([label, field, ph]) => (
            <div key={field} style={{ flex: 1 }}>
              <label style={labelStyle}>{label}</label>
              <input value={form[field]} onChange={e => set(field, e.target.value)}
                placeholder={ph}
                style={{ ...fieldStyle, marginTop: 5, padding: "10px 8px", fontSize: 13 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div style={{ background: "#fff", padding: "16px 20px", marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={labelStyle}>Ingredients</span>
          <button onClick={addIngredient}
            style={{ background: "none", border: "none", color: "#1aaae0",
              fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1 }}>+</button>
        </div>
        {form.ingredients.map((ing, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
            <input value={ing.qty} onChange={e => setIngredient(i, "qty", e.target.value)}
              placeholder="Qty"
              style={{ ...fieldStyle, width: 56, flexShrink: 0, padding: "10px 6px",
                fontSize: 13, textAlign: "center" }} />
            <input value={ing.name} onChange={e => setIngredient(i, "name", e.target.value)}
              placeholder="Ingredient"
              style={{ ...fieldStyle, flex: 1, fontSize: 14 }} />
            <input value={ing.note} onChange={e => setIngredient(i, "note", e.target.value)}
              placeholder="Note"
              style={{ ...fieldStyle, width: 72, flexShrink: 0, padding: "10px 6px",
                fontSize: 12, color: "#888" }} />
            {form.ingredients.length > 1 && (
              <button onClick={() => removeIngredient(i)}
                style={{ background: "none", border: "none", color: "#ccc",
                  fontSize: 20, cursor: "pointer", padding: "0 2px", flexShrink: 0 }}>×</button>
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div style={{ background: "#fff", padding: "16px 20px", marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={labelStyle}>Steps</span>
          <button onClick={addStep}
            style={{ background: "none", border: "none", color: "#1aaae0",
              fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1 }}>+</button>
        </div>
        {form.steps.map((step, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1aaae0" }}>Step {i + 1}</span>
              {form.steps.length > 1 && (
                <button onClick={() => removeStep(i)}
                  style={{ background: "none", border: "none", color: "#bbb",
                    fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Remove</button>
              )}
            </div>
            <textarea value={step} onChange={e => setStep(i, e.target.value)}
              placeholder={`Describe step ${i + 1}…`} rows={2}
              style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.5 }} />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div style={{ background: "#fff", padding: "16px 20px", marginTop: 10 }}>
        <label style={labelStyle}>Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="Any tips, variations, or extra notes…" rows={3}
          style={{ ...fieldStyle, marginTop: 8, resize: "vertical", lineHeight: 1.5 }} />
      </div>

      {/* Save */}
      <div style={{ padding: "16px 20px 40px" }}>
        <button onClick={handleSave} disabled={saving || !form.name.trim()}
          style={{ width: "100%", padding: "14px",
            background: form.name.trim() ? "#1aaae0" : "#c8e8f5", color: "#fff",
            border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16,
            cursor: form.name.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
          {saving ? "Saving…" : initial?.id ? "Save Changes" : "Add Recipe"}
        </button>
      </div>
    </div>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────

function BottomNav({ activePage, onNavigate }) {
  return (
    <div style={{ display: "flex", background: "#fff", borderTop: "1px solid #e8e8e8",
      position: "sticky", bottom: 0 }}>
      {[["Lists", "☰"], ["Recipes", "🍴"], ["Meal Plan", "📅"], ["Settings", "⚙️"]].map(([tab, icon]) => (
        <button key={tab} onClick={() => onNavigate(tab.toLowerCase())}
          style={{ flex: 1, padding: "10px 4px 8px", background: "none", border: "none",
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 10, fontWeight: 600,
            color: activePage === tab.toLowerCase() ? "#1aaae0" : "#aaa" }}>{tab}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function RecipesPage({ user, onNavigate, activePage }) {
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { addItem, persistedLearned } = useGroceryList();

  const [view, setView] = useState("list"); // "list" | "detail" | "form"
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = recipe => { setSelected(recipe); setView("detail"); };
  const openEdit = () => setView("form");
  const openNew = () => { setSelected(null); setView("form"); };

  const handleBack = () => {
    if (view === "form" && selected?.id) { setView("detail"); return; }
    setView("list");
  };

  const handleDelete = async id => {
    await deleteRecipe(id);
    setView("list");
  };

  const handleSave = async form => {
    if (selected?.id) {
      await updateRecipe(selected.id, form);
      setSelected({ ...selected, ...form });
      setView("detail");
    } else {
      await addRecipe(form, user);
      setView("list");
    }
  };

  const handleAddToList = recipe => {
    (recipe.ingredients || []).forEach(ing => {
      if (!ing.name.trim()) return;
      addItem({
        name: ing.name.trim(),
        category: guessCategory(ing.name, persistedLearned),
        note: ing.qty
          ? `${ing.qty}${ing.note ? ", " + ing.note : ""}`
          : ing.note || "",
        emoji: "",
      }, user);
    });
    onNavigate("lists");
  };

  const title = view === "form"
    ? (selected?.id ? "Edit Recipe" : "New Recipe")
    : view === "detail" ? "Recipe Details" : "Recipes";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f0f2f5",
      fontFamily: "'Helvetica Neue',Arial,sans-serif", display: "flex", flexDirection: "column",
      boxShadow: "0 0 40px rgba(0,0,0,0.08)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1aaae0 0%,#0e8ab8 100%)",
        padding: "16px 16px 14px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {view !== "list" && (
            <button onClick={handleBack}
              style={{ background: "none", border: "none", color: "#fff",
                fontSize: 22, cursor: "pointer", padding: "0 6px 0 0", lineHeight: 1 }}>←</button>
          )}
          <div style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>{title}</div>
          {view === "list" && (
            <>
              <button onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch(""); }}
                style={{ background: "none", border: "none", color: "#fff",
                  fontSize: 20, cursor: "pointer", padding: 4 }}>🔍</button>
              <button onClick={openNew}
                style={{ background: "none", border: "none", color: "#fff",
                  fontSize: 26, cursor: "pointer", padding: 4, lineHeight: 1 }}>+</button>
            </>
          )}
        </div>
        {view === "list" && showSearch && (
          <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
            placeholder="Search recipes…"
            style={{ marginTop: 10, width: "100%", padding: "9px 14px", borderRadius: 20,
              border: "none", fontSize: 14, outline: "none", fontFamily: "inherit",
              boxSizing: "border-box" }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {view === "list" && (
          loading
            ? <div style={{ textAlign: "center", padding: 60, color: "#aaa", fontSize: 15 }}>Loading…</div>
            : filtered.length === 0
              ? <div style={{ textAlign: "center", padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>🍽️</div>
                  <div style={{ color: "#aaa", fontSize: 15 }}>
                    {search ? "No recipes match your search." : "No recipes yet — tap + to add one!"}
                  </div>
                </div>
              : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14 }}>
                  {filtered.map(r => <RecipeCard key={r.id} recipe={r} onClick={openDetail} />)}
                </div>
        )}

        {view === "detail" && selected && (
          <RecipeDetail
            recipe={selected}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAddToList={handleAddToList}
          />
        )}

        {view === "form" && (
          <RecipeForm
            initial={selected?.id ? selected : null}
            onSave={handleSave}
            user={user}
          />
        )}
      </div>

      <BottomNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  );
}
