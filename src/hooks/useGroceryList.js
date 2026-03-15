// src/hooks/useGroceryList.js
import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, setDoc, serverTimestamp, query, orderBy,
  getDocs, where, writeBatch, Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";

export function useGroceryList(listId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [persistedLearned, setPersistedLearned] = useState({});
  const [customCategories, setCustomCategories] = useState(null);
  // Cache items per listId so switching back to a known list never shows blank
  const itemsCacheRef = useRef({});

  useEffect(() => {
    if (!listId) return;

    // Immediately restore from cache if available (prevents blank on re-visit)
    const cached = itemsCacheRef.current[listId];
    setItems(cached || []);
    setLoading(!cached);

    const q = query(
      collection(db, "lists", listId, "items"),
      orderBy("category"),
      orderBy("createdAt")
    );

    const unsubItems = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      itemsCacheRef.current[listId] = data;
      setItems(data);
      setLoading(false);
    });

    const unsubList = onSnapshot(doc(db, "lists", listId), (snap) => {
      setPersistedLearned(snap.data()?.learnedCategories || {});
      setCustomCategories(snap.data()?.categories || null);
    });

    return () => { unsubItems(); unsubList(); };
  }, [listId]);

  const updateCategories = async (cats) => {
    await setDoc(doc(db, "lists", listId), { categories: cats }, { merge: true });
  };

  const persistCategory = async (name, category) => {
    await setDoc(
      doc(db, "lists", listId),
      { learnedCategories: { [name.toLowerCase()]: category } },
      { merge: true }
    );
  };

  const addItem = async (item, user) => {
    await addDoc(collection(db, "lists", listId, "items"), {
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
    await updateDoc(doc(db, "lists", listId, "items", id), {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  };

  const toggleCheck = async (id, currentChecked) => {
    const item = items.find(i => i.id === id);
    await updateDoc(doc(db, "lists", listId, "items", id), {
      checked: !currentChecked,
      updatedAt: serverTimestamp(),
    });
    // Archive to history when checking off (not when unchecking)
    if (!currentChecked && item) {
      await addDoc(collection(db, "lists", listId, "history"), {
        name:        item.name        || "",
        category:    item.category    || "",
        note:        item.note        || "",
        quantity:    item.quantity    || "",
        packageSize: item.packageSize || "",
        emoji:       item.emoji       || "",
        checkedAt:   serverTimestamp(),
      });
    }
  };

  const deleteItem = async (item, user) => {
    await deleteDoc(doc(db, "lists", listId, "items", item.id));
  };

  const clearChecked = async (user) => {
    const checked = items.filter((i) => i.checked);
    await Promise.all(checked.map((i) => deleteItem(i, user)));
  };

  // One-time fetch of history items from the last 30 days, newest first.
  const fetchHistory = async () => {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const q = query(
      collection(db, "lists", listId, "history"),
      where("checkedAt", ">=", cutoff),
      orderBy("checkedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  // Batch-delete every document in the history subcollection.
  const clearHistory = async () => {
    const snap = await getDocs(collection(db, "lists", listId, "history"));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  };

  return {
    items, loading,
    addItem, updateItem, toggleCheck, deleteItem, clearChecked,
    fetchHistory, clearHistory,
    persistedLearned, persistCategory,
    customCategories, updateCategories,
  };
}
