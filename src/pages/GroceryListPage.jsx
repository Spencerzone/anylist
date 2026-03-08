// src/pages/GroceryListPage.jsx
import { useState, useRef, useEffect } from "react";
import { useGroceryList } from "../hooks/useGroceryList";

const CATEGORIES = [
  "Baby", "Bakery", "Beverages", "Bread", "Breakfast",
  "Bunnings", "Canned Goods", "Cleaning", "Condiments & Dressings",
  "Cooking & Baking", "Dairy", "Deli", "Frozen Foods",
  "Fruit & Vegetables", "Health & Beauty", "Meat",
  "Pantry", "Pet", "Seafood", "Snacks", "Other"
];

const CAT_ICONS = {
  "Baby": "🍼", "Bakery": "🥐", "Beverages": "🥤", "Bread": "🍞",
  "Breakfast": "🥣", "Bunnings": "🏠", "Canned Goods": "🥫",
  "Cleaning": "🧹", "Condiments & Dressings": "🫙", "Cooking & Baking": "🥄",
  "Dairy": "🧀", "Deli": "🥩", "Frozen Foods": "❄️",
  "Fruit & Vegetables": "🥦", "Health & Beauty": "💊", "Meat": "🥩",
  "Pantry": "🏺", "Pet": "🐾", "Seafood": "🐟", "Snacks": "🍿", "Other": "📦"
};

function guessCategory(name) {
  const n = name.toLowerCase();
  if (/milk|cheese|yogh|butter|cream|egg/.test(n)) return "Dairy";
  if (/bread|bun|roll|loaf/.test(n)) return "Bread";
  if (/chicken|beef|pork|lamb|mince|steak|sausage/.test(n)) return "Meat";
  if (/salmon|tuna|fish|prawn|seafood/.test(n)) return "Seafood";
  if (/apple|banana|carrot|tomato|lettuce|potato|onion|spinach|broccoli|capsicum/.test(n)) return "Fruit & Vegetables";
  if (/frozen|ice cream/.test(n)) return "Frozen Foods";
  if (/cereal|oats|muesli/.test(n)) return "Breakfast";
  if (/coffee|tea|juice|water|drink|beer|wine/.test(n)) return "Beverages";
  if (/nappy|wipe|baby/.test(n)) return "Baby";
  if (/shampoo|soap|toothpaste|deodorant/.test(n)) return "Health & Beauty";
  if (/sauce|salsa|mustard|mayo|dressing|vinegar|oil/.test(n)) return "Condiments & Dressings";
  if (/flour|sugar|baking|yeast|cocoa|vanilla/.test(n)) return "Cooking & Baking";
  if (/chip|biscuit|cracker|snack|chocolate|lolly|nut/.test(n)) return "Snacks";
  return "Other";
}

// ── Edit / Add Modal ──────────────────────────────────────
function ItemModal({ item, onSave, onDelete, onClose, user }) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "Other");
  const [note, setNote] = useState(item?.note || "");
  const nameRef = useRef();
  const isNew = !item?.id;

  useEffect(() => {
    nameRef.current?.focus();
    if (item?.name && !item?.id) setCategory(guessCategory(item.name));
  }, []);

  return (
    <div
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,
        display:"flex",alignItems:"flex-end",justifyContent:"center" }}
      onClick={onClose}
    >
      <div
        style={{ background:"#fff",width:"100%",maxWidth:480,borderRadius:"20px 20px 0 0",
          padding:"24px 20px 36px",boxShadow:"0 -4px 40px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:17,fontWeight:700,color:"#1a1a2e"}}>{isNew ? "Add Item" : "Edit Item"}</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#aaa"}}>✕</button>
        </div>

        {["Item Name", "Category", "Note"].map((label, i) => (
          <div key={label} style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:1}}>
              {label}
            </label>
            {i === 1 ? (
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{width:"100%",padding:"11px 14px",fontSize:15,border:"1.5px solid #e8e8e8",
                  borderRadius:10,marginTop:5,outline:"none",background:"#fff",
                  fontFamily:"inherit",cursor:"pointer",boxSizing:"border-box"}}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            ) : (
              <input
                ref={i === 0 ? nameRef : undefined}
                value={i === 0 ? name : note}
                onChange={e => i === 0 ? setName(e.target.value) : setNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && onSave({...item, name:name.trim(), category, note}, user)}
                placeholder={i === 0 ? "e.g. Milk, Bread..." : "Optional note..."}
                style={{width:"100%",padding:"11px 14px",fontSize:15,border:"1.5px solid #e8e8e8",
                  borderRadius:10,marginTop:5,outline:"none",fontFamily:"inherit",
                  boxSizing:"border-box"}}
              />
            )}
          </div>
        ))}

        <div style={{display:"flex",gap:10,marginTop:4}}>
          {!isNew && (
            <button onClick={() => onDelete(item.id)}
              style={{flex:1,padding:"13px",background:"#fff",color:"#e53935",
                border:"1.5px solid #e53935",borderRadius:12,fontWeight:700,
                fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
              Delete
            </button>
          )}
          <button
            onClick={() => name.trim() && onSave({...item, name:name.trim(), category, note}, user)}
            disabled={!name.trim()}
            style={{flex:2,padding:"13px",
              background:name.trim() ? "#1aaae0" : "#c8e8f5",
              color:"#fff",border:"none",borderRadius:12,fontWeight:700,
              fontSize:15,cursor:name.trim()?"pointer":"default",fontFamily:"inherit"}}>
            {isNew ? "Add to List" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Item Bar ──────────────────────────────────────────
function AddItemBar({ onAdd, items, user }) {
  const [text, setText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (val) => {
    setText(val);
    if (val.trim().length > 0) {
      setSuggestions(items.filter(i =>
        i.name.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 4));
    } else {
      setSuggestions([]);
    }
  };

  const quickAdd = (name) => {
    onAdd({ name, category: guessCategory(name), note: "", emoji: "" }, user);
    setText(""); setSuggestions([]);
  };

  return (
    <div style={{padding:"10px 14px",background:"#fff",borderBottom:"1px solid #ececec",position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",background:"#f4f6f8",borderRadius:24,padding:"9px 16px",gap:8}}>
        <span style={{color:"#1aaae0",fontSize:20,lineHeight:1}}>+</span>
        <input
          value={text}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && text.trim()) {
              quickAdd(suggestions.length > 0 ? suggestions[0].name : text.trim());
            }
          }}
          placeholder="Add Item"
          style={{border:"none",background:"transparent",fontSize:15,outline:"none",
            flex:1,fontFamily:"inherit",color:"#333"}}
        />
        {text.trim() && (
          <button onClick={() => setShowModal(true)}
            style={{background:"none",border:"none",color:"#1aaae0",fontSize:13,
              fontWeight:700,cursor:"pointer",padding:"2px 6px",borderRadius:8,
              whiteSpace:"nowrap"}}>
            More ›
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div style={{position:"absolute",left:14,right:14,top:"100%",background:"#fff",
          borderRadius:12,boxShadow:"0 4px 24px rgba(0,0,0,0.12)",zIndex:100,
          overflow:"hidden",border:"1px solid #eee"}}>
          {suggestions.map(s => (
            <div key={s.id} onMouseDown={() => quickAdd(s.name)}
              style={{padding:"10px 16px",cursor:"pointer",fontSize:14,
                borderBottom:"1px solid #f5f5f5",display:"flex",alignItems:"center",gap:10}}>
              <span>{CAT_ICONS[s.category]}</span>
              <div>
                <div style={{fontWeight:600,color:"#222"}}>{s.name}</div>
                <div style={{fontSize:11,color:"#aaa"}}>{s.category}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ItemModal
          item={{ name: text, category: guessCategory(text), note: "" }}
          onSave={(newItem, u) => { onAdd(newItem, u); setText(""); setShowModal(false); }}
          onClose={() => setShowModal(false)}
          user={user}
        />
      )}
    </div>
  );
}

// ── Item Row ──────────────────────────────────────────────
function ItemRow({ item, onToggle, onEdit }) {
  return (
    <div onClick={() => onToggle(item.id, item.checked)}
      style={{display:"flex",alignItems:"center",padding:"0 16px",
        borderBottom:"1px solid #f2f2f2",background:"#fff",minHeight:52,cursor:"pointer"}}>
      <div style={{width:26,height:26,borderRadius:"50%",
          border:item.checked?"none":"2px solid #d0d0d0",
          background:item.checked?"#1aaae0":"transparent",
          display:"flex",alignItems:"center",justifyContent:"center",
          flexShrink:0,transition:"all 0.18s"}}>
        {item.checked && <span style={{color:"#fff",fontSize:13,fontWeight:800}}>✓</span>}
      </div>
      <div style={{flex:1,marginLeft:14}}>
        <span style={{fontSize:15.5,color:item.checked?"#b0b0b0":"#1a1a2e",
          textDecoration:item.checked?"line-through":"none",letterSpacing:0.1}}>
          {item.name}
          {item.emoji && <span style={{marginLeft:6}}>{item.emoji}</span>}
        </span>
        <div style={{display:"flex",gap:8,marginTop:1,flexWrap:"wrap"}}>
          {item.note && <span style={{fontSize:11,color:"#999"}}>{item.note}</span>}
          {item.addedBy && (
            <span style={{fontSize:11,color:"#c0c0c0"}}>added by {item.addedBy.split(" ")[0]}</span>
          )}
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onEdit(item); }}
        style={{background:"none",border:"none",cursor:"pointer",
          color:"#1aaae0",fontSize:16,padding:"8px 4px 8px 12px",opacity:0.65}}>
        ✏️
      </button>
    </div>
  );
}

// ── Category Section ──────────────────────────────────────
function CategorySection({ category, items, onToggle, onEdit }) {
  const [collapsed, setCollapsed] = useState(false);
  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  return (
    <div>
      <div onClick={() => setCollapsed(c => !c)}
        style={{display:"flex",alignItems:"center",padding:"8px 16px",
          background:"#f0f4f7",cursor:"pointer",borderBottom:"1px solid #e4eaee"}}>
        <span style={{fontSize:15,marginRight:8}}>{CAT_ICONS[category] || "📦"}</span>
        <span style={{color:"#1aaae0",fontWeight:700,fontSize:14,letterSpacing:0.3}}>{category}</span>
        <span style={{marginLeft:"auto",color:"#b0b0b0",fontSize:12}}>
          {unchecked.length > 0 && <span style={{marginRight:4}}>{unchecked.length}</span>}
          {collapsed ? "▸" : "▾"}
        </span>
      </div>
      {!collapsed && [...unchecked, ...checked].map(item => (
        <ItemRow key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function GroceryListPage({ user, onLogOut }) {
  const { items, loading, addItem, updateItem, toggleCheck, deleteItem, clearChecked } = useGroceryList();
  const [editingItem, setEditingItem] = useState(null);
  const [showChecked, setShowChecked] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const displayItems = showChecked ? items : items.filter(i => !i.checked);
  const remaining = items.filter(i => !i.checked).length;
  const checkedCount = items.filter(i => i.checked).length;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = displayItems.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const handleSave = async (item, u) => {
    if (item.id) {
      await updateItem(item.id, { name: item.name, category: item.category, note: item.note });
    } else {
      await addItem(item, u);
    }
    setEditingItem(null);
  };

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:"#f0f2f5",
      fontFamily:"'Helvetica Neue',Arial,sans-serif",display:"flex",flexDirection:"column",
      boxShadow:"0 0 40px rgba(0,0,0,0.08)"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1aaae0 0%,#0e8ab8 100%)",
        padding:"16px 16px 14px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}
            onClick={() => setShowUserMenu(u => !u)}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{width:36,height:36,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.6)"}} />
              : <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.3)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700}}>
                  {(user.displayName||user.email||"?")[0].toUpperCase()}
                </div>
            }
            <div>
              <div style={{fontSize:17,fontWeight:700,letterSpacing:0.2}}>Shared Grocery List</div>
              <div style={{fontSize:12,opacity:0.85,marginTop:1}}>
                {loading ? "Loading..." : `${remaining} of ${items.length} items remaining`}
              </div>
            </div>
          </div>
          <button style={{background:"none",border:"none",color:"#fff",fontSize:22,cursor:"pointer"}}>⋮</button>
        </div>

        {showUserMenu && (
          <div style={{marginTop:12,background:"rgba(0,0,0,0.15)",borderRadius:12,padding:"10px 14px"}}>
            <div style={{fontSize:13,opacity:0.9,marginBottom:8}}>
              Signed in as <strong>{user.displayName || user.email}</strong>
            </div>
            <div style={{fontSize:12,opacity:0.75,marginBottom:10}}>
              💡 Your wife signs in with her Google account on her phone — you'll both see the same list in real time.
            </div>
            <button onClick={onLogOut}
              style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",
                color:"#fff",borderRadius:8,padding:"6px 14px",cursor:"pointer",
                fontSize:13,fontWeight:600}}>
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",
        background:"#fff",borderBottom:"1px solid #ececec"}}>
        <div style={{flex:1}} />
        <button onClick={() => setShowChecked(s => !s)}
          title={showChecked ? "Hide checked" : "Show checked"}
          style={{background:"none",border:"none",fontSize:18,cursor:"pointer",
            color:showChecked?"#1aaae0":"#ccc",padding:6}}>
          👁
        </button>
        {checkedCount > 0 && (
          <button onClick={clearChecked}
            style={{background:"none",border:"1px solid #e0e0e0",color:"#e53935",
              borderRadius:16,padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>
            Clear {checkedCount} ✓
          </button>
        )}
      </div>

      {/* Add Bar */}
      <AddItemBar onAdd={addItem} items={items} user={user} />

      {/* List */}
      <div style={{flex:1,overflowY:"auto"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#aaa"}}>
            <div style={{fontSize:32,marginBottom:12}}>⏳</div>
            <div style={{fontSize:15}}>Loading your list...</div>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#aaa"}}>
            <div style={{fontSize:48,marginBottom:12}}>🛒</div>
            <div style={{fontSize:18,fontWeight:600,color:"#ccc"}}>Your list is empty</div>
            <div style={{fontSize:14,marginTop:6}}>Tap + Add Item above to get started</div>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <CategorySection key={cat} category={cat} items={catItems}
              onToggle={toggleCheck} onEdit={setEditingItem} />
          ))
        )}
        <div style={{height:90}} />
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <ItemModal item={editingItem} onSave={handleSave}
          onDelete={async (id) => { await deleteItem(id); setEditingItem(null); }}
          onClose={() => setEditingItem(null)} user={user} />
      )}

      {/* Bottom Nav */}
      <div style={{display:"flex",background:"#fff",borderTop:"1px solid #e8e8e8",
        position:"sticky",bottom:0}}>
        {[["Lists","☰"],["Recipes","🍴"],["Meal Plan","📅"],["Settings","⚙️"]].map(([tab, icon]) => (
          <button key={tab} style={{flex:1,padding:"10px 4px 8px",background:"none",border:"none",
            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:20}}>{icon}</span>
            <span style={{fontSize:10,fontWeight:600,color:tab==="Lists"?"#1aaae0":"#aaa"}}>{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
