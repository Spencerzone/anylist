// src/hooks/useMealPlan.js
import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, where, orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase";

export function useMealPlan(startDate, endDate) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startDate || !endDate) return;
    // Range query on a single field — no composite index needed.
    const q = query(
      collection(db, "mealplan"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [startDate, endDate]);

  const addMeal = async (date, meal, user) => {
    const order = meals.filter(m => m.date === date).length;
    return await addDoc(collection(db, "mealplan"), {
      ...meal,
      date,
      order,
      createdBy: user?.uid || "",
      createdAt: serverTimestamp(),
    });
  };

  const moveMeal = async (id, newDate) => {
    const order = meals.filter(m => m.date === newDate).length;
    await updateDoc(doc(db, "mealplan", id), { date: newDate, order });
  };

  const deleteMeal = async (id) => {
    await deleteDoc(doc(db, "mealplan", id));
  };

  return { meals, loading, addMeal, moveMeal, deleteMeal };
}
