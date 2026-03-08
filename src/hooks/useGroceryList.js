// src/hooks/useGroceryList.js
import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, setDoc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase";

// All family members share one list ID. 
// In a future version this can be per-household with invites.
const LIST_ID = "shared-family-list";

export function useGroceryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [persistedLearned, setPersistedLearned] = useState({});

  useEffect(() => {
    const q = query(
      collection(db, "lists", LIST_ID, "items"),
      orderBy("category"),
      orderBy("createdAt")
    );

    const unsubItems = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
      setLoading(false);
    });

    const unsubList = onSnapshot(doc(db, "lists", LIST_ID), (snap) => {
      setPersistedLearned(snap.data()?.learnedCategories || {});
    });

    return () => { unsubItems(); unsubList(); };
  }, []);

  const persistCategory = async (name, category) => {
    await setDoc(
      doc(db, "lists", LIST_ID),
      { learnedCategories: { [name.toLowerCase()]: category } },
      { merge: true }
    );
  };

  const addItem = async (item, user) => {
    await addDoc(collection(db, "lists", LIST_ID, "items"), {
      name: item.name,
      category: item.category,
      note: item.note || "",
      emoji: item.emoji || "",
      checked: false,
      addedBy: user.displayName || user.email,
      addedByUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateItem = async (id, changes) => {
    await updateDoc(doc(db, "lists", LIST_ID, "items", id), {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  };

  const toggleCheck = async (id, currentChecked) => {
    await updateDoc(doc(db, "lists", LIST_ID, "items", id), {
      checked: !currentChecked,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "lists", LIST_ID, "items", id));
  };

  const clearChecked = async () => {
    const checked = items.filter((i) => i.checked);
    await Promise.all(checked.map((i) => deleteItem(i.id)));
  };

  return { items, loading, addItem, updateItem, toggleCheck, deleteItem, clearChecked, persistedLearned, persistCategory };
}
