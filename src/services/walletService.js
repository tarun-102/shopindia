import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const addWalletTransaction = async (userId, entry) => {
  try {
    const userRef = doc(db, "users", userId);
    const tx = {
      type: entry.type, // 'credit' | 'debit'
      amount: entry.amount,
      note: entry.note || "",
      date: serverTimestamp(),
      meta: entry.meta || null,
    };
    await updateDoc(userRef, { "wallet.transactions": arrayUnion(tx) });
    return { success: true };
  } catch (err) {
    console.error("addWalletTransaction error:", err);
    return { success: false, error: err.message };
  }
};
