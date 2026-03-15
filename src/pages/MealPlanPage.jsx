// src/pages/MealPlanPage.jsx
import { useState } from "react";
import { useMealPlan } from "../hooks/useMealPlan";
import { useRecipes } from "../hooks/useRecipes";

// ── Date helpers ───────────────────────────────────────────

const DAY_NAMES  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function toDateStr(d) {
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${dd}`;
}

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekOffset = 0) {
  const base = todayDate();
  const dow = base.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow; // Mon = start of week
  const monday = new Date(base);
  monday.setDate(base.getDate() + daysToMon + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatWeekRange(dates) {
  const s = dates[0], e = dates[6];
  if (s.getMonth() === e.getMonth()) {
    return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  }
  return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()]} ${e.getDate()}`;
}

// Parse a YYYY-MM-DD string into a local Date (avoids UTC offset issues).
function parseDateStr(str) {
  const [y, mo, d] = str.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

// ── Shared style ───────────────────────────────────────────

const OVERLAY = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", zIndex: 100,
};
const BOTTOM_SHEET = {
  position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
  width: "100%", maxWidth: 480, background: "#fff",
  borderRadius: "20px 20px 0 0", zIndex: 101,
};

// ── Meal item row ──────────────────────────────────────────

function MealItem({ meal, onTap }) {
  return (
    <div onClick={() => onTap(meal)}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
        background: meal.type === "recipe" ? "#f8fcfe" : "#fafafa",
        borderRadius: 8,
        border: `1px solid ${meal.type === "recipe" ? "#c8e8f5" : "#ececec"}`,
        marginBottom: 6, cursor: "pointer" }}>
      {meal.type === "recipe" && (
        meal.photoUrl
          ? <img src={meal.photoUrl} alt=""
              style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 34, height: 34, borderRadius: 6, background: "#c8e8f5",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0 }}>🍽️</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {meal.type === "recipe" ? meal.recipeName : meal.description}
        </div>
        {meal.type === "recipe" && meal.description && (
          <div style={{ fontSize: 11, color: "#999", marginTop: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {meal.description}
          </div>
        )}
      </div>
      <span style={{ color: "#ccc", fontSize: 16, flexShrink: 0 }}>⋯</span>
    </div>
  );
}

// ── Day card ──────────────────────────────────────────────

function DayCard({ date, meals, onAdd, onMealTap }) {
  const today = todayDate();
  const dateStr = toDateStr(date);
  const isToday = dateStr === toDateStr(today);
  const isPast  = date < today;
  const dayMeals = meals
    .filter(m => m.date === dateStr)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={{ background: "#fff", borderRadius: 12, marginBottom: 10,
      boxShadow: isToday ? "0 0 0 2px #1aaae0" : "0 1px 5px rgba(0,0,0,0.06)",
      opacity: isPast ? 0.65 : 1 }}>

      {/* Day header */}
      <div style={{ display: "flex", alignItems: "center",
        padding: "11px 14px 8px",
        borderBottom: dayMeals.length ? "1px solid #f5f5f5" : "none" }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 800,
            color: isToday ? "#1aaae0" : "#1a1a2e" }}>
            {DAY_NAMES[date.getDay()]}
          </span>
          <span style={{ fontSize: 13, color: isToday ? "#1aaae0" : "#aaa", marginLeft: 7 }}>
            {date.getDate()} {MONTH_NAMES[date.getMonth()]}
          </span>
          {isToday && (
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#fff",
              background: "#1aaae0", borderRadius: 20, padding: "2px 7px" }}>TODAY</span>
          )}
        </div>
        <button onClick={() => onAdd(dateStr)}
          style={{ background: "none", border: "none", color: "#1aaae0",
            fontSize: 24, cursor: "pointer", padding: "0 0 0 10px", lineHeight: 1 }}>+</button>
      </div>

      {/* Meals */}
      {dayMeals.length > 0
        ? <div style={{ padding: "8px 10px 10px" }}>
            {dayMeals.map(m => <MealItem key={m.id} meal={m} onTap={onMealTap} />)}
          </div>
        : <div style={{ padding: "8px 14px 12px", fontSize: 12,
            color: "#ccc", fontStyle: "italic" }}>
            No meals planned — tap + to add
          </div>
      }
    </div>
  );
}

// ── Add Meal panel (bottom sheet) ──────────────────────────

function AddMealPanel({ dateStr, recipes, onAdd, onClose }) {
  const [tab, setTab]             = useState("recipe");
  const [search, setSearch]       = useState("");
  const [description, setDescription] = useState("");

  const dateObj  = parseDateStr(dateStr);
  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div onClick={onClose} style={OVERLAY} />
      <div style={{ ...BOTTOM_SHEET, maxHeight: "82vh", display: "flex", flexDirection: "column" }}>

        {/* Title */}
        <div style={{ padding: "18px 20px 10px", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>
            Add meal — {DAY_FULL[dateObj.getDay()]}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            {dateObj.getDate()} {MONTH_NAMES[dateObj.getMonth()]}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0",
          padding: "0 20px", flexShrink: 0 }}>
          {[["recipe", "From Recipes"], ["text", "Write Description"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: "10px 4px", background: "none", border: "none",
                cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                color: tab === t ? "#1aaae0" : "#888",
                borderBottom: tab === t ? "2px solid #1aaae0" : "2px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Recipe picker */}
        {tab === "recipe" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes…"
              style={{ width: "100%", padding: "9px 14px", borderRadius: 20,
                border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none",
                fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10 }} />
            {filtered.length === 0
              ? <div style={{ textAlign: "center", padding: "30px 0", color: "#ccc", fontSize: 13 }}>
                  No recipes yet — add some in the Recipes tab!
                </div>
              : filtered.map(r => (
                  <div key={r.id}
                    onClick={() => onAdd(dateStr, {
                      type: "recipe", recipeId: r.id,
                      recipeName: r.name, photoUrl: r.photoUrl || "", description: "",
                    })}
                    style={{ display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 6px", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}>
                    {r.photoUrl
                      ? <img src={r.photoUrl} alt=""
                          style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 42, height: 42, borderRadius: 8, background: "#e8f4fb",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, flexShrink: 0 }}>🍽️</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.name}
                      </div>
                      {r.cookTime && (
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{r.cookTime}</div>
                      )}
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {/* Text description */}
        {tab === "text" && (
          <div style={{ padding: "16px 20px 32px", flexShrink: 0 }}>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Leftovers, Takeaway, BBQ night with the neighbours…"
              rows={3} autoFocus
              style={{ width: "100%", padding: "10px 14px", fontSize: 15,
                border: "1.5px solid #e8e8e8", borderRadius: 10, outline: "none",
                fontFamily: "inherit", boxSizing: "border-box", resize: "none", lineHeight: 1.5 }} />
            <button onClick={() => {
                if (description.trim()) onAdd(dateStr, { type: "text", description: description.trim() });
              }}
              disabled={!description.trim()}
              style={{ width: "100%", marginTop: 12, padding: "12px",
                background: description.trim() ? "#1aaae0" : "#c8e8f5",
                color: "#fff", border: "none", borderRadius: 10, fontWeight: 700,
                fontSize: 14, cursor: description.trim() ? "pointer" : "default",
                fontFamily: "inherit" }}>
              Add Meal
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Meal options sheet ─────────────────────────────────────

function MealOptionsSheet({ meal, weekDates, onMove, onDelete, onClose }) {
  const [movingTo, setMovingTo] = useState(false);

  return (
    <>
      <div onClick={onClose} style={OVERLAY} />
      <div style={{ ...BOTTOM_SHEET, padding: "20px 20px 36px" }}>

        {/* Meal preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          padding: "12px 14px", background: "#f8fcfe", borderRadius: 10 }}>
          {meal.type === "recipe" && (
            meal.photoUrl
              ? <img src={meal.photoUrl} alt=""
                  style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 44, height: 44, borderRadius: 8, background: "#c8e8f5",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🍽️</div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>
              {meal.type === "recipe" ? meal.recipeName : meal.description}
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
              {meal.type === "recipe" ? "Recipe" : "Note"}
            </div>
          </div>
        </div>

        {!movingTo ? (
          <>
            <button onClick={() => setMovingTo(true)}
              style={{ width: "100%", padding: "13px", marginBottom: 10,
                background: "#f0f9fe", color: "#1aaae0", border: "none",
                borderRadius: 10, fontWeight: 700, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit" }}>
              Move to another day
            </button>
            <button onClick={() => { onDelete(meal.id); onClose(); }}
              style={{ width: "100%", padding: "13px",
                background: "#fff5f5", color: "#e53935", border: "none",
                borderRadius: 10, fontWeight: 700, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit" }}>
              Delete
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999",
              textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
              Move to which day?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
              {weekDates.map(d => {
                const ds = toDateStr(d);
                const isCurrent = ds === meal.date;
                return (
                  <button key={ds} disabled={isCurrent}
                    onClick={() => { onMove(meal.id, ds); onClose(); }}
                    style={{ padding: "8px 2px",
                      background: isCurrent ? "#f0f0f0" : "#e8f6fd",
                      color: isCurrent ? "#bbb" : "#1aaae0",
                      border: "none", borderRadius: 8, fontWeight: 700,
                      fontSize: 11, cursor: isCurrent ? "default" : "pointer",
                      fontFamily: "inherit", textAlign: "center", lineHeight: 1.4 }}>
                    <div>{DAY_NAMES[d.getDay()]}</div>
                    <div style={{ fontSize: 13 }}>{d.getDate()}</div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setMovingTo(false)}
              style={{ marginTop: 12, width: "100%", padding: "10px",
                background: "none", border: "1.5px solid #e8e8e8", color: "#888",
                borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ── Bottom nav ─────────────────────────────────────────────

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

// ── Main page ──────────────────────────────────────────────

export default function MealPlanPage({ user, onNavigate, activePage }) {
  const [weekOffset, setWeekOffset]   = useState(0);
  const [addingTo, setAddingTo]       = useState(null); // dateStr or null
  const [mealOptions, setMealOptions] = useState(null); // meal object or null

  const weekDates = getWeekDates(weekOffset);
  const startDate = toDateStr(weekDates[0]);
  const endDate   = toDateStr(weekDates[6]);

  const { meals, addMeal, moveMeal, deleteMeal } = useMealPlan(startDate, endDate);
  const { recipes } = useRecipes();

  const handleAdd = async (dateStr, mealData) => {
    setAddingTo(null);
    await addMeal(dateStr, mealData, user);
  };

  const weekLabel = weekOffset === 0 ? "This week"
    : weekOffset === 1 ? "Next week"
    : weekOffset === -1 ? "Last week"
    : weekOffset > 0 ? `${weekOffset} weeks ahead`
    : `${Math.abs(weekOffset)} weeks ago`;

  return (
    <div style={{ width: "100%", margin: "0 auto", minHeight: "100vh", background: "#f0f2f5",
      fontFamily: "'Helvetica Neue',Arial,sans-serif", display: "flex", flexDirection: "column",
      boxShadow: "0 0 40px rgba(0,0,0,0.08)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1aaae0 0%,#0e8ab8 100%)",
        padding: "16px 16px 14px", color: "#fff" }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Meal Plan</div>

        {/* Week navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setWeekOffset(w => w - 1)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
              fontSize: 20, borderRadius: 8, width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{formatWeekRange(weekDates)}</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{weekLabel}</div>
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
              fontSize: 20, borderRadius: 8, width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>›</button>
        </div>

        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)}
            style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.75)",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "inherit", display: "block", width: "100%", textAlign: "center" }}>
            ← Back to this week
          </button>
        )}
      </div>

      {/* Day cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 4px" }}>
        {weekDates.map(d => (
          <DayCard
            key={toDateStr(d)}
            date={d}
            meals={meals}
            onAdd={setAddingTo}
            onMealTap={setMealOptions}
          />
        ))}
      </div>

      {/* Overlays */}
      {addingTo && (
        <AddMealPanel
          dateStr={addingTo}
          recipes={recipes}
          onAdd={handleAdd}
          onClose={() => setAddingTo(null)}
        />
      )}
      {mealOptions && (
        <MealOptionsSheet
          meal={mealOptions}
          weekDates={weekDates}
          onMove={moveMeal}
          onDelete={deleteMeal}
          onClose={() => setMealOptions(null)}
        />
      )}

      <BottomNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  );
}
