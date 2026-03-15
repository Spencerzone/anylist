// src/hooks/useLists.js
import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  setDoc, updateDoc, orderBy, query, serverTimestamp
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
        });
      } else {
        setLists(docs);
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

  return { lists, loading, createList, renameList, deleteList };
}
