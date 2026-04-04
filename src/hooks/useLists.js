// src/hooks/useLists.js
import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  setDoc, updateDoc, query, serverTimestamp,
  where, getDocs, getDoc, arrayRemove, arrayUnion, Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";

const DEFS = "listDefs";

export function useLists(user) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, DEFS),
      where("members", "array-contains", user.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return ta - tb;
        });

      // Migration: patch any listDef missing ownerUid/members
      for (const d of docs) {
        if (!d.ownerUid) {
          await updateDoc(doc(db, DEFS, d.id), {
            ownerUid: user.uid,
            members: [user.uid],
          });
          // snapshot will re-fire with updated doc
          return;
        }
      }

      setLists(docs);
      setLoading(false);
    }, (err) => {
      console.warn("listDefs snapshot error:", err);
      setLoading(false);
    });

    // Also handle the seed list (may not appear in query if it has no members yet)
    // Run a one-time check on mount
    (async () => {
      try {
        const seedRef = doc(db, DEFS, "shared-family-list");
        const seedSnap = await getDoc(seedRef);
        if (seedSnap.exists() && !seedSnap.data().ownerUid) {
          // Fetch all users to add as members of the shared seed list
          const usersSnap = await getDocs(collection(db, "users"));
          const allUids = usersSnap.docs.map(d => d.id);
          const members = Array.from(new Set([user.uid, ...allUids]));
          await updateDoc(seedRef, {
            ownerUid: user.uid,
            members,
          });
        } else if (!seedSnap.exists()) {
          // Seed the list for a brand-new user
          await setDoc(seedRef, {
            name: "Groceries",
            emoji: "🛒",
            createdAt: serverTimestamp(),
            ownerUid: user.uid,
            members: [user.uid],
          });
        }
      } catch (e) {
        // Seed list may already have members — ignore permission errors
      }
    })();

    return unsub;
  }, [user?.uid]); // eslint-disable-line

  const createList = async (name, emoji = "📋") => {
    await addDoc(collection(db, DEFS), {
      name,
      emoji,
      createdAt: serverTimestamp(),
      ownerUid: user.uid,
      members: [user.uid],
    });
  };

  const renameList = async (id, name, emoji) => {
    await updateDoc(doc(db, DEFS, id), { name, emoji });
  };

  const deleteList = async (id) => {
    await deleteDoc(doc(db, DEFS, id));
  };

  const inviteToList = async (listId) => {
    const code = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await setDoc(doc(db, "invites", code), {
      listId,
      ownerUid: user.uid,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    const url = `${window.location.origin}${window.location.pathname}?invite=${code}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      // clipboard may be unavailable — caller gets the URL anyway
    }
    return url;
  };

  const removeMember = async (listId, memberUid) => {
    const list = lists.find(l => l.id === listId);
    if (!list || list.ownerUid !== user.uid) return;
    if (memberUid === list.ownerUid) return;
    await updateDoc(doc(db, DEFS, listId), {
      members: arrayRemove(memberUid),
    });
  };

  const acceptInvite = async (code) => {
    const inviteRef = doc(db, "invites", code);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) throw new Error("Invite not found or already expired.");

    const invite = inviteSnap.data();
    const expiresAt = invite.expiresAt.toDate();
    if (new Date() > expiresAt) throw new Error("This invite link has expired.");

    await updateDoc(doc(db, DEFS, invite.listId), {
      members: arrayUnion(user.uid),
    });

    return invite.listId;
  };

  return { lists, loading, createList, renameList, deleteList, inviteToList, removeMember, acceptInvite };
}
