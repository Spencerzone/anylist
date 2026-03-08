// src/hooks/useRecipes.js
import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase";

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "recipes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addRecipe = async (recipe, user) => {
    return await addDoc(collection(db, "recipes"), {
      ...recipe,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateRecipe = async (id, changes) => {
    await updateDoc(doc(db, "recipes", id), {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteRecipe = async (id) => {
    await deleteDoc(doc(db, "recipes", id));
  };

  return { recipes, loading, addRecipe, updateRecipe, deleteRecipe };
}
