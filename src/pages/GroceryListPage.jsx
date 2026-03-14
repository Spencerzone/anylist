// src/pages/GroceryListPage.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import { useGroceryList } from "../hooks/useGroceryList";
import { DEFAULT_CATEGORIES, CAT_ICONS, guessCategory } from "../lib/categories";

// ── Manage Categories Modal ────────────────────────────────
function ManageCategoriesModal({ categories, items, onSave, onClose }) {
  const [cats, setCats] = useState([...categories]);
  const [newName, setNewName] = useState("");
  const [renamingIdx, setRenamingIdx] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  const inUse = cat => items.some(i => i.category === cat);

  const commitRename = () => {
    const val = renameVal.trim();
    if (val && val !== cats[renamingIdx] && !cats.includes(val)) {
      setCats(c => c.map((x, i) => i === renamingIdx ? val : x));
    }
    setRenamingIdx(null);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1100,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{background:"#fff",width:"100%",maxWidth:480,borderRadius:"20px 20px 0 0",
        padding:"20px 0 36px",boxShadow:"0 -4px 40px rgba(0,0,0,0.18)",
        display:"flex",flexDirection:"column",maxHeight:"82vh"}}
        onClick={e => e.stopPropagation()}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"0 20px 14px",borderBottom:"1px solid #f0f0f0"}}>
          <span style={{fontSize:17,fontWeight:700,color:"#1a1a2e"}}>Edit Categories</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#aaa"}}>✕</button>
        </div>

        <div style={{overflowY:"auto",flex:1}}>
          {cats.map((cat, i) => {
            const used = inUse(cat);
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,
                padding:"9px 20px",borderBottom:"1px solid #f8f8f8"}}>
                <span style={{fontSize:19,width:28,textAlign:"center",flexShrink:0}}>
                  {CAT_ICONS[cat] || "🏷️"}
                </span>
                {renamingIdx === i
                  ? <input autoFocus value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingIdx(null); }}
                      style={{flex:1,fontSize:15,border:"1.5px solid #1aaae0",borderRadius:8,
                        padding:"5px 10px",outline:"none",fontFamily:"inherit"}} />
                  : <span style={{flex:1,fontSize:15,color:"#333"}}>{cat}</span>
                }
                <button onClick={() => !used && (setRenamingIdx(i), setRenameVal(cat))}
                  title={used ? "In use — move items first" : "Rename"}
                  style={{background:"none",border:"none",fontSize:15,padding:4,
                    cursor:used?"default":"pointer",opacity:used?0.25:0.65}}>✏️</button>
                <button onClick={() => !used && setCats(c => c.filter((_,j) => j !== i))}
                  title={used ? "In use — move items first" : "Delete"}
                  style={{background:"none",border:"none",fontSize:15,padding:4,
                    cursor:used?"default":"pointer",opacity:used?0.2:0.65}}>🗑️</button>
              </div>
            );
          })}
        </div>

        <div style={{padding:"12px 20px 0",borderTop:"1px solid #f0f0f0",display:"flex",gap:8}}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              const v = newName.trim();
              if (e.key === "Enter" && v && !cats.includes(v)) { setCats(c => [...c, v]); setNewName(""); }
            }}
            placeholder="New category name..."
            style={{flex:1,padding:"10px 14px",fontSize:14,border:"1.5px solid #e8e8e8",
              borderRadius:10,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}} />
          <button
            onClick={() => { const v = newName.trim(); if (v && !cats.includes(v)) { setCats(c => [...c, v]); setNewName(""); } }}
            disabled={!newName.trim() || cats.includes(newName.trim())}
            style={{padding:"10px 18px",background:"#1aaae0",color:"#fff",border:"none",
              borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",
              opacity:(!newName.trim() || cats.includes(newName.trim())) ? 0.45 : 1}}>
            Add
          </button>
        </div>

        <div style={{padding:"12px 20px 0"}}>
          <button onClick={() => onSave(cats)}
            style={{width:"100%",padding:"13px",background:"#1aaae0",color:"#fff",border:"none",
              borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit / Add Modal ──────────────────────────────────────
function ItemModal({ item, onSave, onDelete, onClose, user, learnedCategories = {}, categories = DEFAULT_CATEGORIES, onUpdateCategories, items = [] }) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "Other");
  const [note, setNote] = useState(item?.note || "");
  const [quantity, setQuantity] = useState(item?.quantity || "");
  const [packageSize, setPackageSize] = useState(item?.packageSize || "");
  const [showManage, setShowManage] = useState(false);
  const nameRef = useRef();
  const isNew = !item?.id;

  useEffect(() => {
    nameRef.current?.focus();
    if (item?.name && !item?.id) setCategory(guessCategory(item.name, learnedCategories));
  }, []);

  const save = () => name.trim() && onSave({ ...item, name: name.trim(), category, note, quantity, packageSize }, user);
  const fieldStyle = {width:"100%",padding:"11px 14px",fontSize:15,border:"1.5px solid #e8e8e8",
    borderRadius:10,marginTop:5,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const labelStyle = {fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:1};

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

        {/* Name */}
        <div style={{marginBottom:16}}>
          <label style={labelStyle}>Item Name</label>
          <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder="e.g. Milk, Bread..."
            style={fieldStyle} />
        </div>

        {/* Category */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <label style={labelStyle}>Category</label>
            {onUpdateCategories && (
              <button onClick={() => setShowManage(true)}
                title="Edit categories"
                style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",
                  fontSize:14,opacity:0.55,lineHeight:1}}>✏️</button>
            )}
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{...fieldStyle,background:"#fff",cursor:"pointer"}}>
            {categories.map(c => <option key={c} value={c}>{CAT_ICONS[c] || "🏷️"} {c}</option>)}
          </select>
        </div>

        {showManage && onUpdateCategories && (
          <ManageCategoriesModal
            categories={categories}
            items={items}
            onSave={async cats => { await onUpdateCategories(cats); setShowManage(false); }}
            onClose={() => setShowManage(false)}
          />
        )}

        {/* Quantity + Package Size side by side */}
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <div style={{flex:1}}>
            <label style={labelStyle}>Quantity</label>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:5}}>
              <button onMouseDown={e => { e.preventDefault(); setQuantity(q => String(Math.max(0, (parseInt(q)||0) - 1) || "")); }}
                style={{width:36,height:36,borderRadius:8,border:"1.5px solid #e8e8e8",background:"#f4f6f8",
                  fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</button>
              <input value={quantity} onChange={e => setQuantity(e.target.value)}
                placeholder="—"
                style={{...fieldStyle,marginTop:0,textAlign:"center",padding:"8px 6px",flex:1,minWidth:0}} />
              <button onMouseDown={e => { e.preventDefault(); setQuantity(q => String((parseInt(q)||0) + 1)); }}
                style={{width:36,height:36,borderRadius:8,border:"1.5px solid #e8e8e8",background:"#f4f6f8",
                  fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
            </div>
          </div>
          <div style={{flex:1}}>
            <label style={labelStyle}>Package Size</label>
            <input value={packageSize} onChange={e => setPackageSize(e.target.value)}
              placeholder="e.g. 500g, 2L"
              style={{...fieldStyle,marginTop:5}} />
          </div>
        </div>

        {/* Note */}
        <div style={{marginBottom:16}}>
          <label style={labelStyle}>Note</label>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="Optional note..."
            style={fieldStyle} />
        </div>

        <div style={{display:"flex",gap:10,marginTop:4}}>
          {!isNew && (
            <button onClick={() => onDelete(item)}
              style={{flex:1,padding:"13px",background:"#fff",color:"#e53935",
                border:"1.5px solid #e53935",borderRadius:12,fontWeight:700,
                fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
              Delete
            </button>
          )}
          <button onClick={save} disabled={!name.trim()}
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
function AddItemBar({ onAdd, items, user, learnedCategories = {}, categories = DEFAULT_CATEGORIES, onUpdateCategories }) {
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
    onAdd({ name, category: guessCategory(name, learnedCategories), note: "", emoji: "" }, user);
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
          item={{ name: text, category: guessCategory(text, learnedCategories), note: "" }}
          onSave={(newItem, u) => { onAdd(newItem, u); setText(""); setShowModal(false); }}
          onClose={() => setShowModal(false)}
          user={user}
          categories={categories}
          onUpdateCategories={onUpdateCategories}
          items={items}
        />
      )}
    </div>
  );
}

// ── Item Row ──────────────────────────────────────────────
function ItemRow({ item, onToggle, onEdit, toastId }) {
  const justChecked = item.id === toastId;
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
        <span style={{fontSize:15.5,letterSpacing:0.1,
          color: justChecked ? "#e53935" : item.checked ? "#b0b0b0" : "#1a1a2e",
          textDecoration: item.checked ? "line-through" : "none",
          textDecorationColor: justChecked ? "#e53935" : undefined}}>
          {item.name}
          {item.emoji && <span style={{marginLeft:6}}>{item.emoji}</span>}
          {item.quantity && <span style={{marginLeft:6,fontSize:13,color:item.checked?"#c0c0c0":"#1aaae0",fontWeight:600}}>×{item.quantity}</span>}
        </span>
        <div style={{display:"flex",gap:8,marginTop:1,flexWrap:"wrap"}}>
          {item.packageSize && <span style={{fontSize:11,color:"#aaa"}}>{item.packageSize}</span>}
          {item.note && <span style={{fontSize:11,color:"#999"}}>{item.note}</span>}
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
function CategorySection({ category, items, onToggle, onEdit, toastId }) {
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
        <ItemRow key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} toastId={toastId} />
      ))}
    </div>
  );
}

// ── History Panel ─────────────────────────────────────────
function HistoryPanel({ onClose, onReAdd, fetchHistory, clearHistory }) {
  const [historyItems, setHistoryItems] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchHistory().then(setHistoryItems).catch(() => setHistoryItems([]));
  }, []); // eslint-disable-line

  const groups = useMemo(() => {
    if (!historyItems) return null;
    const now = new Date();
    const today     = new Date(now); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const map = {};
    const order = [];
    for (const item of historyItems) {
      const d = item.checkedAt?.toDate?.() || new Date();
      const day = new Date(d); day.setHours(0,0,0,0);
      let label;
      if (day >= today)     label = "Today";
      else if (day >= yesterday) label = "Yesterday";
      else label = d.toLocaleDateString("en-AU", { weekday:"long", day:"numeric", month:"short" });
      if (!map[label]) { map[label] = []; order.push(label); }
      map[label].push(item);
    }
    return order.map(label => ({ label, items: map[label] }));
  }, [historyItems]);

  const handleClearAll = async () => {
    setClearing(true);
    await clearHistory();
    setHistoryItems([]);
    setClearing(false);
  };

  return (
    <>
      <div onClick={onClose}
        style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000}} />
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:480,background:"#fff",borderRadius:"20px 20px 0 0",
        zIndex:1001,maxHeight:"78vh",display:"flex",flexDirection:"column"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"18px 20px 14px",borderBottom:"1px solid #f0f0f0",flexShrink:0}}>
          <span style={{fontSize:17,fontWeight:700,color:"#1a1a2e"}}>Recently Checked Off</span>
          <button onClick={onClose}
            style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#aaa"}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:"auto"}}>
          {!historyItems ? (
            <div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:14}}>Loading…</div>
          ) : historyItems.length === 0 ? (
            <div style={{textAlign:"center",padding:"50px 24px",color:"#bbb",fontSize:14,lineHeight:1.6}}>
              No checked-off items in the last 30 days.
            </div>
          ) : groups?.map(({ label, items: groupItems }) => (
            <div key={label}>
              <div style={{fontSize:11,fontWeight:700,color:"#bbb",textTransform:"uppercase",
                letterSpacing:0.8,padding:"12px 20px 6px"}}>{label}</div>
              {groupItems.map(item => (
                <div key={item.id}
                  style={{display:"flex",alignItems:"center",padding:"10px 16px",
                    borderBottom:"1px solid #f5f5f5"}}>
                  <span style={{fontSize:20,width:30,textAlign:"center",flexShrink:0}}>
                    {CAT_ICONS[item.category] || "🏷️"}
                  </span>
                  <div style={{flex:1,marginLeft:12,minWidth:0}}>
                    <div style={{fontSize:15,color:"#1a1a2e",fontWeight:500}}>{item.name}</div>
                    {(item.quantity || item.note || item.packageSize) && (
                      <div style={{fontSize:11,color:"#aaa",marginTop:1}}>
                        {[item.quantity && `×${item.quantity}`, item.packageSize, item.note]
                          .filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                  <button onClick={() => onReAdd(item)}
                    style={{background:"#e8f6fd",color:"#1aaae0",border:"none",
                      borderRadius:8,padding:"6px 12px",fontWeight:700,fontSize:13,
                      cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}>
                    + Re-add
                  </button>
                </div>
              ))}
            </div>
          ))}
          <div style={{height:16}} />
        </div>

        {historyItems?.length > 0 && (
          <div style={{padding:"12px 20px 28px",borderTop:"1px solid #f0f0f0",flexShrink:0}}>
            <button onClick={handleClearAll} disabled={clearing}
              style={{width:"100%",padding:"12px",background:"#fff5f5",color:"#e53935",
                border:"none",borderRadius:10,fontWeight:700,fontSize:14,
                cursor:clearing?"default":"pointer",fontFamily:"inherit"}}>
              {clearing ? "Clearing…" : "Clear all history"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function GroceryListPage({ user, onLogOut, onNavigate, activePage = "lists" }) {
  const { items, loading, addItem, updateItem, toggleCheck, deleteItem, clearChecked,
          fetchHistory, clearHistory, persistedLearned, persistCategory,
          customCategories, updateCategories } = useGroceryList();
  const [editingItem, setEditingItem] = useState(null);
  const [showChecked, setShowChecked] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [notifBanner, setNotifBanner] = useState(() => {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission !== "default") return false;
    return localStorage.getItem("notifPermAsked") !== "dismissed";
  });
  const toastTimer = useRef(null);
  const prevItemsRef = useRef(null);

  const handleToggle = (id, currentChecked) => {
    toggleCheck(id, currentChecked);
    if (!currentChecked) {
      const item = items.find(i => i.id === id);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ id, name: item?.name || "", emoji: item?.emoji || "" });
      toastTimer.current = setTimeout(() => setToast(null), 4000);
    } else if (toast?.id === id) {
      clearTimeout(toastTimer.current);
      setToast(null);
    }
  };

  const handleUndoToast = () => {
    if (toast) {
      toggleCheck(toast.id, true);
      clearTimeout(toastTimer.current);
      setToast(null);
    }
  };

  // Fire a browser notification when another user adds items (app open in background tab).
  useEffect(() => {
    if (loading) return;
    if (prevItemsRef.current === null) { prevItemsRef.current = items; return; }
    const prevIds = new Set(prevItemsRef.current.map(i => i.id));
    const addedByOther = items.filter(i => !prevIds.has(i.id) && i.addedByUid !== user?.uid);
    if (addedByOther.length && Notification.permission === "granted") {
      const by    = addedByOther[0].addedBy;
      const names = addedByOther.map(i => i.name).join(", ");
      new Notification("FoodList", {
        body: `${by} added: ${names}`,
        icon: "/icon-192.png",
        tag:  "foodlist-add",
      });
    }
    prevItemsRef.current = items;
  }, [items, loading]); // eslint-disable-line

  const learnedCategories = useMemo(() => ({
    ...persistedLearned,
    ...Object.fromEntries(items.map(i => [i.name.toLowerCase(), i.category]))
  }), [items, persistedLearned]);

  const effectiveCategories = customCategories || DEFAULT_CATEGORIES;

  const displayItems = showChecked ? items : items.filter(i => !i.checked || i.id === toast?.id);
  const remaining = items.filter(i => !i.checked).length;
  const checkedCount = items.filter(i => i.checked).length;

  const grouped = effectiveCategories.reduce((acc, cat) => {
    const catItems = displayItems.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const handleSave = async (item, u) => {
    if (item.id) {
      await updateItem(item.id, { name: item.name, category: item.category, note: item.note, quantity: item.quantity || "", packageSize: item.packageSize || "" });
    } else {
      await addItem(item, u);
    }
    persistCategory(item.name, item.category);
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
          <div style={{display:"flex",gap:0}}>
            <button onClick={() => setShowHistory(true)}
              style={{background:"none",border:"none",color:"#fff",fontSize:19,cursor:"pointer",padding:"4px 8px",opacity:0.9}}
              title="Recently cleared">🕐</button>
            <button onClick={() => setShowDotMenu(m => !m)}
              style={{background:"none",border:"none",color:"#fff",fontSize:22,cursor:"pointer",padding:"4px 8px"}}>⋮</button>
          </div>
        </div>

        {showDotMenu && (
          <div style={{marginTop:12,background:"rgba(0,0,0,0.15)",borderRadius:12,padding:"8px 4px"}}>
            <button onClick={() => { setShowChecked(s => !s); setShowDotMenu(false); }}
              style={{width:"100%",background:"none",border:"none",color:"#fff",fontSize:14,
                fontWeight:600,cursor:"pointer",padding:"10px 14px",textAlign:"left",borderRadius:8,
                display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>{showChecked ? "🙈" : "👁"}</span>
              {showChecked ? "Hide checked items" : "Show checked items"}
            </button>
            {checkedCount > 0 && (
              <button onClick={() => { clearChecked(user); setShowDotMenu(false); }}
                style={{width:"100%",background:"none",border:"none",color:"#ffaaaa",fontSize:14,
                  fontWeight:600,cursor:"pointer",padding:"10px 14px",textAlign:"left",borderRadius:8,
                  display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>🗑️</span>
                Clear {checkedCount} checked item{checkedCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

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

      {/* Add Bar */}
      <AddItemBar onAdd={addItem} items={items} user={user} learnedCategories={learnedCategories}
        categories={effectiveCategories} onUpdateCategories={updateCategories} />

      {/* Notification permission banner */}
      {notifBanner && (
        <div style={{background:"#fffbe6",borderBottom:"1px solid #ffe58f",padding:"10px 14px",
          display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:18}}>🔔</span>
          <span style={{flex:1,fontSize:13,color:"#555",lineHeight:1.4}}>
            Get notified when your partner adds items
          </span>
          <button
            onClick={async () => {
              const perm = await Notification.requestPermission();
              localStorage.setItem("notifPermAsked", perm === "granted" ? "granted" : "dismissed");
              setNotifBanner(false);
            }}
            style={{background:"#1aaae0",color:"#fff",border:"none",borderRadius:8,
              padding:"6px 14px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            Enable
          </button>
          <button
            onClick={() => { localStorage.setItem("notifPermAsked","dismissed"); setNotifBanner(false); }}
            style={{background:"none",border:"none",color:"#aaa",fontSize:13,cursor:"pointer",
              padding:"6px 4px",fontFamily:"inherit"}}>
            Not now
          </button>
        </div>
      )}

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
              onToggle={handleToggle} onEdit={setEditingItem} toastId={toast?.id} />
          ))
        )}
        <div style={{height:90}} />
      </div>

      {/* History Panel */}
      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          onReAdd={async (item) => {
            await addItem({ name: item.name, category: item.category, note: item.note || "",
              quantity: item.quantity || "", packageSize: item.packageSize || "", emoji: item.emoji || "" }, user);
            setShowHistory(false);
          }}
          fetchHistory={fetchHistory}
          clearHistory={clearHistory}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <ItemModal item={editingItem} onSave={handleSave} learnedCategories={learnedCategories}
          categories={effectiveCategories} onUpdateCategories={updateCategories} items={items}
          onDelete={async (item) => { await deleteItem(item, user); setEditingItem(null); }}
          onClose={() => setEditingItem(null)} user={user} />
      )}

      {/* Undo Toast */}
      {toast && (
        <div style={{position:"fixed",bottom:58,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:480,boxSizing:"border-box",
          background:"#222",color:"#fff",display:"flex",alignItems:"center",
          justifyContent:"space-between",padding:"14px 20px",zIndex:2000}}>
          <span style={{fontSize:14}}>
            Crossed off <em>{toast.name}</em>{toast.emoji ? ` ${toast.emoji}` : ""}
          </span>
          <button onClick={handleUndoToast}
            style={{background:"none",border:"none",color:"#1aaae0",fontSize:14,
              fontWeight:700,cursor:"pointer",letterSpacing:0.5,padding:0,marginLeft:16}}>
            UNDO
          </button>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{display:"flex",background:"#fff",borderTop:"1px solid #e8e8e8",
        position:"sticky",bottom:0}}>
        {[["Lists","☰"],["Recipes","🍴"],["Meal Plan","📅"],["Settings","⚙️"]].map(([tab, icon]) => (
          <button key={tab} onClick={() => onNavigate?.(tab.toLowerCase())}
            style={{flex:1,padding:"10px 4px 8px",background:"none",border:"none",
            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:20}}>{icon}</span>
            <span style={{fontSize:10,fontWeight:600,color:activePage===tab.toLowerCase()?"#1aaae0":"#aaa"}}>{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
