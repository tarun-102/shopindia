import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const addWalletTransaction = async (userId, entry) => {
  try {
    const userRef = doc(db, "users", userId);
    
    // Optional: Fetch current balance to update it automatically if needed
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentBalance = Number(userData.wallet?.balance || 0);
      const amount = Number(entry.amount || 0);
      
      let newBalance = currentBalance;
      if (entry.type === 'credit') {
        newBalance += amount;
      } else if (entry.type === 'debit') {
        newBalance -= amount;
      }

      const tx = {
        type: entry.type, // 'credit' | 'debit'
        amount: amount,
        note: entry.note || "",
        date: new Date().toISOString(), // Fixed serverTimestamp arrayUnion issue
        meta: entry.meta || null,
      };

      // Update both balance and push transaction into array safely
      await updateDoc(userRef, { 
        "wallet.balance": newBalance,
        "wallet.transactions": arrayUnion(tx) 
      });

      return { success: true, newBalance };
    }
    return { success: false, error: "User not found" };
  } catch (err) {
    console.error("addWalletTransaction error:", err);
    return { success: false, error: err.message };
  }
};