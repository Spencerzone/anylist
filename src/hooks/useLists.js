// src/hooks/useLists.js
import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  setDoc, updateDoc, orderBy, query, serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "../lib/firebase";

const DEFS = "listDefs";

export function useLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, DEFS), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (docs.length === 0) {
        // Seed using the existing list ID so existing items/history are preserved
        setDoc(doc(db, DEFS, "shared-family-list"), {
          name: "Groceries",
          emoji: "🛒",
          createdAt: serverTimestamp(),
          sortOrder: 0,
        });
      } else {
        // Sort by sortOrder when present; lists without one (not yet migrated)
        // keep their relative createdAt order and sort after any that have it.
        const sorted = [...docs].sort((a, b) => {
          const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
          const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
          return ao - bo;
        });
        setLists(sorted);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const createList = async (name, emoji = "📋") => {
    await addDoc(collection(db, DEFS), {
      name,
      emoji,
      createdAt: serverTimestamp(),
    });
  };

  const renameList = async (id, name, emoji) => {
    await updateDoc(doc(db, DEFS, id), { name, emoji });
  };

  const deleteList = async (id) => {
    await deleteDoc(doc(db, DEFS, id));
  };

  // Persists a full ordering by writing sortOrder = index for each list.
  const reorderLists = async (orderedIds) => {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, DEFS, id), { sortOrder: index });
    });
    await batch.commit();
  };

  const moveList = async (id, direction) => {
    const idx = lists.findIndex((l) => l.id === id);
    const newIdx = idx + direction;
    if (idx === -1 || newIdx < 0 || newIdx >= lists.length) return;
    const ids = lists.map((l) => l.id);
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    await reorderLists(ids);
  };

  return { lists, loading, createList, renameList, deleteList, moveList };
}
