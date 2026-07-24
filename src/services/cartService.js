import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Saves or updates the user's cart in the database.
 * @param {string} uid - The user's unique ID.
 * @param {object} cartData - The cart state object.
 */
export const saveCartToDB = async (uid, cartData) => {
    try {
        await setDoc(doc(db, "cart", uid), cartData);
    } catch (error) {
        console.error("Error saving cart to database:", error);
    }
}

/**
 * Retrieves the user's cart from the database.
 * @param {string} uid - The user's unique ID.
 * @returns {object} The cart data or a default empty cart structure.
 */
export const getCartFromDB = async (uid) => {
    try {
        const docSnap = await getDoc(doc(db, "cart", uid));
        if (docSnap.exists()) {
            return docSnap.data(); 
        }
        return { items: [], totalQuantity: 0, totalAmount: 0 }; 
    } catch (error) {
        console.error("Error fetching cart from database:", error);
        return { items: [], totalQuantity: 0, totalAmount: 0 };
    }
};