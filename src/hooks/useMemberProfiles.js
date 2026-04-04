// src/hooks/useMemberProfiles.js
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useMemberProfiles(uids = []) {
  const [profiles, setProfiles] = useState({});

  const key = uids.slice().sort().join(",");

  useEffect(() => {
    if (!uids.length) return;
    const missing = uids.filter(uid => !profiles[uid]);
    if (!missing.length) return;
    Promise.all(missing.map(uid => getDoc(doc(db, "users", uid)))).then(snaps => {
      const newProfiles = {};
      snaps.forEach(s => { if (s.exists()) newProfiles[s.id] = s.data(); });
      setProfiles(prev => ({ ...prev, ...newProfiles }));
    });
  }, [key]); // eslint-disable-line

  return profiles;
}
